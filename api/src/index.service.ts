import {Controller, REST, Bundler} from "@hotfusion/ws";
import {IBranch, IProcessor, IGatewayIntent, IHosted, IGatewayCharge} from "./index.schema";
import {Branches} from "./branches";
import {JWT,Crypto,Arguments} from "@hotfusion/ws/utils"
import {Stripe} from "./processors/stripe";
import {PayPal} from "./processors/paypal";

export default class Gateway extends Branches {
    private SECRET = Crypto.generateJWTSecret()

    @REST.html({
        defaults  : ['index.vue'],
        directory : 'src/@interface/invoice-payment'
    })
    '@invoice/:domain'(settings:{theme : string, uri : string},ctx){
        /*console.log('network:',ctx.getNetwork());
        console.log('headers:',ctx.getHeaders());
        console.log('ip:',ctx.getIp());*/

        return {
            theme  : 'dark',
            uri    : `${ctx.getHeaders()['x-forwarded-proto'] || 'http'}://${ctx.getHeaders().host}/gateway`,
            domain : ctx.getParams().domain
        }
    }
    private async getBranchDocument(query:{domain:string}){
        let branch     = await this.source.branches.findOne({domain:query.domain}) as IBranch | null;
        if(!branch)
            return null;

        let processors = await this.source.processors.find({
            _bid : branch?._id
        }).toArray() as IProcessor[];


        branch.processors = processors;
        return branch
    }
    @REST.get()
    async 'meta'(@REST.schema() branch : Pick<IBranch, "domain" >,ctx){

        let host = ctx.getHeaders().host
        let isDev = ctx.getNetwork().ips.local.find(x => host.split(':')[0]) !== undefined

        let document
            = await this.getBranchDocument(branch);

        if(!document?.name)
            throw new Error("domain was not found");

        if(!document?.processors?.length)
            throw new Error("There’s no default gateway provider configured for this branch.");

        let def = document.processors.find(x => x.default) || document.processors[0];

        let processor = await this.source.processors.findOne({
            _id : def?._id
        }) as IProcessor | null;

        if(!processor)
            throw new Error("processor was not found");

        let hosted = await this.source.hosted.find({
            _bid : processor._bid
        }).toArray() as IHosted[];

        return JWT.sign({
            gateway   : processor.gateway,
            domain    : document.domain,
            mode      : isDev ? 'development' : document.mode,
            processor : isDev ? processor     : undefined,
            created   : Date.now(),
            keys      : {
                public : processor.keys[document.mode].public,
            },
            hosted : hosted.map(x => {
                return {
                    gateway : x.gateway,
                    keys : {
                        public : x.keys[document.mode].public,
                    }
                }
            })
        },this.SECRET)
    }
    @REST.post()
    async 'charge'(@REST.schema() charge : IGatewayCharge){
        /*let branch = await this.getBranchDocument(charge)
        let processor:any;

        console.log('charge:',charge)
        if(charge.type === 'hosted'){
            processor = await this.source.hosted.findOne({
                _bid    : branch._id,
                gateway : charge.name
            });
        }else
            processor = branch.processors.find(x => x.default) || branch.processors[0];

        let card:any,intent:any;
        if(processor.gateway === "stripe"){
            let stripe
                = new Stripe(processor.keys[branch.mode].secret);

            intent = await stripe.paymentIntents.retrieve(
                charge.id
            );

            let payment
                = await stripe.paymentMethods.retrieve(intent.payment_method as string);

            if(intent.status === 'succeeded'){
                let profile:any
                    = await stripe.customers.retrieve(intent.customer as string)

                let customer = await this.source.customers.findOne({
                    email : profile.email
                });

                if(payment?.card?.last4)
                    await this.source.cards.updateOne({
                        _cid  : customer._id,
                        last4 : payment.card.last4
                    }, {
                        $set: {
                            country   : payment.card.country,
                            brand     : payment.card.brand,
                            exp_month : payment.card.exp_month,
                            exp_year  : payment.card.exp_year
                        }
                    }, {upsert : true});


                card = await this.source.cards.findOne({
                    _cid  : customer._id,
                    last4 : payment.card.last4
                });

                await this.source.receipts.insertOne({
                    _bid     : branch._id,
                    _pid     : processor._id,
                    _cid     : customer._id,
                    domain   : charge.domain,
                    amount   : intent.amount_received/100,
                    created  : new Date().valueOf(),
                    card     : card._id,
                    profile  : {
                        id : profile.id
                    }
                })
            }
        }

        if(processor.gateway === "paypal"){
            let corebox = branch.mode === 'development' ? paypal.core.SandboxEnvironment : paypal.core.LiveEnvironment
            let client = new paypal.core.PayPalHttpClient(
                new corebox(
                    processor.keys[branch.mode].public,
                    processor.keys[branch.mode].secret
                )
            );

            function calculateTotalAndGetCustomIds(order: any ) {
                let total = 0;
                const customIds: string[] = [];

                for (const unit of order.purchase_units)
                    if (unit.payments?.captures)
                        for (const capture of unit.payments.captures) {
                            total += parseFloat(capture.amount.value);
                            if (capture.custom_id) customIds.push(capture.custom_id);
                        }


                return {
                    amount : total,
                    email  : customIds[0] || order?.payer?.email_address
                };
            }

            const request = new paypal.orders.OrdersCaptureRequest(charge.id);
            request.requestBody({}); // required by SDK even if empty
            const response = await client.execute(request);
            // return the whole result or selected fields

            let {amount,email}
                = calculateTotalAndGetCustomIds(response.result);

            let customer = await this.source.customers.findOne({
                email
            });
            console.log(customer);

            let {last_digits,brand,expiry}
                = response.result.payment_source.card || {};

            if(last_digits)
                await this.source.cards.updateOne({
                    _cid  : customer._id,
                    last4 : last_digits
                }, {
                    $set: {
                        country   : null,
                        brand     : brand,
                        exp_month : expiry.split('-').pop(),
                        exp_year  : expiry.split('-').shift()
                    }
                }, {upsert : true});

            card = await this.source.cards.findOne({
                _cid  : customer._id,
                last4 : last_digits
            });

            await this.source.receipts.insertOne({
                _bid     : branch._id,
                _pid     : processor._id,
                _cid     : customer._id,
                domain   : charge.domain,
                amount   : amount,
                created  : new Date().valueOf(),
                card     : card?._id || null,
                profile  : {
                    id : null
                }
            });
            intent = {
                status: 'succeeded'
            }
        }

        return {
            card      : card || false,
            domain    : charge.domain,
            completed : intent.status === 'succeeded',
        }*/
    }
    @REST.get()
    async 'intent'(@REST.schema() intent:IGatewayIntent,ctx){

        let domain
            = ctx.getHeaders().host.split('.').slice(-2).join('.')

        let branch
               = await this.getBranchDocument({domain});

        if(!branch)
            branch
                = await this.getBranchDocument({domain:intent.domain});

        let processor
            = branch.processors.find(x => x.default) || branch.processors[0];

        //console.log(processor,branch)

        /*let customer = await this.source.customers.findOne({
            email : intent.customer.email
        });

        if(!customer) {
            await this.source.customers.insertOne({
                _bid     : branch._id,
                email    : intent.customer.email,
                name     : intent.customer.name,
                phone    : intent.customer.phone,
                profiles : []
            });

            customer = await this.source.customers.findOne({
                email : intent.customer.email
            });
        }*/

        let hosted = (await this.source.hosted.find({
            _bid     : branch._id
        }).toArray()).map((x:{gateway:string,keys: {public:string,secret:string}}) => ({
            orderID : null,
            gateway : x.gateway,
            keys    : {
                public : x.keys[branch.mode].public,
                secret : x.keys[branch.mode].secret,
            }
        }));

        console.log('hosted:',hosted);
        for (let i = 0; i < hosted.length; i++) {
            if(hosted[i].gateway === 'paypal'){
                hosted[i].orderID = await new PayPal(branch.mode, 'USD', {
                    public  : hosted[i].keys[branch.mode].public,
                    private : hosted[i].keys[branch.mode].secret
                }).capture(intent.amount,intent.customer)
            }
        }
        if(processor.gateway === 'stripe') {
            let orderID = await new Stripe(branch.mode, 'USD', {
                public  : processor.keys[branch.mode].public,
                private : processor.keys[branch.mode].secret
            }).capture(intent.amount,intent.customer)

            return {orderID, hosted};
        }

        if(processor.gateway === 'paypal') {
            let orderID = await new PayPal(branch.mode, 'USD', {
                public  : processor.keys[branch.mode].public,
                private : processor.keys[branch.mode].secret
            }).capture(intent.amount,intent.customer)

            return {orderID, hosted};
        }

    }
}
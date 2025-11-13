import {Controller, REST, Bundler} from "@hotfusion/ws";
import {IBranch, IProcessor, IGatewayIntent, IHosted, ICharge} from "./index.schema";
import {Branches} from "./branches";
import {JWT,Crypto,Arguments} from "@hotfusion/ws/utils"
import Stripe from "stripe";
import paypal from "@paypal/checkout-server-sdk";
import * as path from "node:path";


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

        let session = JWT.sign({
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

        this.session.push({
           session
        });

        return session
    }
    @REST.post()
    async 'charge'(@REST.schema() charge : ICharge){
        let branch = await this.getBranchDocument(charge)
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
        }
    }
    @REST.get()
    async 'intent'(@REST.schema() intent:IGatewayIntent,ctx){
        let branch
               = await this.getBranchDocument(intent);

        let processor
            = branch.processors.find(x => x.default) || branch.processors[0];

        //console.log(processor,branch)

        let customer = await this.source.customers.findOne({
            email : intent.email
        });

        if(!customer) {
            await this.source.customers.insertOne({
                _bid     : branch._id,
                email    : intent.email,
                name     : intent.name,
                phone    : intent.phone,
                profiles : []
            });

            customer = await this.source.customers.findOne({
                email : intent.email
            });
        }

        let profile:{id:string},client_secret:string;
        if(processor.gateway === 'stripe') {
            let stripe
                = new Stripe(processor.keys[branch.mode].secret);

            profile
                = (await stripe.customers.list({email: intent.email, limit: 1}))?.data?.[0];

            if (!profile)
                profile = await stripe.customers.create({
                    email : intent.email,
                    name  : intent.name,
                    phone : intent.phone
                });

            client_secret = (await stripe.paymentIntents.create({
                amount    : Number(intent.amount) * 100,
                currency  : intent.currency,
                customer  : profile.id,
                // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
                automatic_payment_methods: {
                    enabled: true,
                },
                metadata : {
                    customer_ip : ctx.getIp(),
                    server_ip   : ctx.getNetwork().ips.public,
                    host        : ctx.getHeaders().host
                }
            })).client_secret;

            if(profile?.id && !customer.profiles.find(x => x.id === profile.id)) {
                customer.profiles.push({
                    id : profile.id, _pid : processor._id
                })

                await this.source.customers.updateOne({
                    email : intent.email
                },{
                    $set : {
                        profiles : customer.profiles
                    }
                })
            }

            return {client_secret}
        }

        if(processor.gateway === 'paypal') {
            let sandbox
                = branch.mode === 'development'?paypal.core.SandboxEnvironment:paypal.core.LiveEnvironment;

            let client = new paypal.core.PayPalHttpClient(
                new sandbox(
                    processor.keys[branch.mode].public,
                    processor.keys[branch.mode].secret
                )
            );

            let request = new paypal.orders.OrdersCreateRequest();
                request.prefer("return=representation");
                request.requestBody({
                    intent         : "CAPTURE",
                    purchase_units : [
                        {
                            amount: {
                                currency_code : 'USD',
                                value         : intent.amount
                            },
                            custom_id : intent.email
                        }
                    ]
                });

            return {
                client_secret : (await client.execute(request)).result.id
            };
        }

    }
}
import {REST } from "@hotfusion/ws";
import {IBranch, IProcessor, ICollections, IPagination, IGatewayIntent} from "./index.schema";
import {Branches} from "./branches";
import {JWT,Crypto} from "@hotfusion/ws/utils"
import Stripe from "stripe";

//@Mongo.connect<ICollections>("mongodb://localhost:27017/payquids", ['processors','branches','customers','receipts','invoices','cards'])
/*@Authorization.provider('local',{
    adapter : {
        uri : 'mongodb://localhost:27017/payquids'
    }
})*/


export default class Gateway extends Branches{
    private SECRET = Crypto.generateJWTSecret()
    private async getBranchDocument(query:{domain:string}){
        let branch     = await this.source.branches.findOne({domain:query.domain}) as IBranch | null;
        let processors = await this.source.processors.find({
            _bid : branch._id
        }).toArray() as IProcessor[];
        branch.processors = processors;
        return branch
    }
    @REST.get()
    async 'gateway/metadata'(@REST.schema() branch : Pick<IBranch, "domain" >,ctx){
        let document
            = await this.getBranchDocument(branch);

        if(!document?.name)
            throw new Error("domain was not found");

        if(!document?.processors?.length)
            throw new Error("There’s no default gateway provider configured for this branch.");

        let def = document.processors.find(x => x.default) || document.processors[0];

        let processor = await this.source.processors.findOne({
            _id : def._id
        }) as IProcessor | null;

        if(!processor)
            throw new Error("processor was not found");

        let session = JWT.sign({
            gateway  : processor.gateway,
            domain   : document.domain,
            mode     : document.mode,
            created  : Date.now(),
            keys     : {
                public : processor.keys[document.mode].public,
            }
        },this.SECRET)

        this.session.push({
           session
        });

        return session
    }
    @REST.post()
    async 'gateway/charge'(@REST.schema() charge : Pick<IBranch, "domain" > & { id : string }){
        let branch = await this.getBranchDocument(charge)
        let processor = branch.processors.find(x => x.default) || branch.processors[0];
        let stripe
            = new Stripe(processor.keys[branch.mode].secret);

        let intent = await stripe.paymentIntents.retrieve(
            charge.id
        );

        let payment
            = await stripe.paymentMethods.retrieve(intent.payment_method as string);

        let card:any;
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
        return {
            card      : card || false,
            domain    : charge.domain,
            completed : intent.status === 'succeeded',
        }
    }
    @REST.get()
    async 'gateway/intent'(@REST.schema() intent:IGatewayIntent){
        let branch
               = await this.getBranchDocument(intent);

        let processor
            = branch.processors.find(x => x.default) || branch.processors[0];

        let stripe
            = new Stripe(processor.keys[branch.mode].secret);

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

        let profile
            = (await stripe.customers.list({email : intent.email, limit: 1}))?.data?.[0];

        if(!profile) {
            profile = await stripe.customers.create({
                email : intent.email,
                name  : intent.name,
                phone : intent.phone
            });
        }

        if(!customer.profiles.find(x => x.id === profile.id)) {
            customer.profiles.push({
                id   : profile.id,
                _pid : processor._id
            })

            await this.source.customers.updateOne({
                email : intent.email
            },{
                $set : {
                    profiles : customer.profiles
                }
            })
        }



        const {client_secret} = await stripe.paymentIntents.create({
            amount   : Number(intent.amount) * 100,
            currency : intent.currency,
            customer : profile.id,
            // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                customer_ip: '0.0.0.0'
            }
        });

        return {client_secret}
    }
}
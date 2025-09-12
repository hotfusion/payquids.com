import {REST, Controller, Authorization, Mongo, ICTX, ObjectId} from "@hotfusion/ws";
import {IBranch, IProcessor, ICollections, IPagination, IGatewayIntent} from "./index.schema";
import {Branches} from "./branches";
import Stripe from "stripe";

@Mongo.connect<ICollections>("mongodb://localhost:27017/payquids", ['processors','branches','customers','receipts','invoices','cards'])
@Authorization.provider('local')

export default class API extends Branches {
    private getBranchDocument(query:{domain:string}){
        return Mongo.$.branches.findOne<IBranch>(query)
    }
    private async getBranch(domain:string):Promise<{branch:IBranch,processor:IProcessor}>{
        let branch
            = await this.getBranchDocument({domain})

        if(!branch?.name)
            throw new Error("domain was not found");


        let processor= await Mongo.$.processors.findOne<IProcessor>({
            _id : branch.processors.find(x => x.default)._id
        })
        if(!processor)
            throw new Error("processor was not found");

        return {branch,processor};
    }
    @REST.get()
    async 'branch/metadata'(@REST.schema() branch : Pick<IBranch, "domain" >){

        let document
            = await this.getBranchDocument(branch);

        if(!document?.name)
            throw new Error("domain was not found");

        if(!document?.processors?.length)
            throw new Error("branch is not connected to the process gateway");

        let processor= await Mongo.$.processors.findOne<IProcessor>({
            _id : document.processors.find(x => x.default)._id
        })

        if(!processor)
            throw new Error("processor was not found");

        let token= {
            _pid    : processor._id,
            token   : Date.now(),
            created : Date.now()
        }

        this.tokens.push(token);

        return {
            token  : token,
            domain : document.domain,
            mode   : document.mode,
            keys   : {
                public : processor.keys[document.mode].public,
            }
        }
    }
    @REST.post()
    async 'branch/charge'(@REST.schema() charge : Pick<IBranch, "domain" > & { id : string }){
        let {branch,processor} = await this.getBranch(charge.domain)

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

            let customer = await Mongo.$.customers.findOne({
                email : profile.email
            });

            if(payment?.card?.last4)
                await Mongo.$.cards.updateOne({
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


            card = await Mongo.$.cards.findOne({
                _cid  : customer._id,
                last4 : payment.card.last4
            });

            await Mongo.$.receipts.insertOne({
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
        let {branch,processor}
               = await this.getBranch(intent.domain);

        let stripe
            = new Stripe(processor.keys[branch.mode].secret);

        let customer = await Mongo.$.customers.findOne({
            email : intent.email
        });

        if(!customer) {
           await Mongo.$.customers.insertOne({
                _bid     : branch._id,
                email    : intent.email,
                name     : intent.name,
                phone    : intent.phone,
                profiles : []
            });

            customer = await Mongo.$.customers.findOne({
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

            await Mongo.$.customers.updateOne({
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
    @Controller.on("mounted")
    async mounted(){

    }
}
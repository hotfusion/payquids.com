import {REST, Controller, Authorization, Mongo, ICTX, ObjectId} from "@hotfusion/ws";
import {IBranch, IProcessor, ICollections, IPagination, IBranchProcessorItem, IGatewayIntent} from "./index.schema";
import {Branches} from "./branches";
import Stripe from "stripe";

@Mongo.connect<ICollections>("mongodb://localhost:27017/payquids", ['processors','branches','customers','receipts','invoices'])
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

        if(intent.status === 'succeeded'){
            await Mongo.$.receipts.insertOne({
                domain   : charge.domain,
                amount   : intent.amount_received/100,
                created  : new Date().valueOf(),
                notified : false,
                receipt  : {
                    _id : undefined
                },
                processor : {
                    _id : processor._id
                },
                branch : {
                    _id : branch._id,
                },
                metadata : {
                    customer : {
                        id : intent.customer,
                        ip : intent.metadata.customer_ip,
                    }
                }
            })
        }
        return {
            domain    : charge.domain,
            completed : intent.status === 'succeeded'
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

        if(!customer)
            await Mongo.$.customers.insertOne({
                email   : intent.email,
                name    : intent.name,
                phone   : intent.phone
            });

        let profile = (await stripe.customers.list({
            email : intent.email, limit: 1
        }))?.data?.[0];

        if(!profile)
            profile = await stripe.customers.create({
                email   : intent.email,
                name    : intent.name,
                phone   : intent.phone
            });

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
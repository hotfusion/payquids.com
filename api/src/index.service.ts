import {REST, Controller, Authorization, Mongo, ICTX, ObjectId} from "@hotfusion/ws";
import {IBranch, IProcessor, ICollections, IPagination, IBranchProcessorItem, IGatewayIntent} from "./index.schema";
import {Invoice} from  "./invoice/"
import Stripe from "stripe";

@Authorization.provider('local')
@Mongo.connect<ICollections>("mongodb://localhost:27017/payquids", ['processors','branches','customers','receipts','invoices'])
class Processors extends Invoice{
    @REST.post()
    @Authorization.protect()
    async 'processors/create'(@REST.schema() processor:Pick<IProcessor, "keys" | "name" | "gateway" | "email" >, ctx:ICTX){
        let _id
            = (await Mongo.$.processors.insertOne(processor)).insertedId;

        return {_id}
    }
    @REST.get()
    @Authorization.protect()
    async 'processors/list'(@REST.schema() pagination:IPagination, ctx:ICTX){
        return await Mongo.$.processors.find({}).toArray()
    }
    @REST.post()
    @Authorization.protect()
    async 'processors/delete'(@REST.schema() processor:Pick<IProcessor, "_id" >, ctx:ICTX){
        return await Mongo.$.processors.deleteOne({
            _id: new ObjectId(processor._id)
        })
    }
}

class Branches extends Processors {
    tokens = []
    @REST.get()
    @Authorization.protect()
    async 'branches/create'(@REST.schema() branch:Pick<IBranch, "domain" | "name" | "scopes" | "mode" | "company">,ctx:ICTX) {
        let _id
            = (await Mongo.$.branches.insertOne(branch)).insertedId;

        return {_id}
    }
    @REST.get()
    @Authorization.protect()
    async 'branches/list'(@REST.schema() pagination:IPagination,ctx:ICTX) {
        return  await Mongo.$.branches.find({}).toArray()
    }
    @REST.post()
    @Authorization.protect()
    async 'branches/delete'(@REST.schema() branch:Pick<IBranch, "_id">,ctx:ICTX) {
        return await Mongo.$.branches.deleteOne({
            _id: new ObjectId(branch._id)
        });
    }

    @REST.post()
    @Authorization.protect()
    async 'branches/:_id/processors/push'(@REST.schema() processor:IBranchProcessorItem,ctx:ICTX) {

        let document = await Mongo.$.branches.findOne({
            _id: new ObjectId(ctx.getParams()._id as string)
        });

        let exists
            = document.processors.find(x => x._id.toString() === processor._id)

        if(!exists) {
            document.processors = document.processors.map((processor: any) => {
                if(processor.default)
                    processor.default = false;
                return processor
            });
            document.processors.push({...processor,_id:new ObjectId(processor._id)});
        }


        return await Mongo.$.branches.updateOne({
            _id: new ObjectId(ctx.getParams()._id as string)
        }, {
            $set: {
                processors: document.processors
            }
        });
    }
}

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
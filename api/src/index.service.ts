import {REST, Controller, Authorization, Mongo, ICTX, ObjectId} from "@hotfusion/ws";

import {IBranch, IProcessor, ICollections, IPagination, IBranchProcessorItem, IGatewayIntent} from "./index.schema";


@Authorization.provider('local')
@Mongo.connect<ICollections>("mongodb://localhost:27017/payquids", ['processors','branches','customers'])
class Processors{
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
    @REST.get()
    @Authorization.protect()
    async 'branches/create'(@REST.schema() branch:Pick<IBranch, "domain" | "name" | "scopes" | "mode">,ctx:ICTX) {
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

    @REST.get()
    async 'branch/metadata'(@REST.schema() branch : Pick<IBranch, "domain" >){
        let document = await Mongo.$.branches.findOne<IBranch>({
            domain : branch.domain
        });

        let processor = await Mongo.$.processors.findOne<IProcessor>({
            _id : document.processors.find(x => x.default)._id
        })

        return {
            domain : document.domain,
            mode   : document.mode,
            keys   : {
                public : processor.keys[document.mode].public,
            }
        }
    }

    @REST.get()
    async 'gateway/intent'(@REST.schema() branch:IGatewayIntent){

        let document = await Mongo.$.branches.findOne({
            domain : branch.domain
        });

        let processor = await Mongo.$.processors.findOne({
            _id : document.processors.find(x => x.default)._id
        })

        let stripe
            = require('stripe')(processor.keys[branch.mode].secret);

        let customer =  await Mongo.$.customers.findOne({
            email : branch.email
        });

        if(!customer){
            await Mongo.$.customers.insertOne({
                email   : branch.email,
                name    : branch.name,
                phone   : branch.phone
            });
        }

        let profile = (await stripe.customers.list({
            email : branch.email, limit: 1
        }))?.data?.[0];

        console.log(profile);
        if(!profile) {
            profile = await stripe.customers.create({
                email   : branch.email,
                name    : branch.name,
                phone   : branch.phone
            });
        }


        const {client_secret} = await stripe.paymentIntents.create({
            amount   : Number(branch.amount) * 100,
            currency : branch.currency,
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
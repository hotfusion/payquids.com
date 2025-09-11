import {Authorization, ICTX, Mongo, ObjectId, REST} from "@hotfusion/ws";
import {ICollections, IProcessor} from "../index.schema";
import {Invoice} from "../invoice";


export class Processors extends Invoice {
    @REST.post()
    @Authorization.protect()
    async 'processors/:_bid/create'(@REST.schema() processor:Pick<IProcessor, "name" | "gateway" | "email" >, ctx:ICTX){
        let _id = (await Mongo.$.processors.insertOne({
            _bid    : new ObjectId(ctx.getParams()._bid),
            name    : processor.name,
            gateway : processor.gateway,
            email   : processor.email,
            keys    : {
                production : {
                    public : false,
                    secret : false
                },
                development : {
                    public : false,
                    secret : false
                }
            }
        })).insertedId;

        return {_id}
    }
    @REST.get()
    @Authorization.protect()
    async 'processors/:_bid/delete/:_pid'({}, ctx:ICTX){
        //TODO: you cant delete processors that are part of branch that is live
        return Mongo.$.processors.deleteOne({
            _bid : new ObjectId(ctx.getParams()._bid),
            _id  : new ObjectId(ctx.getParams()._pid)
        })
    }
    @REST.get()
    @Authorization.protect()
    async 'processors/:_bid/read/:_pid'({}, ctx:ICTX){
        return Mongo.$.processors.findOne({
            _bid : new ObjectId(ctx.getParams()._bid),
            _id  : new ObjectId(ctx.getParams()._pid)
        })
    }
    @REST.get()
    @Authorization.protect()
    async 'processors/:_bid/update/:_pid'(@REST.schema() processor:Pick<IProcessor,  "name" | "gateway" | "email" >, ctx:ICTX){
        return await Mongo.$.processors.updateOne({
            _bid : new ObjectId(ctx.getParams()._bid),
            _id  : new ObjectId(ctx.getParams()._pid)
        },{
            $set : {
                name    : processor.name,
                gateway : processor.gateway,
                email   : processor.email
            }
        })
    }

    @REST.get()
    @Authorization.protect()
    async 'processors/:_bid/update/:_pid/keys'(@REST.schema() processor:Pick<IProcessor,  "keys" >, ctx:ICTX){
        return await Mongo.$.processors.updateOne({
            _bid : new ObjectId(ctx.getParams()._bid),
            _id  : new ObjectId(ctx.getParams()._pid)
        },{
            $set : {
                keys : processor.keys,
            }
        })
    }

    @REST.get()
    @Authorization.protect()
    async 'processors/:_bid/list'({}, ctx:ICTX){
        return await Mongo.$.processors.find({}).toArray()
    }

}
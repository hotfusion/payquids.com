import {Authorization, ICTX, Mongo, ObjectId, REST} from "@hotfusion/ws";
import {IBranch, IPagination, IProcessor} from "../index.schema";
import {Processors} from "../processors";

export class Branches extends Processors {
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
    async 'branches/:_bid/read'({},ctx:ICTX) {
        return await Mongo.$.branches.findOne({
            _id: new ObjectId(ctx.getParams()._bid)
        });
    }
    @REST.post()
    @Authorization.protect()
    async 'branches/:_bid/delete'({},ctx:ICTX) {
        return await Mongo.$.branches.deleteOne({
            _id: new ObjectId(ctx.getParams()._bid)
        });
    }

    @REST.post()
    @Authorization.protect()
    async 'branches/:_bid/processors/:_pid/push'(@REST.schema() processor:Pick<IProcessor,"default">,ctx:ICTX) {

        let document = await Mongo.$.branches.findOne({
            _id: new ObjectId(ctx.getParams()._bid as string)
        });
        let _pid = ctx.getParams()._pid,  processors = document.processors || [],exists = processors.length !== 0

        if(!exists) {
            processors.forEach((processor: any) => processor.default = false);
            processors.push({
                _id     : new ObjectId(_pid),
                default : true
            });
        }

        return await Mongo.$.branches.updateOne({
            _id: new ObjectId(ctx.getParams()._bid as string)
        }, {
            $set: {processors}
        });
    }
}
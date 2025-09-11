import {Authorization, ICTX, Mongo, ObjectId, REST} from "@hotfusion/ws";
import {IBranch, IBranchProcessorItem, IPagination} from "../index.schema";
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
    async 'branches/:_bid/processors/push'(@REST.schema() processor:IBranchProcessorItem,ctx:ICTX) {

        let document = await Mongo.$.branches.findOne({
            _id: new ObjectId(ctx.getParams()._bid as string)
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
            _id: new ObjectId(ctx.getParams()._bid as string)
        }, {
            $set: {
                processors: document.processors
            }
        });
    }
}
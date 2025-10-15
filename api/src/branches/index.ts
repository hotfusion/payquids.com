import {Authorization, REST} from "@hotfusion/ws";
import {IBranch, IDimaInterface, IPagination, IProcessor} from "../index.schema";
import {ObjectId} from "mongodb";
import {Processors} from "../processors";
interface ICTX {
    [key: string]: any
}
export class Branches extends Processors {
    tokens = []

    @REST.get()
    @Authorization.protect()
    async 'branches/create'(@REST.schema() branch:Pick<IBranch, "domain" | "name" | "scopes" | "mode" | "company">, ctx:ICTX) {
        let _id
            = (await this.source.branches.insertOne(branch)).insertedId;

        return {_id}
    }
    @REST.get()
    @Authorization.protect()
    async 'branches/list'(@REST.schema() pagination:IPagination,ctx:ICTX) {
        return  await this.source.branches.find({}).toArray()
    }
    @REST.post()
    @Authorization.protect()
    async 'branches/:_bid/read'({},ctx:ICTX) {
        return await this.source.branches.findOne({
            _id: new ObjectId(ctx.getParams()._bid)
        });
    }
    @REST.post()
    @Authorization.protect()
    async 'branches/:_bid/delete'({},ctx:ICTX) {
        return await this.source.branches.deleteOne({
            _id: new ObjectId(ctx.getParams()._bid)
        });
    }

    @REST.post()
    @Authorization.protect()
    async 'branches/:_bid/processors/:_pid/push'(@REST.schema() processor:Pick<IProcessor,"default">,ctx:ICTX) {

        let document = await this.source.branches.findOne({
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

        return await this.source.branches.updateOne({
            _id: new ObjectId(ctx.getParams()._bid as string)
        }, {
            $set: {processors}
        });
    }
}
import {Authorization, REST} from "@hotfusion/ws";
import {IBranch, IPagination, IProcessor} from "../index.schema";
import {ObjectId} from "mongodb";
import {Processors} from "../processors";
interface ICTX {
    [key: string]: any
}
export class Branches extends Processors {

    @REST.collection()
    async 'branches'(){
        return this.source.branches.find({}).toArray()
    }

    @REST.get()
    @Authorization.protect()
    async 'branches/create'(@REST.schema() branch:Pick<IBranch, "domain" | "name" | "scopes" | "mode" | "company">, ctx:ICTX) {
        let _id
            = (await this.source.branches.insertOne(branch)).insertedId;

        return {_id}
    }
    @REST.get(/*{
        type : Array
    }*/)
    @Authorization.protect()
    async 'branches/list'(@REST.schema() pagination:IPagination,ctx:ICTX):Promise<any[]> {
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
    async 'branches/:_bid/update/_'(@REST.schema() branch:Pick<IBranch, "domain" | "name" | "scopes" | "mode" | "company"> ,ctx:ICTX) {
        const _bid = new ObjectId(ctx.getParams()._bid)
        const _branch = await this.source.branches.findOne({_bid})

        if(!_branch)
            throw new Error(`Branches not found for ${branch.domain || branch.name || _bid.toString()}`);

        return await this.source.processors.updateOne({_bid},{
            $set : {
                domain  : branch.domain  || _branch.domain,
                name    : branch.name    || _branch.name,
                scopes  : branch.scopes  || _branch.scopes,
                mode    : branch.mode    || _branch.mode,
                company : branch.company || _branch.company
            }
        })
    }
    @REST.post()
    @Authorization.protect()
    async 'branches/:_bid/update/mode'(@REST.schema() branch:Pick<IBranch,  "mode"> ,ctx:ICTX) {
        const _id = new ObjectId(ctx.getParams()._bid)
        const _branch = await this.source.branches.findOne({_id})

        if(!_branch)
            throw new Error(`Branches not found for ${_id.toString()}`);

        return await this.source.branches.updateOne({_id},{
            $set : {
                mode    : branch.mode    || _branch.mode
            }
        })
    }
    @REST.post()
    @Authorization.protect()
    async 'branches/:_bid/update/domain'(@REST.schema() branch:Pick<IBranch,  "domain"> ,ctx:ICTX) {
        const _bid = new ObjectId(ctx.getParams()._bid)
        const _branch = await this.source.branches.findOne({_bid})

        if(!_branch)
            throw new Error(`Branches not found for ${_bid.toString()}`);

        return await this.source.processors.updateOne({_bid},{
            $set : {
                mode    : branch.domain    || _branch.domain
            }
        })
    }

   /* @REST.post()
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
    }*/
}
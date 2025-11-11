import {Authorization, REST} from "@hotfusion/ws";
import {Collection, ObjectId} from "mongodb";
import {IBranch, ICollections, IProcessor} from "../index.schema";
import {Invoice} from "../invoice";
import paypal from "@paypal/checkout-server-sdk";
interface ICTX {
    [key: string]: any
}

export class Processors extends Invoice {
    @REST.collection()
    async 'processors'(){
        return this.source.processors.find({}).toArray()
    }
    @REST.post()
    @Authorization.protect()
    async ':_bid/processors/create'(@REST.schema() processor:Pick<IProcessor, "name" | "gateway" | "email" | "keys">, ctx:ICTX){

        let _bid = new ObjectId(ctx.getParams()._bid)
        let availabilities = ['checkout','gateway'];

        if(processor.gateway === 'stripe'){
            //&& (await stripe(keys.private).accounts.retrieve())?.object !== 'account'
        }

        if(processor.gateway === 'paypal'){
            let modes = ['development','production'];
            for(let i = 0; i < modes.length; i++)
                if(processor?.keys?.[modes[i]]?.public && processor?.keys?.[modes[i]]?.secret){

                    let sandbox
                        = modes[i] === 'development'? paypal.core.SandboxEnvironment : paypal.core.LiveEnvironment;

                    let client = new paypal.core.PayPalHttpClient(
                        new sandbox(processor.keys[modes[i]].public, processor.keys[modes[i]].secret)
                    );

                }
        }
        //
        let _id = (await this.source.processors.insertOne({
            _bid           : _bid,
            name           : processor.name,
            gateway        : processor.gateway,
            email          : processor.email,
            availabilities : availabilities,
            keys    : {
                production : {
                    public : processor?.keys?.production?.public || false,
                    secret : processor?.keys?.production?.secret || false
                },
                development : {
                    public  : processor?.keys?.development?.public || false,
                    secret  : processor?.keys?.development?.secret || false
                }
            }
        })).insertedId;

        return {_id}
    }
    @REST.get()
    @Authorization.protect()
    async ':_bid/processors/:_pid/delete'({}, ctx:ICTX){
        //TODO: you cant delete processors that are part of branch that is live
        return this.source.processors.deleteOne({
            _bid : new ObjectId(ctx.getParams()._bid),
            _id  : new ObjectId(ctx.getParams()._pid)
        })
    }
    @REST.get()
    @Authorization.protect()
    async ':_bid/processors/:_pid/read'({}, ctx:ICTX){
        return this.source.processors.findOne({
            _bid : new ObjectId(ctx.getParams()._bid),
            _id  : new ObjectId(ctx.getParams()._pid)
        })
    }
    @REST.get()
    @Authorization.protect()
    async ':_bid/processors/:_pid/update'(@REST.schema() processor:Pick<IProcessor,  "name" | "gateway" | "email" >, ctx:ICTX){
        return await this.source.processors.updateOne({
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
    async ':_bid/processors/:_pid/keys'(@REST.schema() processor:Pick<IProcessor,  "keys" >, ctx:ICTX){
        return await this.source.processors.updateOne({
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
    async ':_bid/processors/:_pid/default'({}, ctx:ICTX){
        await this.source.processors.updateOne({
            _bid    : new ObjectId(ctx.getParams()._bid),
            default : true
        },{
            $set : {
                default : false
            }
        })

       return await this.source.processors.updateOne({
           _bid : new ObjectId(ctx.getParams()._bid),
           _id  : new ObjectId(ctx.getParams()._pid)
       },{
           $set : {
               default : true
           }
       })
    }
    @REST.get()
    @Authorization.protect()
    async ':_bid/processors/list'({}, ctx:ICTX){
        return await this.source.processors.find({}).toArray()
    }
}
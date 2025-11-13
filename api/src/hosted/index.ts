import {Authorization, REST} from "@hotfusion/ws";
import { ObjectId} from "mongodb";
import { IHosted } from "../index.schema";
import {Invoice} from "../invoice";
import paypal from "@paypal/checkout-server-sdk";
interface ICTX {
    [key: string]: any
}

export class Hosted extends Invoice {
    @REST.collection()
    async 'hosted'(){
        return this.source.hosted.find({}).toArray()
    }
    @REST.post()
    @Authorization.protect()
    async ':_bid/hosted/create'(@REST.schema() hosted:Pick<IHosted, "name" | "gateway" | "email" | "keys">, ctx:ICTX){
        let _bid = new ObjectId(ctx.getParams()._bid)
        let availabilities = ['checkout','gateway'];



        if(hosted.gateway === 'paypal'){
            let modes = ['development','production'];
            for(let i = 0; i < modes.length; i++)
                if(hosted?.keys?.[modes[i]]?.public && hosted?.keys?.[modes[i]]?.secret){

                    let sandbox
                        = modes[i] === 'development'? paypal.core.SandboxEnvironment : paypal.core.LiveEnvironment;

                    let client = new paypal.core.PayPalHttpClient(
                        new sandbox(hosted.keys[modes[i]].public, hosted.keys[modes[i]].secret)
                    );

                }
        }
        //
        let _id = (await this.source.hosted.insertOne({
            _bid           : _bid,
            name           : hosted.name,
            gateway        : hosted.gateway,
            email          : hosted.email,
            availabilities : availabilities,
            keys    : {
                production : {
                    public : hosted?.keys?.production?.public || false,
                    secret : hosted?.keys?.production?.secret || false
                },
                development : {
                    public  : hosted?.keys?.development?.public || false,
                    secret  : hosted?.keys?.development?.secret || false
                }
            }
        })).insertedId;

        return {_id}
    }
    @REST.get()
    @Authorization.protect()
    async ':_bid/hosted/:_hid/delete'({}, ctx:ICTX){
        //TODO: you cant delete processors that are part of branch that is live
        return this.source.hosted.deleteOne({
            _bid : new ObjectId(ctx.getParams()._bid),
            _id  : new ObjectId(ctx.getParams()._pid)
        })
    }
    @REST.get()
    @Authorization.protect()
    async ':_bid/hosted/:_hid/read'({}, ctx:ICTX){
        return this.source.hosted.findOne({
            _bid : new ObjectId(ctx.getParams()._bid),
            _id  : new ObjectId(ctx.getParams()._pid)
        })
    }
    @REST.get()
    @Authorization.protect()
    async ':_bid/hosted/:_hid/update'(@REST.schema() hosted:Pick<IHosted,  "name" | "gateway" | "email" >, ctx:ICTX){
        return await this.source.hosted.updateOne({
            _bid : new ObjectId(ctx.getParams()._bid),
            _id  : new ObjectId(ctx.getParams()._pid)
        },{
            $set : {
                name    : hosted.name,
                gateway : hosted.gateway,
                email   : hosted.email
            }
        })
    }
    @REST.get()
    @Authorization.protect()
    async ':_bid/hosted/:_hid/keys'(@REST.schema() hosted:Pick<IHosted,  "keys" >, ctx:ICTX){
        return await this.source.hosted.updateOne({
            _bid : new ObjectId(ctx.getParams()._bid),
            _id  : new ObjectId(ctx.getParams()._pid)
        },{
            $set : {
                keys : hosted.keys,
            }
        })
    }
    @REST.get()
    @Authorization.protect()
    async ':_bid/hosted/:_hid/default'({}, ctx:ICTX){
        await this.source.hosted.updateOne({
            _bid    : new ObjectId(ctx.getParams()._bid),
            default : true
        },{
            $set : {
                default : false
            }
        })

        return await this.source.hosted.updateOne({
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
    async ':_bid/hosted/list'({}, ctx:ICTX){
        return await this.source.hosted.find({}).toArray()
    }
}
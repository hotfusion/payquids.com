import {Authorization, REST} from "@hotfusion/ws"
import {ObjectId} from "mongodb";
import type {ICustomer, ICustomerProcessorProfile} from "../index.schema";

import {Companies} from "../companies";
interface ICTX {
    [key: string]: any
}

export class Customers extends  Companies {
    @REST.post()
    @Authorization.protect()
    async ':_bid/customers/create'(@REST.schema() customer:Pick<ICustomer, 'email' | 'name' | 'address' | 'phone'>, ctx:ICTX){
        let _id = (await this.source.customers.insertOne({
            _bid    : new ObjectId(ctx.getParams()._bid),
            email   : customer.email,
            name    : customer.name,
            address : customer.address,
            phone   : customer.phone
        })).insertedId;
        return { _id };
    }
    @REST.get()
    @Authorization.protect()
    async ':_bid/customers/list'({}, ctx:ICTX){
        return this.source.customers.find({
            _bid : new ObjectId(ctx.getParams()._bid)
        }).toArray();
    }
    @REST.post()
    @Authorization.protect()
    async ':_bid/customers/:_cid/update'(@REST.schema() customer:Pick<ICustomer, 'email' | 'name' | 'address' | 'phone'>, ctx:ICTX){
        let document = await this.source.customers.findOne({
            _id : new ObjectId(ctx.getParams()._cid),
            _bid : new ObjectId(ctx.getParams()._bid)
        })

        let _id = (await this.source.customers.updateOne({
            _id : document._id
        },{
            $set: {
                email    : customer.email   || document.email,
                name     : customer.name    || document.name,
                address  : customer.address || document.address,
                phone    : customer.phone   || document.phone,
                profiles : []
            }
        }));
        return { _id };
    }
    @REST.post()
    @Authorization.protect()
    async ':_bid/customers/:_cid/delete'({}, ctx:ICTX){
        return this.source.customers.deleteOne({
            _id : new ObjectId(ctx.getParams()._cid),
            _bid : new ObjectId(ctx.getParams()._bid)
        })
    }
    @REST.get()
    @Authorization.protect()
    async ':_bid/customers/:_cid/read'({}, ctx:ICTX){
        return this.source.customers.findOne({
            _id : new ObjectId(ctx.getParams()._cid),
            _bid : new ObjectId(ctx.getParams()._bid)
        })
    }
    @REST.get()
    @Authorization.protect()
    async ':_bid/customers/:_cid/profiles/push'(@REST.schema() profile:ICustomerProcessorProfile, ctx:ICTX){
        let document =  await this.source.customers.findOne({
            _id : new ObjectId(ctx.getParams()._cid),
            _bid : new ObjectId(ctx.getParams()._bid)
        })
        document.profiles
            = document.profiles || [];

        if(!document.profiles.find(x => x.id === profile.id))
            document.profiles.push(profile);

        (await this.source.customers.updateOne({
            _id : document._id
        },{
            $set: {
                profiles : document.profiles
            }
        }));

        return profile
    }
    @REST.get()
    @Authorization.protect()
    async ':_bid/customers/:_cid/profiles/list'(@REST.schema() profile:ICustomerProcessorProfile, ctx:ICTX){
        let document =  await this.source.customers.findOne({
            _id : new ObjectId(ctx.getParams()._cid),
            _bid : new ObjectId(ctx.getParams()._bid)
        })
        return {
            profiles : document.profiles
        }
    }
    @REST.get()
    @Authorization.protect()
    async ':_bid/customers/:_cid/profiles/remove'(@REST.schema() profile:ICustomerProcessorProfile, ctx:ICTX){
        let document =  await this.source.customers.findOne({
            _id  : new ObjectId(ctx.getParams()._cid),
            _bid : new ObjectId(ctx.getParams()._bid)
        });

        document.profiles
            = (document.profiles || []).filter(x => x.id !== profile.id);

        await this.source.customers.updateOne({
            _id : document._id
        },{
            $set: {
                profiles : document.profiles
            }
        });

        return profile
    }

}
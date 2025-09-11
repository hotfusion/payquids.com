import {Authorization, ICTX, Mongo, ObjectId, REST} from "@hotfusion/ws"
import type {ICustomer} from "../index.schema";

export class Customers {
    @REST.post()
    @Authorization.protect()
    async 'customers/:_bid/create'(@REST.schema() customer:Pick<ICustomer, 'email' | 'name' | 'address'>, ctx:ICTX){
        let _id = (await Mongo.$.customers.insertOne(customer)).insertedId;
        return { _id };
    }
    @REST.post()
    @Authorization.protect()
    async 'customers/:_bid/update/:_cid'(@REST.schema() customer:Pick<ICustomer, 'email' | 'name' | 'address' | 'phone'>, ctx:ICTX){
        let document = await Mongo.$.customers.findOne({
            _id : new ObjectId(ctx.getParams()._cid),
            _bid : new ObjectId(ctx.getParams()._bid)
        })

        let _id = (await Mongo.$.customers.updateOne({
            _id : document._id
        },{
            $set: {
                email : customer.email || document.email,
                name : document.name || document.name,
                address : document.address || document.address,
                phone : document.phone || document.phone
            }
        }));
        return { _id };
    }
    @REST.post()
    @Authorization.protect()
    async 'customers/:_bid/delete/:_cid'(@REST.schema() customer:Pick<ICustomer, 'email' | 'name' | 'address'>, ctx:ICTX){
        return Mongo.$.customers.deleteOne({
            _id : new ObjectId(ctx.getParams()._cid),
            _bid : new ObjectId(ctx.getParams()._bid)
        })
    }
    @REST.get()
    @Authorization.protect()
    async 'customers/:_bid/list/:_cid'(@REST.schema() customer:Pick<ICustomer, 'email' | 'name' | 'address'>, ctx:ICTX){
        return Mongo.$.customers.find({
            _bid : new ObjectId(ctx.getParams()._bid)
        }).toArray();
    }
    @REST.get()
    @Authorization.protect()
    async 'customers/:_bid/read/:_cid'(@REST.schema() customer:Pick<ICustomer, 'email' | 'name' | 'address'>, ctx:ICTX){
        return Mongo.$.customers.findOne({
            _id : new ObjectId(ctx.getParams()._cid),
            _bid : new ObjectId(ctx.getParams()._bid)
        })
    }
}
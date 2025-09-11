import {Authorization, ICTX, Mongo, ObjectId, REST} from "@hotfusion/ws"
import type {ICustomer} from "../index.schema";

export class Customers {
    @REST.post()
    @Authorization.protect()
    async 'customers/:_bid/create'(@REST.schema() customer:Pick<ICustomer, 'email' | 'name' | 'address' | 'phone'>, ctx:ICTX){
        let _id = (await Mongo.$.customers.insertOne({
            _bid : new ObjectId(ctx.getParams()._bid),
            email : customer.email,
            name : customer.name,
            address : customer.address ,
            phone : customer.phone
        })).insertedId;
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
                name : customer.name || document.name,
                address : customer.address || document.address,
                phone : customer.phone || document.phone
            }
        }));
        return { _id };
    }
    @REST.post()
    @Authorization.protect()
    async 'customers/:_bid/delete/:_cid'({}, ctx:ICTX){
        return Mongo.$.customers.deleteOne({
            _id : new ObjectId(ctx.getParams()._cid),
            _bid : new ObjectId(ctx.getParams()._bid)
        })
    }
    @REST.get()
    @Authorization.protect()
    async 'customers/:_bid/list'({}, ctx:ICTX){
        return Mongo.$.customers.find({
            _bid : new ObjectId(ctx.getParams()._bid)
        }).toArray();
    }
    @REST.get()
    @Authorization.protect()
    async 'customers/:_bid/read/:_cid'({}, ctx:ICTX){
        return Mongo.$.customers.findOne({
            _id : new ObjectId(ctx.getParams()._cid),
            _bid : new ObjectId(ctx.getParams()._bid)
        })
    }
}
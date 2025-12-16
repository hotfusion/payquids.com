import {Authorization, REST} from "@hotfusion/ws"
import {ObjectId} from "mongodb";
import {ICompany, type ICustomer} from "../index.schema";
import {DB} from "../index";

interface ICTX {
    [key: string]: any
}

export class Companies extends DB {
    @REST.post()
    async ':_bid/companies/create'(@REST.schema() item:Pick<ICompany, 'email' | 'name' | 'address' | 'phone'>, ctx: ICTX) {
        let _id = (await this.source.companies.insertOne(item)).insertedId;
        return {_id};
    }
    @REST.get()
    async ':_bid/companies/list'({}, ctx: ICTX) {
        return this.source.companies.find({}).toArray();
    }
    @REST.post()
    async ':_bid/companies/update'(@REST.schema() item: any, ctx: ICTX) {
    }
    @REST.post()
    async ':_bid/companies/delete'({}, ctx: ICTX) {
    }
    @REST.get()
    async ':_bid/companies/read'({}, ctx: ICTX) {

    }
}
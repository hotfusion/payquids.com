
import {InvoiceModule} from "./module";
import {Authorization, ICTX, Mongo, REST} from "@hotfusion/ws";
import {IInvoice} from "../index.schema";

export class Invoice  {
    @REST.post()
    @Authorization.protect()
    async 'invoices/create'(@REST.schema() invoice:Omit<IInvoice, '_id' | 'created'>, ctx:ICTX){
        let _id = (await Mongo.$.invoices.insertOne(invoice)).insertedId;

        return { _id };
    }
}

import {InvoiceModule} from "./module";
import {Authorization, ICTX, Mongo, ObjectId, REST} from "@hotfusion/ws";
import {IInvoice} from "../index.schema";

export class Invoice  {
    @REST.post()
    @Authorization.protect()
    async 'invoices/create'(@REST.schema() invoice:Omit<IInvoice, '_id' | 'created'>, ctx:ICTX){
        let _id = (await Mongo.$.invoices.insertOne(invoice)).insertedId;

        return { _id };
    }
    @REST.post()
    @Authorization.protect()
    async 'invoices/list'({},ctx:ICTX){
        return await Mongo.$.invoices.find({}).toArray();
    }

    @REST.post()
    @Authorization.protect()
    /**
     * Update invoice by providing invoice id (_id) inside the path
     *
     * @param {number} invoice -
     */
    async 'invoices/:_id/update'(@REST.schema() invoice:Omit<IInvoice, '_id' | 'created'>, ctx:ICTX){
        let _id = (await Mongo.$.invoices.insertOne(invoice)).insertedId;

        return { _id };
    }
    @REST.post()
    @Authorization.protect()
    async 'invoices/:_id/delete'(@REST.schema() invoice:Omit<IInvoice, '_id' | 'created'>, ctx:ICTX){
        let _id = (await Mongo.$.invoices.insertOne(invoice)).insertedId;

        return { _id };
    }
    @REST.post()
    @Authorization.protect()
    async 'invoices/:_id/read'({},ctx:ICTX){
        let invoice = await Mongo.$.invoices.findOne({
            _id : new ObjectId(ctx.getParams()._id)
        });

        return invoice;
    }
    @REST.post()
    @Authorization.protect()
    async 'invoices/:_id/:_zid/html'({},ctx:ICTX){
        console.log(ctx.getParams())
        let document = await Mongo.$.invoices.findOne({
            _id : new ObjectId(ctx.getParams()._id)
        });

        const invoice = await new InvoiceModule(
            { email: 'jane@example.com', name: 'Jane Smith', address: '123 Client Road, City, State, ZIP' },
            { name: 'Collector Solutions', address: '789 Service Avenue, City, State, ZIP', phone: '(123) 456-7890', email: 'support@collectorsolutions.com' }
        ).create('collectors', [
            { service: 'Debt Collection', description: 'Collection of outstanding balance for Q4 2025', amount: 1200 },
            { service: 'Administrative Fee', description: 'Processing and handling fee', amount: 150 },
            { service: 'Collection Commission', description: 'Commission for recovery (15%)', amount: 180 },
        ], [
            { policy: 'payment-terms', value: 'Due within 15 days from invoice date' },
            { policy: 'late-payment', value: '1.5% monthly interest fee applies to overdue balances' },
            { policy: 'service-guarantee', value: 'We ensure compliance with all applicable collection regulations' },
            { policy: 'dispute-resolution', value: 'Any disputes must be reported within 7 days of invoice receipt' },
            { policy: 'contact', value: `For inquiries, reach us at {this.merchant.email} or {this.merchant.phone}` },
        ]);


        console.log(invoice);

        return invoice;
    }
}
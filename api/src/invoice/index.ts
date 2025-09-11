
import {InvoiceModule} from "./module";
import {Authorization, ICTX, Mongo, ObjectId, REST} from "@hotfusion/ws";
import {IInvoice} from "../index.schema";
import {Customers} from "../customers";

export class Invoice extends Customers {
    @REST.post()
    @Authorization.protect()
    async ':_bid/invoices/create/:_pid/:_cid'(@REST.schema() invoice:Omit<IInvoice, '_id' | '_bid' | '_pid' | '_cid' | 'created'>, ctx:ICTX){
        let _id = (await Mongo.$.invoices.insertOne({
            _bid     : new ObjectId(ctx.getParams()._bid),
            _pid     : new ObjectId(ctx.getParams()._pid),
            _cid     : new ObjectId(ctx.getParams()._cid),
            amount   : {
                value    : invoice.amount,
                currency : invoice.amount.currency || 'usd'
            },
            paid     : false,
            due      : new Date().valueOf(),
            created  : new Date().valueOf(),
            type     : invoice.type,
            items    : invoice.items || [],
            policies : invoice.policies || []
        })).insertedId;

        return { _id };
    }
    @REST.post()
    @Authorization.protect()
    /**
     * Update invoice by providing invoice id (_id) inside the path
     *
     * @param {number} invoice -
     */
    async ':_bid/invoices/:_iid/update'(@REST.schema() invoice:Omit<IInvoice, '_id' | 'created'>, ctx:ICTX){
        let _id = (await Mongo.$.invoices.insertOne(invoice)).insertedId;

        return { _id };
    }
    @REST.post()
    @Authorization.protect()
    async ':_bid/invoices/:_iid/delete'(@REST.schema() invoice:Omit<IInvoice, '_id' | 'created'>, ctx:ICTX){
        let _id = (await Mongo.$.invoices.insertOne(invoice)).insertedId;

        return { _id };
    }
    @REST.post()
    @Authorization.protect()
    async ':_bid/invoices/:_iid/read'({},ctx:ICTX){
        let invoice = await Mongo.$.invoices.findOne({
            _id : new ObjectId(ctx.getParams()._id)
        });

        return invoice;
    }
    @REST.post()
    @Authorization.protect()
    async ':_bid/invoices/list'({},ctx:ICTX){
        return await Mongo.$.invoices.find({}).toArray();
    }
    @REST.post()
    @Authorization.protect()
    async ':_bid/invoices/html/:_id'({},ctx:ICTX){
        console.log(ctx.getParams())
        let document = await Mongo.$.invoices.findOne({
            _id : new ObjectId(ctx.getParams()._id)
        });

        console.log('document:',document)
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

import {InvoiceModule} from "./module";
import {Authorization, ICTX, Mongo, ObjectId, REST} from "@hotfusion/ws";
import {IInvoice} from "../index.schema";
import {Customers} from "../customers";
import {HtmlToPdf} from "../_.components/HtmltoPdf";


class InvoiceUtils {
    static async PDF(_iid:string): Promise<any> {
        let html = await InvoiceUtils.HTML(_iid);
        let converter
            = new HtmlToPdf();

        let buffer
            = await converter.convert(html);

        await converter.close();
        return buffer.toString("base64")
    }
    static async HTML(_iid:string){
        let document = await Mongo.$.invoices.findOne({
            _id : new ObjectId(_iid)
        });

        let customer = await Mongo.$.customers.findOne({
            _id : document._cid as string
        });

        let branch = await Mongo.$.branches.findOne({
            _id : document._bid  as string
        });

        return await new InvoiceModule({
            email   : customer.email,
            name    : customer.name,
            address : customer.address,
            phone   : customer.phone
        }, {
            name    : branch.company.name,
            address : branch.company.address,
            phone   : branch.company.phone,
            email   : branch.company.email
        }).create('collectors', [
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
    }
}
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
            _id : new ObjectId(ctx.getParams()._id as string)
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
    async ':_bid/invoices/:_iid/format/pdf'({},ctx:ICTX){
        ctx.setHeader('output-type', 'application/pdf');
        return await InvoiceUtils.PDF(ctx.getParams()._iid);
    }
    @REST.post()
    @Authorization.protect()
    async ':_bid/invoices/:_iid/format/html'({},ctx:ICTX){
        ctx.setHeader('output-type', 'text/html');
        return await InvoiceUtils.HTML(ctx.getParams()._iid);
    }
}
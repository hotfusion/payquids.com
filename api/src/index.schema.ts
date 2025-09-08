// TODO:
// this is not working, also (@REST.schema() branch : IBranch & { token : IString })) wont work
//@ts-ignore
import type {TString} from "./default.types";
export interface IProcessor {_id:string, default :boolean}[]
export interface IBranch  {
    _id        : string;
    _uid       : string;
    name       : string;
    domain     : TString<{min:3,max:200}>;
    mode       : "production" | "development";
    processors : IProcessor[]
    scopes     : ( "donation" | "invoice" | "products")[]
}

export interface ICharge {

}

export interface IProcessor {
    _id     : string
    _uid    : string;
    name    : string;
    email   : string;
    gateway : 'stripe' | 'paypal'
    keys    : {
        production : {
            public : string
            secret : string
        },
        development : {
            public : string
            secret : string
        }
    }
}

export interface IPagination  {
    page : number;
    size : number;
}

export interface IBranchProcessorItem {_id:string, default:boolean}
export interface IGatewayIntent {
    domain:string,
    amount:number,
    email:string
    name:string
    phone : string
    currency:"usd" | "cad",
    scope: "invoice" | "products" | "donation",
    mode:"production" | "development"
}

export interface IInvoice {
    _id    : string;
    amount : {
        value    : number
        currency : 'usd' | 'cad'
    }
    processor : {
        _id : string
    },
    branch  : {
        _id : string,
    },
    paid    : boolean,
    due     : number
    created : string
}
export interface IReceipt {
    _id : string
    domain   : string
    amount   : number
    created  : number
    notified : false,
    processor : {
        _id : string
    },
    branch : {
        _id : string,
    },
    metadata : {
        customer : {
            id : string,
            ip : string,
        }
    }
}
export type ICollections = {
    processors  : IProcessor;
    branches    : IBranch
    receipts    : IReceipt
    customers   : any
    invoices    : IInvoice
}
// TODO:
// this is not working, also (@REST.schema() branch : IBranch & { token : IString })) wont work
//@ts-ignore
import type {TString} from "./default.types";




export interface IProcessor {_id:string, default :boolean}[]
export interface IBranch {
    _id        : TString<{min:3, max:100 }>;
    _uid       : TString<{min:3, max:100 }>;
    name       : TString<{min:3, max:100 }>;
    domain     : TString<{min:3, max:100 }>;
    mode       : "production" | "development";
    processors : IProcessor[]
    scopes     : ( "donation" | "invoice" | "products")[],
    company    : {
        name    : TString<{min:3, max:100}>
        address : TString<{min:3, max:200}>
        phone   : TString<{min:3, max:15}>
        email   : TString<{min:3, max:100}>
    }
}
export interface IProcessor {
    _id     : string
    _uid    : string;
    name    : string;
    email   : string;
    default : boolean
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



export interface ICustomer {
    _id      : string;
    _bid     : string;
    email    : TString<{min:10,max:100}>;
    name    ?: TString<{min:10,max:100}>;
    address ?: TString<{min:10,max:100}>;
    phone   ?: TString<{min:10,max:100}>;
    profiles : {
        id   : string,
        _pid : string
    }[];
}

interface IMerchant {
    name: string;
    address: string;
    phone: string;
    email: string;
}

interface IServiceItem {
    service: string;
    description: string;
    hours: number;
    rate: number;
}

interface IProductItem {
    product: string;
    price: number;
    quantity: number;
}

interface ICollectorItem {
    service: string;
    description: string;
    amount: number;
}

interface IPolicy {
    policy: string;
    value: string;
}
type date = string
export interface IInvoice {
    _id    : string;
    // processor _id
    _pid   : TString<{min:10,max:100,description:'Processor _id'}>
    // branch id
    _bid   : TString<{min:10,max:100,description:'Processor _id'}>
    // customer id
    _cid : TString<{min:10,max:100,description:'Processor _id'}>

    amount : {
        value    : number
        currency : 'usd' | 'cad'
    }
    paid    : boolean
    due     : date
    created : string
    type    : 'services' | 'products' | 'collectors',
    items   : (IServiceItem | IProductItem | ICollectorItem)[]
    policies: IPolicy[]
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
    customers   : ICustomer
    invoices    : IInvoice
}
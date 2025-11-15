// TODO:
// this is not working, also (@REST.schema() branch : IBranch & { token : IString })) wont work
//@ts-ignore
import type {TString} from "./default.types";

type date = string
type TProcessorsList = "paypal" | "stripe";
type TModesList      = "development" | "production";
type THostedList     = "paypal";

export interface XBranchMeta {
    gateway : TProcessorsList
    domain  : string
    mode    : TModesList
    created : number
    iat     : number
    keys    : {
        public: string
    },
    hosted: [
        {
            gateway: THostedList
            keys: {
                "public": string
            }
        }
    ],
    // only for localhost
    processor?: IProcessor
}
//export interface IProcessor {_id:string, default :boolean}[]
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

export interface IGatewayIntent {
    domain  ?: string
    amount   : number
    invoice  : string
    customer : {
        name ?:string
        email :string
        phone ?:string
    }
}

export interface IGatewayCharge {
    amount : number
    customer : {
        name ?:string
        email ?:string
        phone ?:string
    }
}
export interface IHosted {
    _id     : string
    _uid    : string;
    name    : string;
    email   : string;
    default : boolean
    gateway : 'paypal'
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
export interface IProcessor {
    _id      : string;
    _bid     : string;
    _uid     : string;
    name     : string;
    email    : string;
    default  : boolean
    type     : "hosted" | "gateway"
    provider : "stripe" | "paypal"
    keys     : {
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
export interface ICustomerProcessorProfile {
    _pid : string;
    id : string;
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
export interface IDimaInterface{
    test : string;
    name : string;
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
    cards       : {
        _id       : string
        email     : string
        last4     : string
        name      : string
        country   : string
        brand     : string
        exp_month : string
        exp_year  : string
    }[]
}
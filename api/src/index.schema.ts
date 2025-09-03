export interface IBranch {
    _id        : string;
    _uid       : string;
    name       : string;
    domain     : string;
    processors : {_id:string, default :boolean}[]
    scopes     : ( "donation" | "invoice" | "products")[]
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
export type ICollections = {
    processors  : IProcessor;
    branches    : IBranch
    customers   : any
}
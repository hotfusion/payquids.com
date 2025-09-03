export interface IBranch {
    _id        : string;
    _uid       : string;
    name       : string;
    domain     : string;
    processors : string[]
}

export interface IProcessor {
    _id     : string
    _uid    : string;
    name    : string;
    gateway : 'stripe' | 'paypal'
    keys    : {
        public : string
        secret : string
    }
}

export type ICollections = {
    processors  : IProcessor;
    branch      : IBranch
}
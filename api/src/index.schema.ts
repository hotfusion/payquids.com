export interface IUserRegistration {
    name : string
    email : string
    password: string
    confirm : string
}
export interface IUserCredentials {
    email : string
    password: string
}
export interface ICollections {
    processors: {
        _id    : string;
        name   : string;
        status : string;
    };
    branch: {
        _id     : string;
        name    : string;
        address : string;
    }
}


export interface IBranch {
    _id        : string;
    _uid       : string;
    name       : string;
    domain     : string;
    processors : string[]
}

export interface IProcessor {
    _id  : string
    keys : {
        public : string
        secret : string
    }
}


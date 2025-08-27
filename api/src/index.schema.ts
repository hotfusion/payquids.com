export interface IUserRegistration {
    email : string
    password: string
    confirm : string
}
export interface IUserCredentials {
    email : string
    password: string
    confirm : string
}
export interface IBranch {
    name: string
}

export interface IProcessor {
    name : string
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
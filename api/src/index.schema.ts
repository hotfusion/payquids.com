export interface IBranch {
    name: string
}

export interface IProcessor {}

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
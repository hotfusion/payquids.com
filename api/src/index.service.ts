import {REST,Controller,Authorization, Mongo} from "@hotfusion/ws";
import type {IBranch, IProcessor} from "./index.schema";

interface ICollections {
    $processor: {
        _id: string;
        name: string;
        status: string;
    };
    $branch: {
        _id: string;
        name: string;
        address: string;
    };
    $test: {
        _id: string;
        name: string;
        address: string;
    };
}



class Processors {
    @REST.post()
    'processor/create'(@REST.schema() processor:IProcessor){
        Mongo.$processor.insertOne(processor);
    }
}


@Mongo.connect<ICollections>("mongodb://localhost:27017/payquids",['$processor','$branch','$test'])
export default class API extends Processors {
    @REST.get()
    'branch/create'(@REST.schema() branch:IBranch) {


        return {
            message :`branch ${branch.name} created successfully`
        }
    }
    @Controller.on("mounted")
    async mounted(){

    }
}
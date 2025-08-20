import {REST,Controller,Authorization, Mongo} from "@hotfusion/ws";
import type {IBranch, IProcessor} from "./index.schema";

class Processors {
    @REST.post()
    'processor/create'(@REST.schema() processor:IProcessor){

    }
}
@Mongo.connect("mongodb://localhost:27017/payquids",['processor'])
export default class API extends Processors {

    constructor() {
        super();
    }
     @REST.get()
     'branch/create'(@REST.schema() branch:IBranch) {

         Mongo.f.insert({})
         return {
             message :`branch ${branch.name} created successfully`
         }
     }
}
import {REST,Controller,Authorization, Mongo} from "@hotfusion/ws";
import type {IBranch, IProcessor,ICollections} from "./index.schema";

@Mongo.connect<ICollections>("mongodb://localhost:27017/payquids", ['processors'])
class Processors {
    @REST.post()
    'processor/create'(@REST.schema() processor:IProcessor){
        Mongo.$.processor.insertOne({})
    }
}

export default class API extends Processors {
    @REST.get()
    'branch/create'(@REST.schema() branch:IBranch) {
        return {
            message :`branch ${branch.name} created successfully`
        }
    }
    @Controller.on("mounted")
    @Authorization.protect()
    async mounted(){
        Mongo.$.processors.insertOne({
            name : 'vadim'
        });
    }
}
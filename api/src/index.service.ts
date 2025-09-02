import {REST,Controller,Authorization, Mongo} from "@hotfusion/ws";
import {Workspace} from "./workspace";
import type {IBranch, IProcessor,ICollections} from "./index.schema";


@Authorization.provider('local')
@Mongo.connect<ICollections>("mongodb://localhost:27017/payquids", ['processors'])
class Processors{
    @REST.post()
    'processor/create'(@REST.schema() processor:IProcessor){

       // Mongo.$.processors.insertOne({})
    }
}

export default class API extends Processors {
    @REST.get()
    @Authorization.protect()
    'branch/create'(@REST.schema() branch:IBranch) {
        return {
            message : `branch ${branch.domain} created successfully`
        }
    }
    @Controller.on("mounted")
    async mounted(){

        /*Mongo.$.processors.insertOne({
            name : 'vadim'
        });*/
    }
}
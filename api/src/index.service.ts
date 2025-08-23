import {REST,Controller,Authorization, Mongo, Workspace} from "@hotfusion/ws";

import type {IBranch, IProcessor,ICollections} from "./index.schema";

@Mongo.connect<ICollections>("mongodb://localhost:27017/payquids", ['processors'])
class Processors extends Workspace {
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
            message : `branch ${branch.name} created successfully`
        }
    }
    @Controller.on("mounted")
    async mounted(){

        /*Mongo.$.processors.insertOne({
            name : 'vadim'
        });*/
    }
}
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
    @Authorization.protect({
        roles: ['admin'],
    })
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
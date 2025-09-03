import {REST, Controller, Authorization, Mongo, ICTX, ObjectId} from "@hotfusion/ws";
import {Workspace} from "./workspace";
import type {IBranch, IProcessor,ICollections} from "./index.schema";


@Authorization.provider('local')
@Mongo.connect<ICollections>("mongodb://localhost:27017/payquids", ['processors'])
class Processors{
    @REST.post()
    @Authorization.protect()
    async 'processor/create'(@REST.schema() processor:Pick<IProcessor, "keys" | "name" | "gateway">, ctx:ICTX){
        let _id
            = (await Mongo.$.processors.insertOne(processor)).insertedId;

        return {_id}
    }
    @REST.get()
    @Authorization.protect()
    async 'processor/list'(@REST.schema() processor:Pick<IProcessor, "keys" | "name" | "gateway">, ctx:ICTX){
        return await Mongo.$.processors.find({}).toArray()
    }
    @REST.get()
    @Authorization.protect()
    async 'processor/delete'(@REST.schema() processor:Pick<IProcessor, "_id" >, ctx:ICTX){
        return await Mongo.$.processors.deleteOne({
            _id: new ObjectId(processor._id)
        })
    }
}

export default class API extends Processors {
    @REST.get()
    @Authorization.protect()
    'branch/create'(@REST.schema() branch:Pick<IBranch, "domain" | "name">,ctx:ICTX) {

        ctx.getUser()
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
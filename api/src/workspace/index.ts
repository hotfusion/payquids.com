import {Controller,Authorization,REST} from "@hotfusion/ws";
import type {IUser} from "./schema.ts";

@Authorization.provider('local')
export  class Workspace {
    @Authorization.protect({
        roles : ['root','dev']
    })
    @REST.get()
    '_.ws/user'(@REST.schema() settings:IUser){
        return {name:'vadim'}
    }
    @Controller.on('mounted')
    __mounted(){

    }
}
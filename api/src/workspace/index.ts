import {Controller, Authorization, REST, ICTX} from "@hotfusion/ws";
import {IUserAccess} from "../index.schema";

@Authorization.provider('local')
export  class Workspace {
    @Authorization.protect({
        roles : ['root','dev']
    })
    @REST.get()
    '_.ws/root/create'(@REST.schema() settings : IUserAccess,ctx:ICTX){
        ctx.getUser().log('hello there')
        return {name:'vadim'}
    }

    @REST.get()
    '_.ws/signin'(@REST.schema() settings : IUserAccess,ctx:ICTX){
        console.log(settings,ctx)
        return ctx.getUser().createToken('_id:12345678')
    }
    @Controller.on('mounted')
    __mounted(){

    }
}
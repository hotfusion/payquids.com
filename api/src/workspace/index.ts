import {Controller, Authorization, REST, ICTX} from "@hotfusion/ws";
import {IUserCredentials, IUserRegistration} from "../index.schema";

@Authorization.provider('local')
export  class Workspace {

    @REST.post()
    async '_.ws/user/create'(@REST.schema() settings : IUserRegistration,ctx:ICTX){
        let user = await ctx.createUser('local', {
            email    : settings.email,
            password : settings.password,
            confirm  : settings.confirm
        })

        return { token : await ctx.generateTokens('local',user.sub) }
    }

    @REST.get()
    '_.ws/user/signin'(@REST.schema() settings : IUserCredentials,ctx:ICTX){

        return ctx.createUser('local',{
            email : settings.email,
        })
    }
    @Controller.on('mounted')
    __mounted(){

    }
}
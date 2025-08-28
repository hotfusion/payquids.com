import {Controller, Authorization, REST, ICTX} from "@hotfusion/ws";
import {IUserCredentials, IUserRegistration} from "../index.schema";

@Authorization.provider('local')
export  class Workspace {

    @REST.post()
    async '_.ws/user/create'(@REST.schema() settings : IUserRegistration,ctx:ICTX){
        await ctx.createUser('local', {
            name     : settings.name,
            email    : settings.email,
            password : settings.password,
            confirm  : settings.confirm
        })

        let user
            = await ctx.findUser('local', {email : settings.email});

        let token
            = await ctx.generateTokens('local',user.sub)

        return { ...token,sub:user.sub,email:user.email,name:user.name }
    }

    @REST.get()
    async '_.ws/user/signin'(@REST.schema() settings : IUserCredentials,ctx:ICTX){
        let user  = await ctx.findUser('local', {email : settings.email});
        let token = await ctx.authenticateUser('local',user.sub,settings.password);

        return { ...token,sub:user.sub,email:user.email,name:user.name };
    }

    @Controller.on('mounted')
    __mounted(){

    }
}
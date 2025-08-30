import {Controller, Authorization, REST, ICTX} from "@hotfusion/ws";
import {IUserCredentials, IUserRegistration} from "../index.schema";

@Authorization.roles('root','user')
@Authorization.provider('local')
export  class Workspace {
    @REST.post()
    async '_.ws/user/registrate'(@REST.schema() settings : IUserRegistration,ctx:ICTX){
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

        return {
            access_token : token.access_token,
            expire       : token.expires_in,
            sub          : user.sub,
            email        : user.email,
            name         : user.name,
            role         : user.role,
            provider     : user.provider
        }
    }

    @REST.get()
    async '_.ws/user/authenticate'(@REST.schema() settings : IUserCredentials,ctx:ICTX){
        let user
            = await ctx.findUser('local', {email : settings.email});

        let token
            = await ctx.authenticateUser('local',user.sub,settings.password);

        return {
            access_token : token.access_token,
            expire       : token.expires_in,
            sub          : user.sub,
            email        : user.email,
            name         : user.name,
            role         : user.role,
            provider     : user.provider
        }
    }
}
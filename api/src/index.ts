
import {MongoClient, ObjectId} from "mongodb";
import {Authorization, Controller, REST} from "@hotfusion/ws"
import {URIParser,Arguments} from "@hotfusion/ws/utils"
interface ICTX {
    [key: string]: any
}
export class DB {
    protected session = []
    protected source:{[key:string]: any} = {};
    protected db:any
    @Controller.on("mounted")
    async mounted(){
        let uri = Arguments.db;
        let connection  = new MongoClient(uri);
        let collections = [{
            name : 'customers'
        }, {
            name : 'receipts'
        }, {
            name : 'processors'
        }, {
            name : 'branches'
        }, {
            name : 'cards'
        },{
            name : 'intents'
        },{
            name : 'companies'
        }]
        try {
            //console.log("MongoDB connecting to:",'mongodb://root:example@mongo:27017/payquids?authSource=admin');
            console.log("MongoDB connecting to:",uri);
            await connection.connect();

            this.db
                = connection.db(URIParser(uri).database);

            /*for (const {name} of collections) {
                console.log(`- MongoDB collection created [${name}]`);

                let exists
                    = await this.connection.listCollections({ name }).hasNext();

                if (!exists) {
                    await this.connection.createCollection(name);
                    console.log(`📂 Created collection: ${name}`);
                }
                this.source[name]
                    = this.connection.collection(name);
            }*/
            console.log("MongoDB connected!");
            return this;
        } catch (err) {
            console.error('❌ MongoDB connection failed:', err);
            throw err;
        }
    }
}


export class Model extends DB {
    private async _initiate(id:string){
        let exists
            = await this.db.listCollections({ name:id }).hasNext();

        if (!exists) {
            await this.db.createCollection(id);
            console.log(`- MongoDB collection created [${id}]`);
        }

        this.source[id]
            = this.db.collection(id);
    }
    @REST.post()
    async 'model/:cid/insert'<T>(@REST.schema() item:any,ctx){
        let cid = ctx.getParams().cid;
        await this._initiate(cid);
        let _id
            = (await this.source[cid].insertOne(item)).insertedId;

        return {_id,...item}
    }
    @REST.post()
    async 'model/:cid/delete'(item:{_id:string},ctx){
        let cid = ctx.getParams().cid;
        await this._initiate(cid);
        return this.source[ctx.getParams().id].deleteOne({
            _id: new ObjectId(item._id)
        });
    }
    @REST.post()
    async 'model/:cid/update/:_id'(item:any,ctx){
        let cid = ctx.getParams().cid;
        await this._initiate(cid);
        return this.source[cid].updateOne({_id: new ObjectId(ctx.getParams()._id)},{
            $set : item
        })
    }
    @REST.get()
    async 'model/:cid/list'({},ctx){
        let cid = ctx.getParams().cid;
        await this._initiate(cid);
        return this.source[cid].find({}).toArray()
    }
    @REST.get()
    async 'model/:cid/get/:_id'({},ctx){
        let cid = ctx.getParams().cid;
        await this._initiate(cid);
        return this.source[cid].findOne({_id: new ObjectId(ctx.getParams()._id)})
    }
}
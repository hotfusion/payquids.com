
import {MongoClient} from "mongodb";
import {Authorization, Controller, REST} from "@hotfusion/ws"
import {URIParser,Arguments} from "@hotfusion/ws/utils"
interface ICTX {
    [key: string]: any
}
export class DB {
    protected session = []
    protected source:{[key:string]: any} = {};
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

            let source
                = connection.db(URIParser(uri).database);

            for (const {name} of collections) {
                console.log(`- MongoDB collection created [${name}]`);

                let exists
                    = await source.listCollections({ name }).hasNext();

                if (!exists) {
                    await source.createCollection(name);
                    console.log(`📂 Created collection: ${name}`);
                }
                this.source[name]
                    = source.collection(name);
            }
            console.log("MongoDB connected!");
            return this;
        } catch (err) {
            console.error('❌ MongoDB connection failed:', err);
            throw err;
        }
    }
}
import {Interface} from "./index";
import {Frame} from "@hotfusion/ui";
import {Connector} from '@hotfusion/ws/client/index.esm.js';
import { defineComponent } from 'vue';
export default defineComponent({
    props : {
        theme : {
            type     : String,
            default  : 'default',
            required : true
        },
        uri : {
            type : String
        }
    },
    data: () => ({
        _interface : false
    } as any),
    methods : {
      setBodyTheme(theme:string){
          document.body.setAttribute('theme', theme);
      }
    },
    async mounted() {
        document.body.setAttribute('theme', 'dark');
        this.connector  = await Connector.connect(this.uri);
        this._interface = new Interface({
            theme     : "dark",
            connector : this.connector,
            domain    : "digitaladsexp.com",
            client : {
                invoice : 'A10-000001',
                amount  : 20,
                name    : 'Vadim Korolov',
                email   : 'korolov.vadim@gmail.com',
                phone   : '5149996659'
            }
        })
        await new Frame('invoice-payment', this._interface)
            .setWidth('100%')
            .mount(undefined,this.$el.parentElement)
    },
    watch : {
        'theme'(){
            this.setBodyTheme(this.theme);
            this._interface.updateSettings({
                theme : this.theme
            })
        }
    }
})
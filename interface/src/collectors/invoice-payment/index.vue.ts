import {Interface} from "./index";
import {Frame} from "@hotfusion/ui";
import {Connector} from "../../../../../workspace/src/_.manager/src/_.utils/client-connector"
import { defineComponent } from 'vue';
export default defineComponent({
    props : {
        theme : {
            type    : String,
            default : 'default',
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
        // set global theme
        this.setBodyTheme('dark');

        this.connector = await Connector.connect(this.uri);
        this._interface = new Interface({
            theme : this.theme,
            connector : this.connector
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
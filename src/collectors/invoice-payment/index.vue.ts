import {Interface} from "./index";
import {Frame} from "@hotfusion/ui";
import { defineComponent } from 'vue';
export default defineComponent({
    props : {
        theme : {
            type    : String,
            default : 'default',
            required : true
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
        this.setBodyTheme(this.theme);


        this._interface = new Interface({
            theme : this.theme
        })
        await new Frame('default-frame', this._interface).mount(undefined,this.$el.parentElement)
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
import {Interface} from "./index";
import {Frame} from "@hotfusion/ui";
import { defineComponent } from 'vue';
export default defineComponent({
    title : 'Interface',
    props : {
        theme : {
            type    : String,
            default : 'default'
        }
    },
    data: () => ({} as any),
    async mounted() {
        // set global theme
        document.body.setAttribute('theme', this.theme);

        await new Frame('default-frame', new Interface({
            theme : this.theme
        })).mount(undefined,this.$el.parentElement)
    }
})
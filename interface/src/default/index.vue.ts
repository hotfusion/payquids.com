import {Interface} from "./index";
import {Frame} from "@hotfusion/ui";
import { defineComponent } from 'vue';
export default defineComponent({
    title : 'Home',
    props : {
        component: {
            type: String
        },
        uri: {
            type: String,
        }
    },
    data: () => ({} as any),
    async mounted() {
        document.body.setAttribute('theme','dark')
        await new Frame('default-frame', new Interface({})).mount(undefined,this.$el.parentElement)
    }
})
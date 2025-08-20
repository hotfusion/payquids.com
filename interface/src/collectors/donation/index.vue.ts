import {Interface} from "./index";
import {Frame} from "@hotfusion/ui";
import { defineComponent } from 'vue';
export default defineComponent({
    title : 'Interface',
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
        await new Frame('default-frame', new Interface({})).mount(undefined,this.$el.parentElement)
    }
})
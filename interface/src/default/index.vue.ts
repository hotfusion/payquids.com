import {Interface} from "./index";
import {Frame} from "@hotfusion/ui";
import {Connector} from "../../../../workspace/src/_.manager/src/_.utils/client-connector"
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
        document.body.setAttribute('theme','dark');
        this.connector = await Connector.connect(this.uri);
        this.connector.on("connected", async () => {
            await new Frame('default-frame', new Interface({})).mount(undefined,this.$el.parentElement)
        })
    }
})
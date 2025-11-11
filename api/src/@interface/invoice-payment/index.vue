<script lang="ts">
import {Application} from "./index";

//s
import {Frame} from "@hotfusion/ui";
import {Connector} from '@hotfusion/ws/client/index.esm.js';
import { defineComponent } from 'vue';
import "./index.less"
export default defineComponent({
  props : {
    theme : {
      type     : String,
      default  : 'default',
      required : true
    },
    uri : {
      type : String
    },
    client : {
      type : Object,
      default : () => ({})
    },
    domain : {
      type : String
    },
    amount : {
      type : Number
    },
    invoice : {
      type : String
    }
  },
  data() {
    return {
      _interface: false as any
    }
  },
  methods : {
    setBodyTheme(theme:string){
      document.body.setAttribute('theme', theme);
    }
  },
  async mounted() {
    document.body.setAttribute('theme', 'dark');
    this.connector  = await Connector.connect(this.uri);

    if(!this?.domain)
      return alert('Domain name is missing')

    this._interface = new Application({
      theme     : "dark",
      connector : this.connector,
      domain    : this.domain,
      amount    : this.amount,
      invoice   : this.invoice,
      client    : {
        name    : this?.client?.name,
        email   : this?.client?.email,
        phone   : this?.client?.phone
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
</script>
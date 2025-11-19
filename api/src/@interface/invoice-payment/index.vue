
<script lang="ts">
import {Application} from "./index";
import {Frame,Body} from "@hotfusion/ui";
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
    },
    receipt : {
      type    : Object,
      default : () => {}
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
  beforeMount() {
      document.head.innerHTML = document.head.innerHTML + `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`;
  },
  async mounted() {
    document.body.setAttribute('theme', 'dark');
    this.connector  = await Connector.connect(this.uri);

    if(!this?.domain)
      return alert('Domain name is missing')

    this.manager = new Application({
      theme     : "dark",
      connector : this.connector,
      domain    : this.domain,
      amount    : this.amount,
      invoice   : this.invoice,
      receipt   : this.receipt,
      client    : {
        name    : this?.client?.name,
        email   : this?.client?.email,
        phone   : this?.client?.phone
      }
    });

    let Browser = Body.getBrowser();
    new Body(this.manager, Browser.isMobile()?{}:{
      width  : '400px',
      height : '600px',

    }).on('ready', async (body:Frame) => {
      body.setAttribute('mobile',Browser.isMobile())
    });

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
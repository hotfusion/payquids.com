import {Component, Frame, Input} from "@hotfusion/ui";
import type {IGatewayIntent} from "../../../../../api/src/index.schema"
import * as Stripe from "@stripe/stripe-js";
import EventEmitter from "eventemitter3";
interface IPaymentGatewaySettings {
    theme: string;
}

class Processor {
    mount(...args: any[]) {}
    charge(){}
}

class StripeProcessor extends EventEmitter implements Processor  {
    stripe: any
    elements : any
    card : any
    ready:boolean
    isRecurring : boolean = false;
    isFocus : boolean = false;

    constructor(private public_key:string, private client_secret:string) {
        super();
    }
    mount(dom:HTMLElement) {
        this.stripe
            = Stripe.loadStripe(this.public_key);

        this.elements = this.stripe.elements({
            // for subscription/recurring the clientSecret is undefined
            clientSecret : this.client_secret,
            fonts: [
                {
                    cssSrc: 'https://fonts.googleapis.com/css2?family=Roboto:wght@100;400;700;900'
                }
            ],
            appearance:{
                theme: 'stripe',
                rules : {
                    '.Input': {
                        borderRadius    : '3px',
                        height          : '30px',
                        boxShadow       : 'none',
                        backgroundColor : '#f9f9f9',
                        fontSize        : '12px',
                        fontFamily      : 'Roboto',
                        color           : '#222',
                        border          : 'solid 1px #ccc'
                    },
                    '.Input--invalid': {
                        borderColor :'#b11657'
                    },
                    '.Input:hover': {
                        borderColor :'#3acc00',
                        boxShadow:'none'
                    },
                    '.Input:focus': {
                        borderColor :'#3acc00',
                        boxShadow:'none'
                    },
                    '.Label' : {
                        fontSize : '12px',
                        fontWeight:'bold',
                        fontFamily:'Roboto',
                        color: '#3f3f3f'
                    }
                }
            }
        });

        this.card = this.elements.create(this.isRecurring?"card":"payment", {
            layout: "tabs",
            style : {
                base: {
                    borderRadius :'3px',
                    height : '30px',
                    padding : '5px',
                    boxShadow:'none',
                    backgroundColor : 'transparent',
                    fontSize : '14px',
                    fontFamily:'Roboto',
                    color:'#222'
                }
            },
        }).on('ready',() => {
            this.ready
                = true;
            setTimeout(() => {
                this.emit('mounted',this)
            },700)
        }).on('change',({complete}) => {
            this.emit('change',{complete,component:this})
        }).on('focus',() => {
            this.isFocus = true;
        }).on('blur',() => {
            this.isFocus = false;
        })
        this.card.mount(dom);
    }
    charge(){}
}
export class ProcessorGateway extends Component<any,any>{
    constructor(settings: IPaymentGatewaySettings) {
        super({},{});
    }
    async initiate(settings : {client_secret:string}) {
          // Connector

        /*
        * this.stripe
        = Stripe(this.public_key);

    this.elements = this.stripe.elements({
      // for subscription/recurring the clientSecret is undefined
      clientSecret : this.intent?.client_secret,
      fonts: [
        {
          cssSrc: 'https://fonts.googleapis.com/css2?family=Roboto:wght@100;400;700;900'
        }
      ],
      appearance:{
        theme: 'stripe',
        rules : {
          '.Input': {
            borderRadius    : '3px',
            height          : '30px',
            boxShadow       : 'none',
            backgroundColor : '#f9f9f9',
            fontSize        : '12px',
            fontFamily      : 'Roboto',
            color           : '#222',
            border          : 'solid 1px #ccc'
          },
          '.Input--invalid': {
            borderColor :'#b11657'
          },
          '.Input:hover': {
            borderColor :'#3acc00',
            boxShadow:'none'
          },
          '.Input:focus': {
            borderColor :'#3acc00',
            boxShadow:'none'
          },
          '.Label' : {
            fontSize : '12px',
            fontWeight:'bold',
            fontFamily:'Roboto',
            color: '#3f3f3f'
          }
        }
      }
    });

    this.card = this.elements.create(this.isRecurring?"card":"payment", {
      layout: "tabs",
      style : {
        base: {
          borderRadius :'3px',
          height : '30px',
          padding : '5px',
          boxShadow:'none',
          backgroundColor : 'transparent',
          fontSize : '14px',
          fontFamily:'Roboto',
          color:'#222'
        }
      },
    }).on('ready',() => {
      this.ready
          = true;
      setTimeout(() => {
        this.$emit('mounted',this)
      },700)
    }).on('change',({complete}) => {
      this.$emit('change',{complete,component:this})
    }).on('focus',() => {
      this.isFocus = true;
    }).on('blur',() => {
      this.isFocus = false;
    })
    this.card.mount("#stripe-container");*/
    }
}
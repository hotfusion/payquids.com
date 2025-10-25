import {Component, Frame, Input} from "@hotfusion/ui";
import * as Stripe from "@stripe/stripe-js";
import EventEmitter from "eventemitter3";
interface IPaymentGatewaySettings {
    theme: string;
    branch : any
}

class Processor extends EventEmitter {
     mount  : (dom:HTMLElement) => Promise<this>
     charge : () => Promise<{intent:any,amount:number}>
}

class PayPalProcessor extends EventEmitter implements Processor{
    constructor(private public_key:string, private client_secret:string) {
        super();
    }
    async charge(): Promise<{intent:any,amount:number}> {
        return {
            intent : false,
            amount : 0,
        }
    }

    async mount(...args: any[]): Promise<this> {
        return this
    }
}

class StripeProcessor extends EventEmitter implements Processor  {
    stripe      : any
    elements    : any
    card        : any
    ready       : boolean
    isRecurring : boolean = false
    isFocus     : boolean = false

    constructor(private public_key:string, private client_secret:string) {
        super();
    }
    async mount(dom:HTMLElement) {
        this.stripe
            = await Stripe.loadStripe(this.public_key);

        let getRootStyle = (style:string) => {
            return getComputedStyle(document.body).getPropertyValue(style).trim()
        }
        this.elements = this.stripe.elements({
            // for subscription/recurring the clientSecret is undefined
            clientSecret : this.client_secret,
            fonts : [{
                cssSrc: 'https://fonts.googleapis.com/css2?family=Roboto:wght@100;400;700;900'
            }],
            appearance:{
                theme: 'stripe',
                rules : {
                    '.Input': {
                        borderRadius    : '3px',
                        height          : '30px',
                        boxShadow       : 'none',
                        fontSize        : '12px',
                        fontFamily      : 'Roboto',
                        backgroundColor : getRootStyle('--color-bg'),
                        color           : getRootStyle('--color-text'),
                        border          : 'solid 1px ' + getRootStyle('--color-border')
                    },
                    '.Input--invalid': {
                        borderColor :'#b11657'
                    },
                    '.Input:hover': {
                        borderColor :  getRootStyle('--color-accent'),
                        boxShadow:'none'
                    },
                    '.Input:focus': {
                        borderColor : getRootStyle('--color-accent-opacity-medium'),
                        boxShadow   : 'none'
                    },
                    '.Label' : {
                        fontSize    : '12px',
                        fontWeight  : 'bold',
                        fontFamily  : 'Roboto',
                        color: getRootStyle('--color-text'),
                    }
                }
            }
        });

        this.card = this.elements.create(this.isRecurring?"card":"payment", {
            layout: "tabs",
            wallets: {
                link: 'never' // 🚫 disables the email + save info block
            },
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
        });

        this.card.mount(dom);
        (<any>dom).firstChild.style.width = '100%';

        return this;
    }
    async charge(){
        let { error,paymentIntent  } = await this.stripe.confirmPayment({
            elements : this.elements,
            redirect : 'if_required'
        });

       if(error)
           throw error

        return {
            amount : paymentIntent.amount/100,
            intent : paymentIntent
        }
    }
}
export class ProcessorGateway extends Component<any,any>{
    processor: Processor;
    constructor(private config: IPaymentGatewaySettings,private branch:any ) {
        super({},{});
    }
    async init(public_key:string,client_secret:string) {
        this.getFrame().setStyle({opacity:0,marginTop:'20px'})
        return new Promise(async resolve => {

            if(this.branch.gateway === 'stripe')
                return this.processor = (await new StripeProcessor(public_key,client_secret).mount(this.getFrame().getTag())).on("mounted", () => {
                    resolve(true)
                    this.getFrame().setStyle({opacity:1});
                }).on("charge", (e) => this.emit("charge",e)).on("change",(e) => this.emit("change",e))

            if(this.branch.gateway === 'paypal')
                return this.processor = (await new PayPalProcessor(public_key,client_secret).mount(this.getFrame().getTag())).on("mounted", () => {
                    resolve(true)
                    this.getFrame().setStyle({opacity:1});
                }).on("charge", (e) => this.emit("charge",e)).on("change",(e) => this.emit("change",e))
        })
    }
    async charge(){
        try {
            let {intent} = await this.processor.charge()
            console.log(intent)
            this.emit('charge', { intent });
        } catch (error){
            alert('Payment Error');
            console.error(error)
        }

    }
    async mount(frame: Frame): Promise<this> {
        return super.mount(frame);
    }
}
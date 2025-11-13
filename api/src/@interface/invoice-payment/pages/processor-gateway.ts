import {Component, Frame, EventEmitter} from "@hotfusion/ui";
import * as Stripe from "@stripe/stripe-js";
interface IPaymentGatewaySettings {
    theme: string;
    branch : any
}

class Processor extends EventEmitter {
     mount  : (dom:HTMLElement) => Promise<this>
     charge : () => Promise<{intent:any,amount:number,error:any}>
}

declare const paypal:any;

//Hosted
class PayPalHosted extends EventEmitter implements Processor {
    private button:any;

    constructor(private amount:number, private public_key:string, private client_secret:string) {
        super();
    }

    async charge(): Promise<{intent:any,amount:number,error:any}> {
        return new Promise(async (resolve, reject) => {
            (<any>this)._complete = resolve;
            (<any>this)._reject   = reject;
            if (!this.button) return reject('PayPal button not initialized');
        });
    }

    async mount(dom:HTMLElement): Promise<this> {
        let container = new Frame('div')
            .setOrientation('vertical')
            .setWidth('100%')

            .setStyle({ display:'flex', justifyContent:'center', alignItems:'center', padding:'10px' });

        container.setHTML(`<div id="paypal-button" style="width: 100%"></div>`);

        container.on('mounted', () => {
            let src
                = `https://www.paypal.com/sdk/js?client-id=${this.public_key}&components=card-fields,buttons&intent=capture&currency=USD`;

            let existing
                = document.querySelector(`script[src^="https://www.paypal.com/sdk/js"]`);

            let init = async () => {
                this.button = paypal.Buttons({
                    createOrder: async () => {
                        return this.client_secret;
                    },
                    onApprove: async (data, actions) => {
                        this.emit('complete',{
                            error  : null,
                            amount : this.amount,
                            intent : {
                                id        : data.orderID,
                                client    : data.payerID,
                                processor : 'paypal'
                            }
                        })
                    },
                    onError: (err) => {
                        (<any>this)._reject(err);
                    },
                    onInit: (data, actions) => {
                        this.emit('change', { ready:true, component:this });
                    },
                    style: {
                        layout : 'vertical',
                        color  : 'blue',
                        shape  : 'rect',
                        label  : 'pay'
                    }
                });

                await this.button.render('#paypal-button');
                this.emit('mounted', this);
            }

            if(!existing) {
                let script = document.createElement('script');
                    script.src = src;
                    script.onload = () => {
                       init();
                    };
                    document.body.appendChild(script);
            }else setTimeout(() => {
                init();
            },500)


        });

        await container.mount(undefined, dom);
        return this;
    }
}
// Processors
class PayPalProcessor extends EventEmitter implements Processor {
    private cardFields:any
    constructor(private amount:number, private public_key:string, private client_secret:string) {
        super();
    }
    async charge(): Promise<{intent:any,amount:number,error:any}> {
        return new Promise(async (resolve, reject) => {
            (<any>this)._complete = resolve;
            (<any>this)._reject   = reject;
            return await this.cardFields.submit();
        })
    }

    async mount(dom:HTMLElement): Promise<this> {
        let form = new Frame('form').setOrientation('horizontal').setStyle({gap:'10px'});
        form.setHTML(`<label for="card-number">Card Number:</label><div id="card-number"></div><label for="card-cvv">Security Code:</label><div id="card-cvv"></div><label for="card-expiry">Expiration date:</label><div id="card-expiry"></div>`);
        return  new Promise(async (resolve, reject) => {
            form.on('mounted', () => {
                let script = document.createElement('script');
                script.src = `https://www.paypal.com/sdk/js?client-id=${this.public_key}&components=card-fields,buttons&intent=capture&currency=USD`;
                script.onload = async () => {
                    let getRootStyle = (style:string) => {
                        return getComputedStyle(document.body).getPropertyValue(style).trim()
                    }

                    this.cardFields = paypal.CardFields({
                        createOrder: async () => {
                            return this.client_secret;
                        },
                        onApprove: ({orderID}) => {
                            (<any>this)._complete({
                                error  : null,
                                intent : {
                                    id : orderID,
                                    processor: 'paypal'
                                },
                                amount : this.amount,
                            });
                        },
                        onError: (e) => {
                            (<any>this)._reject(e)
                        },
                        style: {
                            'input': {
                                'font-size': '12px',
                                'color': getRootStyle('--color-text'),
                                'border' :  'solid 1px ' + getRootStyle('--color-border'),
                                'height': '35px',
                                'margin' :'0',
                                'padding' :'0 0 0 10px',
                                'background': getRootStyle('--color-bg'),
                                'outline': 'none',
                                'borderRadius' :'0px'
                            },
                            'input:focus': {
                                'outline'      : 'none',
                                'box-shadow'   : 'none',
                                'border-color' : 'solid 1px ' + getRootStyle('--color-accent'),
                            },
                            'input:hover': {
                                'border' : 'solid 1px ' + getRootStyle('--color-accent'),
                            },
                            '.valid': {
                                'color'  : getRootStyle('--color-text'),
                                'border' : 'solid 1px ' + getRootStyle('--color-border'),
                            },
                            '.invalid': {
                                'outline'    : 'none',
                                'box-shadow' : 'none',
                                'border'     : 'solid 1px ' + getRootStyle('--color-border'),
                                'color'      : getRootStyle('--color-border-accent')
                            }
                        },
                        inputEvents: {
                            onChange: (data) => {
                                this.emit('change',{complete:data.isFormValid,component:this})
                            }
                        },
                    })

                    await this.cardFields.NumberField({ placeholder: '1234 5678 9012 3456' }).render('#card-number')
                    await this.cardFields.ExpiryField().render('#card-expiry')
                    await this.cardFields.CVVField().render('#card-cvv');

                    this.emit('mounted',this);
                }
                document.body.appendChild(script);
                resolve(this)
            })
            await form.mount(undefined,dom);
        })

    }
}

class StripeProcessor extends EventEmitter implements Processor  {
    stripe      : any
    elements    : any
    card        : any
    ready       : boolean
    isRecurring : boolean = false
    isFocus     : boolean = false

    constructor(private amount:number, private public_key:string, private client_secret:string) {
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
                applePay: 'never',
                googlePay: 'never',
                link: 'never',
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

        return {
            error  : error || null,
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
    async init(amount:number,public_key:string,client_secret:string,hosted:{gateway:string,keys:{public:string}}[]) {
        this.getFrame().setStyle({opacity:0,marginTop:'20px'})
        return new Promise(async resolve => {
            let Processor
                = this.branch.gateway === 'stripe'? StripeProcessor : PayPalProcessor

            return this.processor = (await new Processor(amount, public_key,client_secret).mount(this.getFrame().getTag())).on("mounted", async () => {

                let frame = this.getFrame().setOrientation("horizontal").setLayout("fixed").setWidth('100%');
                if(hosted.length){
                    for(let i=0; i<hosted.length; i++){
                        if(hosted[i].gateway === 'paypal'){
                            frame.getParentFrame().setOrientation("horizontal")
                            await frame.getParentFrame().push(
                                new Frame('paypal-hosted').setSize(100).on("mounted", async (frame:Frame) => {

                                    (await new PayPalHosted(amount, hosted[i].keys.public, client_secret).mount(frame.getTag())).on('complete',({intent,error}) => {
                                        frame?.remove?.()
                                        this.emit('complete', {intent,amount,error});
                                    })
                                })
                            )
                        }
                    }
                }

                resolve(true)
                frame.setStyle({opacity:1});
            }).on("charge", (e) => this.emit("charge",e)).on("change",(e) => this.emit("change",e))
        })
    }
    async charge():Promise<{amount:number,error:any,intent:any,currency:string | boolean}>{
        try {
            let {intent,amount,error} = await this.processor.charge()
            this.emit('charge', { intent, amount });

            return {intent,amount,error,currency:'USD'}
        } catch (error){
            return {error,amount:0,intent:undefined,currency:false}
        }

    }
    async mount(frame: Frame): Promise<this> {
        return super.mount(frame);
    }
}
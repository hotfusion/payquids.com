import {Component, Frame, EventEmitter, Button} from "@hotfusion/ui";
import * as SM from "@stripe/stripe-js";
declare const paypal:any;



interface IPaymentGatewaySettings {
    theme: string;
    branch : any
}

class Processor {
    recurring : boolean = false;
    mount  : (dom:HTMLElement) => Promise<this>
}


export class Paypal extends EventEmitter implements Processor {
    static isPayPalDefault = false
    private button : any;
    private fields : any;
    private controller : Frame;
    recurring          : boolean = false;
    constructor(private orderID:string, private keys : {public:string}, private type:"gateway" | "hosted",private disabled?:string[],private currency?:'USD' | 'CAD') {
        super();

        // we need to disallow the card if the default gateway is not paypal otherwise there will be a debit card button under paypal button
        if(type === "gateway")
            Paypal.isPayPalDefault = true;

        this.disabled = this.disabled || [];
    }
    async mount(dom:HTMLElement,controller?:Frame) {
        this.controller = controller;

        // if PayPal is not contain gateway process, its mean the default processor is not a paypal!
        if(!Paypal.isPayPalDefault)
            this.disabled.push('card');

        if (!document.getElementById('paypal-sdk')) {
            const script = document.createElement('script');
                  script.id = 'paypal-sdk';
                  script.src = `https://www.paypal.com/sdk/js?client-id=${this.keys.public}&components=card-fields,buttons&intent=capture&currency=USD`;
                  if(this.disabled?.length)
                      script.src = script.src + '&disable-funding=' + this.disabled.join(',');

                  document.body.appendChild(script);
                  await new Promise(resolve => script.onload = resolve);
        }
        this.type === "gateway" ? await this.mountCard(dom) : await this.mountButton(dom);
        return this;
    }
    async mountCard(dom:HTMLElement) {
        dom.innerHTML
            = `<label for="card-number">Card Number:</label><div id="card-number"></div>
               <label for="card-cvv">Security Code:</label><div id="card-cvv"></div>
               <label for="card-expiry">Expiration date:</label><div id="card-expiry"></div>`;


        let getRootStyle = (style:string) => {
            return getComputedStyle(document.body).getPropertyValue(style).trim()
        }

        const fields = paypal.CardFields({
            createOrder: async () => {
                return this.orderID;
            },
            onApprove: ({orderID}) => {
                this.emit('complete',{
                    id     : orderID
                })
            },
            onError: ({message}) => {
                const msg = message || "";

                // split at first newline
                const parts = msg.split("\n");

                let jsonPart = parts.length > 1 ? parts.slice(1).join("\n") : null;

                let err = null;

                if (jsonPart) {
                    try {
                        err = JSON.parse(jsonPart);
                    } catch {}
                }

                this.emit('error',{message:err?.message || `UNKNOWN ERROR`})
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
                onChange: (e) => {
                    this.controller.setDisabled(!e?.isFormValid)
                }
            },
        })

        await fields.NumberField({ placeholder: '1234 5678 9012 3456'}).render('#card-number')
        await fields.ExpiryField().render('#card-expiry')
        await fields.CVVField().render('#card-cvv');

        await new Promise(resolve => {
            setTimeout(resolve, 3000);
        });

        this.controller.getComponent<Button>().on('click', async () => {
            try{
                await fields.submit();
            }catch(e){

            }
        })

        this.emit('mounted',this);

        return this;
    }
    async mountButton(dom:HTMLElement) {
        dom.innerHTML = `<div id="paypal-button" style="width: 100%"/>`;
        this.button = paypal.Buttons({
            funding: {
                disallowed: [ paypal.FUNDING.CREDIT,paypal.FUNDING.CARD ]
            },
            createOrder: async () => {
                return this.orderID;
            },
            onApprove: async ({paymentID}, actions) => {
                this.emit('complete',{ id : paymentID })
            },
            onError: ({message}) => {
                const msg = message || "";

                // split at first newline
                const parts = msg.split("\n");

                let jsonPart = parts.length > 1 ? parts.slice(1).join("\n") : null;

                let err = null;

                if (jsonPart) {
                    try {
                        err = JSON.parse(jsonPart);
                    } catch {}
                }

                this.emit('error',{message:err?.message || `Card declined. The issuing bank rejected the transaction. Use a different payment method or contact your card provider.`})
            },
            style: {
                layout : 'vertical',
                color  : 'blue',
                shape  : 'rect',
                label  : 'pay'
            }
        });

        await this.button.render('#paypal-button');
    }
}

export class Stripe extends EventEmitter  implements Processor{
    private elements : any
    private card     : any
    private controller : Frame
    recurring : any
    constructor(private orderID:string, private keys : {public:string}, private type:"gateway" | "hosted",private disabled?:string[]) {
        super();
    }
    async mount(dom:HTMLElement,controller?:Frame) {
        this.controller = controller;
        this.controller.setDisabled(false);
        dom.style.padding = '20px 0'
        await this.mountCard(dom,this.orderID,this.keys)
        return this;
    }
    async mountCard(dom:HTMLElement,orderID:string,keys:{public:string}) {
        const stripe
            = await SM.loadStripe(keys.public);

        let getRootStyle = (style:string) => {
            return getComputedStyle(document.body).getPropertyValue(style).trim()
        }
        this.elements = stripe.elements({
            // for subscription/recurring the clientSecret is undefined
            clientSecret : orderID,
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

        this.card = this.elements.create(this.recurring?"card":"payment", {
            layout  : "tabs",
            wallets : {
                applePay  : 'never',
                googlePay : 'never',
                link      : 'never'
            },
            style : {
                base: {
                    borderRadius    : '3px',
                    height          : '30px',
                    padding         : '5px',
                    boxShadow       : 'none',
                    fontSize        : '14px',
                    fontFamily      : 'Roboto',
                    color           : '#222',
                    backgroundColor : 'transparent'
                }
            },
        }).on('change',({complete}) => this.controller.setDisabled(!complete))

        this.card.mount(dom);
        (<any>dom).firstChild.style.width = '100%';

        this.controller.getComponent<Button>().on('click', async () => {
            let { error,paymentIntent  } = await stripe.confirmPayment({
                elements : this.elements,
                redirect : 'if_required'
            });

            if(error)
                return this.emit('error', {error})

            this.emit('complete', {
                id : paymentIntent.id
            })
        })
        return this;
    }
}

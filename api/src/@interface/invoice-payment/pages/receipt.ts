import {Component, Frame, Input} from "@hotfusion/ui";

interface IReceiptSettings {
    theme    : string;
    amount   : number;
    currency : "USD" | "CAD";
    card     : {
        last4 ?: string
        brand ?: string
    }
    customer : {
        email : string;
        name  : string;
    }
}
//@ts-ignore
import icons from "../../assets/images/payments.png";

export class Receipt extends Component<any,any>{
    constructor(settings: IReceiptSettings) {
        super(settings,{
            card     : false,
            customer : false,
            amount   : 0,
            currency : "USD"
        });
    }

    async mount(frame: Frame): Promise<this> {
        let {amount,customer,card,currency} = this.getSettings()
        frame.setOrientation('horizontal');

        let icons = {
            visa       : '<img class="brand" height="42" width="42" src="https://cdn.simpleicons.org/visa/474ec9?viewbox=auto"        alt=""/>',
            mastercard : '<img class="brand" height="42" width="32" src="https://cdn.simpleicons.org/mastercard/EB001B?viewbox=auto"  alt=""/>',
            discover   : '<img class="brand" height="42" width="62" src="https://cdn.simpleicons.org/discover/FF6000?viewbox=auto"    alt=""/>',
            paypal     : '<img class="brand" height="42" width="22" src="https://cdn.simpleicons.org/paypal/fff?viewbox=auto"    alt=""/>'
        }

        let receiptFrame = new Frame('receipt-frame')
        receiptFrame.setHTML(`
              <div class="receipt">
              <div class="title">
                     <h1>Payment Successful!</h1>
                     <p>Congratulations! Your card was charged successfully for the amount of <span>$${amount.toFixed(2)}</span> ${currency}. Your receipt has been sent to your email <span>${customer.email}</span>.</p>
              </div>
              <div class="amount">$${amount.toFixed(2)}</div>
              <div class="details">
                 <span class="name">${customer.name}</span>
                 <span class="digits" style="display: ${card?.last4?'block':'none'}">**** **** ****</span> 
                 <span class="last-digits" style="display: ${card?.last4?'block':'none'}">${card?.last4}</span>
                 ${icons[card?.brand]?icons[card?.brand]:''}
              </div>
              
              <div class="invoice">
                 <span class="date">
                     <i class="fa-solid fa-calendar-days"></i>
                     ${new Date().toString().split(' ').slice(0,4).join(' ')}
                 </span>
                 <i class="fa-solid fa-receipt"></i> #A01-0000000
              </div>
            </div>
        `)

        await frame.push(receiptFrame);
        setTimeout(() => {
            document.body
                .querySelector('.receipt')
                .setAttribute('mounted','true');
        })
        return super.mount(frame);
    }
}
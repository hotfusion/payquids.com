import {Component, Frame, Input} from "@hotfusion/ui";

interface IReceiptSettings {
    theme    : string;
    amount   : number;
    currency : "USD" | "CAD";
    card     : {
        last4 ?: number
    }
    customer : {
        email : string;
        name  : string;
    }
}
export class Receipt extends Component<any,any>{
    static frame : Frame
    constructor(settings: IReceiptSettings) {
        super(settings,{
            card:false
        });
    }

    async mount(frame: Frame): Promise<this> {
        frame.setOrientation('horizontal');
        Receipt.frame = frame;
        return super.mount(frame);
    }
    static mount(charge:any,card:any,customer:any){

        Receipt.frame .setHTML(`
            <div class="receipt-header">
              <div class="title">The payment successfully completed  </div>
              <div class="amount">$${charge.amount.toFixed(2)}</div>
              <div class="details">
                 <span class="name">${customer.name}</span>
                 <span class="digits" style="display: ${card?.last4?'block':'none'}">**** **** ****</span> 
                 <span class="last-digits" style="display: ${card?.last4?'block':'none'}">${card?.last4}</span>
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

        document.body
            .querySelector('.receipt-header')
            .setAttribute('mounted','true');
    }
}
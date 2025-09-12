import {Component, Frame, Input} from "@hotfusion/ui";
interface IReceiptSettings {
    theme: string;
}
export class Receipt extends Component<any,any>{
    constructor(settings: IReceiptSettings) {
        super(settings,{
            card:false
        });
    }
    static frame : Frame
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
                 <span class="digits">**** **** ****</span> 
                 <span class="last-digits">${card.last4}</span>
              </div>
              
              <div class="invoice">
                 <span class="date">
                     <span class="material-symbols-outlined icon">alarm</span>
                     ${new Date().toString().split(' ').slice(0,4).join(' ')}
                 </span>
                 <span class="material-symbols-outlined icon">order_approve</span> #A01-0000000
              </div>
            </div>
        `)
        document.body.querySelector('.receipt-header').setAttribute('mounted','true');
    }
}
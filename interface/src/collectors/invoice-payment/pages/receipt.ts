import {Component, Frame, Input} from "@hotfusion/ui";
interface IReceiptSettings {
    theme: string;
}
export class Receipt extends Component<any,any>{
    constructor(settings: IReceiptSettings) {
        super({},{});
    }

    async mount(frame: Frame): Promise<this> {
        frame.setOrientation('horizontal');
        frame.setStyle({
            paddingTop: '30px',
        })
        frame.setHTML(`
            <div class="receipt-header">
              <div class="title">The payment successfully completed  </div>
              <div class="amount">$39.00</div>
              <div class="details">
                 <span class="name">Vadim Korolov </span>
                 <span class="digits">**** **** ****</span> 
                 <span class="last-digits">4321</span>
              </div>
              
              <div class="invoice">
                 <span class="date">
                     <span class="material-symbols-outlined">alarm</span>
                     ${new Date().toString().split(' ').slice(0,4).join(' ')}
                 </span>
                 <span class="material-symbols-outlined">order_approve</span> #A01-0000000
              </div>
            </div>
        `)
        return super.mount(frame);
    }
    static mount(){
        document.body.querySelector('.receipt-header').setAttribute('mounted','true');
    }
}
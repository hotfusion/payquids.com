import {Component, Frame, Input} from "@hotfusion/ui";
import * as QRCode from  "qrcode"
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
              
              <div class="qrcode-container">
                 <div>Scan this code to download the paid invoice to your mobile device</div>
                 <canvas class="qrcode" style="align-self: center; margin-top: 20px;"></canvas>
              </div>
            </div>
        `)


        setTimeout(() => {
            QRCode.toCanvas(Receipt.frame.getTag().querySelector('.qrcode'), 'sample text', {
                errorCorrectionLevel: 'H',
                type: 'image/jpeg',
                quality: 1,
                margin: 1,
                width : 150,
                scale  : 10,
                color: {
                    dark  : "#26292b",
                    light : "#bfc9cc"
                }
            })
        })
        document.body
            .querySelector('.receipt-header')
            .setAttribute('mounted','true');
    }
}
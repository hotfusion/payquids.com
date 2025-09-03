import {Component, Frame, Input} from "@hotfusion/ui";
interface IReceiptSettings {
    theme: string;
}
import "../index.less"
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
              <div class="name">Vadim Korolov</div>
              <div class="card"><span class="digits">**** **** ****</span> <span class="last-digits">4321</span></div>
              <div class="invoice">Invoice: #A01-0000000</div>
            </div>
        `)
        return super.mount(frame);
    }
}
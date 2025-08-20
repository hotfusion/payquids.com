import {Component, Frame, Input} from "@hotfusion/ui";
interface IPaymentGatewaySettings {
    theme: string;
}
export class PaymentGateway extends Component<any,any>{
    constructor(settings: IPaymentGatewaySettings) {
        super({},{});
    }
}
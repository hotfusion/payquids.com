import {Component, Frame, Input} from "@hotfusion/ui";
import type {IGatewayIntent} from "../../../../../api/src/index.schema"
interface IPaymentGatewaySettings {
    theme: string;
}
export class ProcessorGateway extends Component<any,any>{
    constructor(settings: IPaymentGatewaySettings) {
        super({},{});
    }
    initiate(settings : IGatewayIntent){
          // Connector
    }
}
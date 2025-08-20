import {Component, Frame, Input} from "@hotfusion/ui";
interface IReceiptSettings {
    theme: string;
}
export class Receipt extends Component<any,any>{
    constructor(settings: IReceiptSettings) {
        super({},{});
    }
}
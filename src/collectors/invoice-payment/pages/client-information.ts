import {Component} from "@hotfusion/ui";
interface IClientInformationSettings {
    theme: string;
}
export class ClientInformationPage extends Component<any,any>{
    constructor(settings:IClientInformationSettings) {
        super(settings,{
            theme: 'default',
        });


    }
}
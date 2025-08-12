import {Component, Frame} from "@hotfusion/ui";
interface IClientInformationSettings {
    theme: string;
}
export class ClientInformation extends Component<any,any>{
    constructor(settings:IClientInformationSettings) {
        super(settings,{
            theme: 'default',
        });

        this.on('settings', this.render)
    }

    async mount(frame: Frame): Promise<this> {
        return super.mount(frame);
    }

    render(){
        alert()
    }
}
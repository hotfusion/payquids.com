import {Component, Frame, Input} from "@hotfusion/ui";
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

    form !: any
    async mount(frame: Frame): Promise<this> {

        this.form = {
            name  : new Frame('client-name-input', new Input({
                theme : this.settings.theme,
            })),
            email : new Frame('client-email-input', new Input({
                theme : this.settings.theme,
            })),
        }

        await frame.setOrientation('horizontal').setStyle({gap:'10px'}).push(this.form.name,this.form.email);
        return super.mount(frame);
    }

    render(){

    }
}
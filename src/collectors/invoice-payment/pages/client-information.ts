import {Component, Frame, Input} from "@hotfusion/ui";
interface IClientInformationSettings {
    theme: string;
}
export class ClientInformation extends Component<any,any>{
    constructor(settings:IClientInformationSettings) {
        super(settings,{
            theme: 'default',
        });
        this.on('settings', this.render.bind(this))
    }

    form !: any
    async mount(frame: Frame): Promise<this> {

        this.form = {
            invoice  : new Frame('invoice-input', new Input({
                theme : this.settings.theme,
                placeholder : '#Enter invoice number',
            })),
            name  : new Frame('client-name-input', new Input({
                theme : this.settings.theme,
                placeholder : 'Enter your first and last name'
            })),
            email : new Frame('client-email-input', new Input({
                theme : this.settings.theme,
                placeholder : 'Enter your email address'
            })),
        }

        await frame.setOrientation('horizontal').setStyle({gap:'10px',padding:'10px'}).push(this.form.invoice,this.form.name,this.form.email);
        return super.mount(frame);
    }

    render(){
        if(this.form)
            Object.keys(this.form).forEach((key:string) => {
                this.form[key].getComponent().updateSettings({
                    theme : this.settings.theme,
                })
            })
    }
}
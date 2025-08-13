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
                label : 'Invoice number',
                notes : [{
                    note : 'If you don’t have the invoice number, please provide the email address associated with your invoice.',
                    clickable : false
                }]
            })),
            amount  : new Frame('amount-input', new Input({
                theme : this.settings.theme,
                placeholder : '$0.00',
                notes : [{
                    note : 'Enter the amount which is on your invoice.',
                    clickable : false
                }]
            })),
            name  : new Frame('client-name-input', new Input({
                theme : this.settings.theme,
                placeholder : 'Andrew Patel',
                label : 'Full Name',
            })),
            email : new Frame('client-email-input', new Input({
                theme : this.settings.theme,
                placeholder : 'andrew.patel@email.com',
                label : 'Email Address',
            })),
        }

        await frame.setOrientation('horizontal').push(this.form.invoice, this.form.amount,this.form.name,this.form.email);
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
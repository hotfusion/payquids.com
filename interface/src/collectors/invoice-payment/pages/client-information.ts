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

        frame.setStyle({gap:'10px', padding:'20px'});
        this.form = {
            invoice : new Frame('invoice-input', new Input({
                theme : this.getSettings().theme,
                placeholder : 'A01-0000000',
                label : 'Invoice number',
                notes : [{
                    note : 'If you don’t have the invoice number, please provide the email address associated with your invoice.',
                    clickable : false
                }]
            })).setStyle({marginTop: '10px'}),
            amount : new Frame('amount-input', new Input({
                theme : this.getSettings().theme,
                placeholder : '$0.00',
                notes : [{
                    note : 'Enter the amount which is on your invoice.',
                    clickable : false
                }]
            })),
            name  : new Frame('client-name-input', new Input({
                theme : this.getSettings().theme,
                placeholder : 'Andrew Patel',
                label : 'Full Name',
            })),
            email : new Frame('client-email-input', new Input({
                theme : this.getSettings().theme,
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
                    theme : this.getSettings().theme,
                })
            })
    }
}
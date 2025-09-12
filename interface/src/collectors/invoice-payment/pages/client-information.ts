import {Component, Frame, Input} from "@hotfusion/ui";
interface IClientInformationSettings {
    theme: string;
}
export class ClientInformation extends Component<any,any>{
    constructor(settings:IClientInformationSettings) {
        super(settings,{
            theme   : 'default',
            client  : false
        });
        this.on('settings', this.render.bind(this))
    }

    form !: any
    async mount(frame: Frame): Promise<this> {

        let validate = () => {
            setTimeout(() => {
                let invoice = this.form.invoice.getComponent().getValue()
                let email   = this.form.email.getComponent().getValue()
                let amount  = this.form.amount.getComponent().getValue()
                let name    = this.form.name.getComponent().getValue()
                let phone   = this.form.phone.getComponent().getValue()

                let complete = invoice && /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email) && !isNaN(amount) && name?.length > 0 && phone
                this.emit("change", {complete,client: {invoice,email,amount:parseFloat(amount),name,phone}})
            })
        }

        frame.setStyle({gap:'10px'});
        let {theme,client} = this.getSettings()
        this.form = {
            invoice : new Frame('invoice-input', new Input({
                theme,
                label       : 'Invoice number',
                value       : client?.invoice,
                placeholder : 'A01-0000000',
                notes       : [{
                    note      : 'If you don’t have the invoice number, please provide the email address associated with your invoice.',
                    clickable : false
                }]
            }).on('input',validate)
              .on('mounted', validate)).setStyle({marginTop: '10px'}),
            amount : new Frame('amount-input', new Input({
                theme,
                placeholder : '$0.00',
                value       : client?.amount,
                notes       : [{
                    note      : 'Enter the amount which is on your invoice.',
                    clickable : false
                }]
            }).on('input',validate)
              .on('mounted', validate)),
            name  : new Frame('client-name-input', new Input({
                theme,
                value       : client?.name,
                label       : 'Full Name',
                placeholder : 'Andrew Patel'
            }).on('input',validate)
              .on('mounted', validate)),
            email : new Frame('client-email-input', new Input({
                theme,
                value       : client?.email,
                label       : 'Email Address',
                placeholder : 'andrew.patel@email.com'
            }).on('input',validate)
              .on('mounted', validate)),
            phone : new Frame('client-phone-input', new Input({
                theme,
                value       : client?.phone,
                label       : 'Phone Number',
                placeholder : '111 111-11111'
            }).on('input',validate)
                .on('mounted', validate))
        }

        await frame.setOrientation('horizontal').push(this.form.invoice, this.form.amount,this.form.name,this.form.email, this.form.phone);
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
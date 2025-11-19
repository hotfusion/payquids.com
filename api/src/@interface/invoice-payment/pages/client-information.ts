import {Component, Frame, Input} from "@hotfusion/ui";
interface IClientInformationSettings {
    theme: string;
}

const customers = [
    { "name": "Mark Peterson", "email": "mark.peterson@example.com", "phone": "+1-202-555-0143" },
    { "name": "Julia Roberts", "email": "julia.roberts@example.com", "phone": "+1-310-555-2291" },
    { "name": "Victor Klein", "email": "victor.klein@example.com", "phone": "+1-415-555-9032" },
    { "name": "Sofia Bennett", "email": "sofia.bennett@example.com", "phone": "+1-646-555-7784" },
    { "name": "Daniel Morris", "email": "daniel.morris@example.com", "phone": "+1-312-555-8812" },
    { "name": "Emma Clarke", "email": "emma.clarke@example.com", "phone": "+1-718-555-3478" },
    { "name": "Leon Grant", "email": "leon.grant@example.com", "phone": "+1-206-555-6401" },
    { "name": "Helen Foster", "email": "helen.foster@example.com", "phone": "+1-213-555-9283" },
    { "name": "Kevin Howard", "email": "kevin.howard@example.com", "phone": "+1-305-555-5574" },
    { "name": "Laura Dixon", "email": "laura.dixon@example.com", "phone": "+1-503-555-7312" },
    { "name": "Oliver Gray", "email": "oliver.gray@example.com", "phone": "+1-917-555-1148" },
    { "name": "Natalie Brooks", "email": "natalie.brooks@example.com", "phone": "+1-424-555-6611" },
    { "name": "Henry Adams", "email": "henry.adams@example.com", "phone": "+1-281-555-9062" },
    { "name": "Chloe Turner", "email": "chloe.turner@example.com", "phone": "+1-702-555-3304" },
    { "name": "Ryan Phillips", "email": "ryan.phillips@example.com", "phone": "+1-720-555-4429" },
    { "name": "Sara Mitchell", "email": "sara.mitchell@example.com", "phone": "+1-214-555-6735" },
    { "name": "Jason Carter", "email": "jason.carter@example.com", "phone": "+1-832-555-5582" },
    { "name": "Alicia Morgan", "email": "alicia.morgan@example.com", "phone": "+1-970-555-2324" },
    { "name": "George Lawson", "email": "george.lawson@example.com", "phone": "+1-509-555-7844" },
    { "name": "Monica Reyes", "email": "monica.reyes@example.com", "phone": "+1-615-555-9910" }
]
let customer = customers[Math.floor(Math.random() * 21)]

//
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
                this.emit("change", {
                    invoice,
                    complete,
                    amount   : parseFloat(amount),
                    customer : {email,name,phone}
                })
            })
        }

        frame.setStyle({gap:'10px'});
        let {theme,client,invoice,amount} = this.getSettings()
        this.form = {
            invoice : new Frame('invoice-input', new Input({
                theme,
                label       : 'Invoice number',
                value       : invoice,
                placeholder : 'A01-0000003',
                /*notes       : [{
                    note      : 'If you don’t have the invoice number, please provide the email address associated with your invoice.',
                    clickable : false
                }]*/
            }).on('input',validate).on('mounted', validate)),
            amount : new Frame('amount-input', new Input({
                theme,
                placeholder : '$0.00',
                value       : amount,
                icon        : {
                   class : 'fa-solid fa-dollar-sign',
                    position : 'left'
                },
                notes       : [{
                    note      : 'Enter the amount which is on your invoice',
                    clickable : false
                }]
            }).on('input',validate).on('mounted', validate)),
            name  : new Frame('client-name-input', new Input({
                theme,
                value       : client?.name,
                label       : 'Full Name',
                placeholder : customer.name
            }).on('input',validate).on('mounted', validate)),
            email : new Frame('client-email-input', new Input({
                theme,
                value       : client?.email,
                label       : 'Email Address',
                placeholder : customer.email
            }).on('input',validate).on('mounted', validate)),
            phone : new Frame('client-phone-input', new Input({
                theme,
                value       : client?.phone,
                label       : 'Phone Number',
                placeholder : customer.phone
            }).on('input',validate).on('mounted', validate))
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
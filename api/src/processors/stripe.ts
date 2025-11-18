import stripe from "stripe";

export class Stripe {
    private readonly sandbox:any
    constructor(
        private mode : "development" | "production",
        private keys:{
            public :string,
            private:string
        },
        private currency: "USD" | "CAD" = "USD"
    ) {
        this.sandbox = new stripe(this.keys.private);
    }
    retrieve(paymentId:string):any{
        return true
    }
    async setCustomer(customer:{email:string,name?:string,phone?:string}) {
        let list = await this.sandbox.customers.list({
            email: customer.email, limit: 1
        });

        if (list.data.length > 0)
            return list.data[0]

        await this.sandbox.customers.create({
            email : customer.email,
            name  : customer.name,
            phone : customer.phone
        });

        return (await this.sandbox.customers.list({
            email : customer.email, limit: 1
        })).data[0]
    }
    async capture(amount:number,customer: {email:string,name?:string,phone?:string},metadata ?: any){
        let {id} = await this.setCustomer(customer);

        let intent = await this.sandbox.paymentIntents.create({
            amount    : Number(amount) * 100,
            currency  : this.currency,
            customer  : id,
            metadata  : metadata || {},
            automatic_payment_methods: {
                enabled: true,
            }
        })
        return {
            id : intent.client_secret
        }
    }
}
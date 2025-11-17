import paypal from "@paypal/checkout-server-sdk";
export class PayPal {
    private readonly sandbox:any
    constructor(
        private mode : "development" | "production",
        private keys:{
            public:string,
            private:string
        },
        private currency: "USD" | "CAD" = "USD"
    ) {
        this.sandbox
            = this.mode === 'development'?paypal.core.SandboxEnvironment:paypal.core.LiveEnvironment;

        console.log(this.keys,this.mode)
    }
    async capture(amount:number,customer: {email:string}, metadata ?: any): Promise<{id:string}> {
        let client = new paypal.core.PayPalHttpClient(
            new this.sandbox(this.keys.public, this.keys.private)
        );

        let request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
            intent         : "CAPTURE",
            purchase_units : [
                {
                    amount: {
                        currency_code : this.currency,
                        value         : amount
                    },
                    custom_id : customer.email
                }
            ]
        });

        return (await client.execute(request)).result;
    }
}
import paypal from "@paypal/checkout-server-sdk";
export class PayPal {
    private readonly sandbox:any
    constructor(
        private mode : "development" | "production",
        private currency: "USD" | "CAD",
        private keys:{
            public:string,
            private:string
        }) {
        this.sandbox
            = mode === 'development'?paypal.core.SandboxEnvironment:paypal.core.LiveEnvironment;
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
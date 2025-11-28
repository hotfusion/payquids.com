import type {  StoryObj } from '@storybook/vue3';
import application from "../../api/src/@interface/invoice-payment/index.vue";

const meta = {
    title: 'collectors/invoice-payment',
    //@ts-ignore
    component: application,
    args : {
        theme : 'dark'
    },
    argTypes: {
        uri: {
            control: { type: 'select' },
            options: [ // must be here, at the same level as control
                'http://0.0.0.0:8700/gateway'
            ],
            description: 'Choose which server to connect to',
        },
    },
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
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args : {
        theme     : "dark",
        uri       : "http://0.0.0.0:8700/gateway",
        domain    : "digitaladsexp.com",
        amount    : 2,
        invoice   : '453434',
        client    : customer,
        currency  : "CAD",
    }
};

export const Receipt: Story = {
    args : {
        theme  : 'dark',
        uri    : "http://0.0.0.0:8700/gateway",
        domain : "digitaladsexp.com",
        receipt : {
            amount   : 10,
            currency : 'USD',
            customer : customer,
            card : {
                last4 : '9999',
                brand : 'visa'
            },
            profile : {
                email    : customer.email,
                provider : 'paypal'
            }
        }
    }
};








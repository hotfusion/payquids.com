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

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
    args : {
        theme  : 'dark',
        uri    : "http://0.0.0.0:8700/gateway",
        domain :"digitaladsexp.com",
        amount : 2,
        invoice : '453434',
        client : {
            name : 'Vadim Korolov',
            email : 'korolov.vadim@gmai.com',
            phone : '5149996659'
        }
    }
};








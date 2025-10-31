import type {  StoryObj } from '@storybook/vue3';
import application from './index.vue.js';

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
                'http://0.0.0.0:8890/gateway'
            ],
            description: 'Choose which server to connect to',
        },
    },
}

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
    args : {
        theme : 'dark',
        uri: "http://0.0.0.0:8890/gateway"
    }
};








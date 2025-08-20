import type {  StoryObj } from '@storybook/vue3';
import application from './index.vue.js';

const meta = {
    title: 'collectors/invoice-payment',
    //@ts-ignore
    component: application,
    args : {
        theme : 'dark'
    }
}

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
    args : {
        theme : 'dark'
    }
};








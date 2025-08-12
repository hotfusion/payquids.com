import type {  StoryObj } from '@storybook/vue3';
import application from './index.vue';

const meta = {
    title: 'collectors/donation',
    //@ts-ignore
    component: application,

}

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
    args : {

    }
};








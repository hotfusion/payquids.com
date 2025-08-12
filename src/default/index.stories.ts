import type {  StoryObj } from '@storybook/vue3';
import application from './index.vue';

const meta = {
    title: 'Default/Home',
    //@ts-ignore
    component: application,
    globals: { theme: 'dark' },
    parameters: {
        themes: {
            default: 'twitter',
            list: [
                { name: 'twitter', class: ['theme-twt', 'light-mode'], color: '#00aced' },
                { name: 'facebook', class: ['theme-fb', 'dark-mode'], color: '#3b5998' },
            ],
        },
    },

}

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
    args : {

    }
};








import type { StorybookConfig } from '@storybook/vue3-vite';
import { mergeConfig } from 'vite';
//@ts-ignore
import vue from '@vitejs/plugin-vue';


const config: StorybookConfig = {
    "stories": [
        "../**/*.stories.@(js|jsx|mjs|ts|tsx|vue|md)"
    ],
    "addons": [
        "@chromatic-com/storybook",
        "@storybook/addon-docs",
        "@storybook/addon-a11y",
        "@storybook/addon-vitest"
    ],
    "framework": {
        "name": "@storybook/vue3-vite",
        "options": {}
    },
    viteFinal: async (config) => {
        return mergeConfig(config, {
            plugins: [vue()]
        });
    }
};
export default config;
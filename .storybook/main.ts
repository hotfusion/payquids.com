import type { StorybookConfig } from '@storybook/vue3-vite';

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  addons: ['@storybook/addon-themes'],
  "framework": {
    "name": "@storybook/vue3-vite",
    "options": {}
  }
};
export default config;
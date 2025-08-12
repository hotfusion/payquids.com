import type { Preview } from '@storybook/vue3-vite'
import { addons } from '@storybook/manager-api';
import { withThemeByClassName } from '@storybook/addon-themes';
const preview: Preview = {
  parameters: {
      themes: {
          default: 'light',
          list: [
              { name: 'default', class: 'default', color: '#f0f0f0' },
              { name: 'dark', class: 'dark', color: '#333333' }
          ],
      },
      controls: {
          matchers: {
              color: /(background|color)$/i,
              date: /Date$/i
          },
      }
  }
};


export const decorators = [
    (Story,context) => {
        document.body.setAttribute('theme', context.globals.theme);
        return Story({
            args: {
                ...context.args,
                theme : context.globals.theme
            }
        });
    },
    withThemeByClassName({
        defaultTheme : 'default',
        themes : {
            default : 'default',
            dark    : 'dark',
            light   : ''
        }
    })
];

export default preview;
import type { Preview } from '@storybook/vue3-vite'
import { withThemeByClassName } from '@storybook/addon-themes';
const preview: Preview = {
  parameters: {

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
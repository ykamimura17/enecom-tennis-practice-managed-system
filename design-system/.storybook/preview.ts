import type { Preview } from '@storybook/react-vite';
import '../src/mobile.css';
const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'soft' },
    viewport: { options: { mobileSmall: { name: 'iPhone SE', styles: { width: '375px', height: '667px' } }, mobile: { name: 'iPhone', styles: { width: '390px', height: '844px' } }, mobileLarge: { name: 'Large mobile', styles: { width: '430px', height: '932px' } } } },
  },
};
export default preview;

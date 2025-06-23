import { defineVuesticConfig } from 'vuestic-ui';
import colors from './themes';

export default defineVuesticConfig({
  colors,
  breakpoint: {
    enabled: false,
    bodyClass: true,
    thresholds: {
      xs: 0,
      sm: 320,
      md: 640,
      lg: 900,
      xl: 1440,
    },
  },
});

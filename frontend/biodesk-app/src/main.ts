import { createVuestic } from 'vuestic-ui';
import 'vuestic-ui/styles/essential.css';
import 'vuestic-ui/styles/typography.css';
import './assets/main.css';
import 'tailwindcss/tailwind.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';
import vuesticGlobalConfig from '@/services/vuestic-ui/global-config';

const app = createApp(App);

app.use(createPinia());
app.use(router);
/*
app.use(
  createVuesticEssential({
    config: vuesticGlobalConfig,
    components: {
      VaButton,
      VaSwitch,
      VaCard,
      VaCardTitle,
      VaCardContent,
      VaLayout,
      VaForm,
      VaInput,
      VaIcon,
      VaValue,
      VaCheckbox,
    },
  })
);
*/
app.use(createVuestic({ config: vuesticGlobalConfig }));
app.mount('#app');

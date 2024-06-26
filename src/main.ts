import './styles/main.css';
import { createApp } from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
const app = createApp(App).use(createPinia().use(piniaPluginPersistedstate));
app.mount('#app');

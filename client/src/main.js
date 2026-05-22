import { createApp } from 'vue'
import './assets/css/main.css'
import App from './App.vue'
import router from './router'
import { auth } from "./stores/auth";

auth.fetchMe().finally(() => {  createApp(App).use(router).mount("#app");});



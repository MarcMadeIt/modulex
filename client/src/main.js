import { createApp } from 'vue'
import './assets/css/main.css'
import App from './App.vue'
import router from './router'

//createApp(App).mount('#app')

//App.use(router)

createApp(App).use(router).mount('#app')

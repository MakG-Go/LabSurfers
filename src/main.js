import { createApp } from 'vue'
import '@/scss/style.scss'
import store from "@/store/index.js"
import App from './App.vue'

createApp(App).use(store).mount('#app')

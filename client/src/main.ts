// Polyfill for browser bundles that depend on Node globals (e.g., simple-peer/readable-stream).
import process from 'process'
if (!(globalThis as unknown as { process?: unknown }).process) {
  ;(globalThis as unknown as { process: unknown }).process = process
}

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './app/router/index'
import { useSettingsStore } from './stores/settings.store'
import './styles/main.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

// Apply persisted theme ASAP to avoid flash.
useSettingsStore(pinia).applyTheme()

app.use(router)
app.mount('#app')

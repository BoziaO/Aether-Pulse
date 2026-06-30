import process from 'process'
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import { router } from './app/router/index'
import { useSettingsStore } from './stores/settings.store'
import { useToastStore } from './stores/toast.store'
import { privacy } from './services/privacy/tracker-blocker'
import { syncEngine } from './services/offline/sync-engine'
import './styles/main.css'

if (!(globalThis as unknown as { process?: unknown }).process) {
  (globalThis as unknown as { process: unknown }).process = process
}

privacy.init()

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

app.config.errorHandler = (err, _instance, info) => {
  console.error('Vue error:', err, info)
  try {
    const toast = useToastStore(pinia)
    toast.error('An unexpected error occurred. Please try again.')
  } catch (e) {
    console.error('Failed to show error toast:', e)
  }
}

useSettingsStore(pinia).applyTheme()

syncEngine.init()

app.use(router)
app.mount('#app')

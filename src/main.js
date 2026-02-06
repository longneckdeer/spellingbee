import { createApp } from 'vue'
import App from './App.vue'
import './assets/main.css'
import { gameStore } from './stores/gameStore'

createApp(App).mount('#app')

// Expose gameStore to window for testing
if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
  window.gameStore = gameStore
}

import { mount } from 'svelte'
import { themeStore } from '@/stores/themeStore'
import App from './Popup.svelte'

// popup.ts

class PopupManager {
  constructor() {
    this.initialize()
  }

  private async initialize() {
    // Initialize theme before mounting
    await themeStore.initialize()
    const appElement = document.getElementById('app')
    if (appElement) {
      mount(App, { target: appElement })
    }
  }
}

// Initialize popup
new PopupManager()

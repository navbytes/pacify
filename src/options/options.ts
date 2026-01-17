import { mount } from 'svelte'
import { themeStore } from '@/stores/themeStore'
import App from './Options.svelte'

class OptionsManager {
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

// Initialize options
new OptionsManager()

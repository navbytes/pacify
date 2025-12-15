import { mount } from 'svelte'
import App from './Options.svelte'
import { themeStore } from '@/stores/themeStore'

class OptionsManager {
  constructor() {
    this.initialize()
  }

  private async initialize() {
    // Initialize theme before mounting
    await themeStore.initialize()
    mount(App, { target: document.getElementById('app')! })
  }
}

// Initialize options
new OptionsManager()

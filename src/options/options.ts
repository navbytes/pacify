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
    mount(App, { target: document.getElementById('app')! })
  }
}

// Initialize options
new OptionsManager()

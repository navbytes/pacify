import { mount } from 'svelte'
import App from './Options.svelte'

class OptionsManager {
  constructor() {
    this.initialize()
  }

  private async initialize() {
    mount(App, { target: document.getElementById('app')! })
  }
}

// Initialize options
new OptionsManager()

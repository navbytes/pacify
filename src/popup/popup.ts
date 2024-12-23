import { mount } from 'svelte'
import App from './Popup.svelte'

// popup.ts

class PopupManager {
  constructor() {
    this.initialize()
  }

  private async initialize() {
    mount(App, { target: document.getElementById('app')! })
  }
}

// Initialize popup
new PopupManager()

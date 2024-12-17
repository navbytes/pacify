import { LocaleManager } from '@/locales/Locale'
import App from './Popup.svelte'

// popup.ts

class PopupManager {
  constructor() {
    this.initialize()
  }

  private async initialize() {
    LocaleManager.initialize()
    new App({ target: document.getElementById('app')! })
  }
}

// Initialize popup
new PopupManager()

import { LocaleManager } from '@/locales/Locale'
import App from './Options.svelte'

class OptionsManager {
  constructor() {
    this.initialize()
  }

  private async initialize() {
    LocaleManager.initialize()
    new App({ target: document.getElementById('app')! })
  }
}

// Initialize options
new OptionsManager()

import type { Component } from 'svelte'
import { mount } from 'svelte'
import { I18nService } from '@/services/i18n/i18nService'
import { themeStore } from '@/stores/themeStore'

/**
 * Reflect the active UI language on the document so assistive tech announces
 * content in the correct language (the HTML ships with a static `lang="en"`,
 * but the UI is localized into 12 languages). Also set text direction for
 * RTL locales.
 */
function applyDocumentLocale(): void {
  try {
    const lang = I18nService.getCurrentLocale()
    if (lang) document.documentElement.lang = lang
    document.documentElement.dir = I18nService.isRTL() ? 'rtl' : 'ltr'
  } catch {
    // chrome.i18n may be unavailable in some contexts; the static lang stands.
  }
}

/**
 * Shared entry point for mounting a Svelte app with theme initialization.
 * Used by popup.ts, options.ts, and privacy.ts.
 */
export async function mountApp(App: Component): Promise<void> {
  applyDocumentLocale()
  await themeStore.initialize()
  const appElement = document.getElementById('app')
  if (appElement) {
    mount(App, { target: appElement })
  }
}

import type { Component } from 'svelte'
import { mount } from 'svelte'
import { themeStore } from '@/stores/themeStore'

/**
 * Shared entry point for mounting a Svelte app with theme initialization.
 * Used by popup.ts, options.ts, and privacy.ts.
 */
export async function mountApp(App: Component): Promise<void> {
  await themeStore.initialize()
  const appElement = document.getElementById('app')
  if (appElement) {
    mount(App, { target: appElement })
  }
}

import { writable } from 'svelte/store'

export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme-preference'

function getSystemTheme(): 'light' | 'dark' {
  // Runtime check for browser environment
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light'
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  console.log('[applyTheme] Called with theme:', theme)

  // Runtime check for browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.log('[applyTheme] Not in browser environment, skipping')
    return
  }

  const effectiveTheme = theme === 'system' ? getSystemTheme() : theme
  console.log('[applyTheme] Effective theme:', effectiveTheme)

  if (effectiveTheme === 'dark') {
    console.log('[applyTheme] Adding dark class to document')
    document.documentElement.classList.add('dark')
  } else {
    console.log('[applyTheme] Removing dark class from document')
    document.documentElement.classList.remove('dark')
  }
  console.log('[applyTheme] Current classes:', document.documentElement.className)
}

function createThemeStore() {
  const { subscribe, set } = writable<Theme>('system')

  // Load theme from storage on initialization
  async function initialize() {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY)
      const savedTheme = (result[STORAGE_KEY] as Theme) || 'system'
      set(savedTheme)
      applyTheme(savedTheme)
    } catch (error) {
      console.error('Failed to load theme preference:', error)
      // Fallback to system theme
      set('system')
      applyTheme('system')
    }
  }

  // Listen for system theme changes (only in browser contexts)
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', () => {
      // Re-apply theme when system preference changes
      subscribe((currentTheme) => {
        if (currentTheme === 'system') {
          applyTheme('system')
        }
      })()
    })
  }

  return {
    subscribe,
    setTheme: async (theme: Theme) => {
      console.log('[ThemeStore] setTheme called with:', theme)
      try {
        console.log('[ThemeStore] Saving to storage...')
        await chrome.storage.local.set({ [STORAGE_KEY]: theme })
        console.log('[ThemeStore] Updating store state...')
        set(theme)
        console.log('[ThemeStore] Applying theme to DOM...')
        applyTheme(theme)
        console.log('[ThemeStore] Theme applied successfully')
      } catch (error) {
        console.error('[ThemeStore] Failed to save theme preference:', error)
        throw error
      }
    },
    initialize,
  }
}

export const themeStore = createThemeStore()

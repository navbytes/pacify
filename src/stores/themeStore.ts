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
  // Runtime check for browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }

  const effectiveTheme = theme === 'system' ? getSystemTheme() : theme

  if (effectiveTheme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
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
      try {
        await chrome.storage.local.set({ [STORAGE_KEY]: theme })
        set(theme)
        applyTheme(theme)
      } catch (error) {
        console.error('Failed to save theme preference:', error)
      }
    },
    initialize,
  }
}

export const themeStore = createThemeStore()

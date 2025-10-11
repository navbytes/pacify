// Vitest global setup file
import { vi } from 'vitest'

// Mock Chrome APIs globally
const chromeMock = {
  runtime: {
    getURL: vi.fn((path: string) => `chrome-extension://mock-id/${path}`),
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onStartup: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onInstalled: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    lastError: undefined,
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    },
    sync: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    },
  },
  action: {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
    setPopup: vi.fn(),
    onClicked: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  proxy: {
    settings: {
      set: vi.fn(),
      clear: vi.fn(),
      get: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn(),
    reload: vi.fn(),
  },
  notifications: {
    create: vi.fn(),
    clear: vi.fn(),
    getAll: vi.fn(),
  },
}

// @ts-expect-error - Mocking Chrome API
global.chrome = chromeMock

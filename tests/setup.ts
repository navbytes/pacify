/**
 * Bun Test Setup File
 * This file is automatically loaded before running tests (configured in bunfig.toml)
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'bun:test'

// Global test timeout (can be overridden per test)
export const TEST_TIMEOUT = 5000

// Mock Chrome API for testing
const mockChrome = {
  runtime: {
    lastError: null,
    sendMessage: () => Promise.resolve(),
    onMessage: {
      addListener: () => {},
      removeListener: () => {},
    },
  },
  storage: {
    sync: {
      get: () => Promise.resolve({}),
      set: () => Promise.resolve(),
      remove: () => Promise.resolve(),
      clear: () => Promise.resolve(),
    },
    local: {
      get: () => Promise.resolve({}),
      set: () => Promise.resolve(),
      remove: () => Promise.resolve(),
      clear: () => Promise.resolve(),
    },
  },
  proxy: {
    settings: {
      set: () => Promise.resolve(),
      get: () => Promise.resolve({}),
      clear: () => Promise.resolve(),
    },
  },
}

// Setup global chrome object for tests
beforeAll(() => {
  // @ts-expect-error - Mock chrome API
  globalThis.chrome = mockChrome
  console.log('🧪 Bun test environment initialized')
})

// Cleanup after all tests
afterAll(() => {
  console.log('✅ All tests completed')
})

// Reset mocks before each test
beforeEach(() => {
  // Reset any mock state if needed
})

// Cleanup after each test
afterEach(() => {
  // Clear any test-specific state
})

// Helper function to create mock proxy configurations
export function createMockProxyConfig(overrides = {}) {
  return {
    id: 'test-proxy-1',
    name: 'Test Proxy',
    color: 'blue',
    mode: 'fixed_servers',
    quickSwitch: false,
    active: false,
    ...overrides,
  }
}

// Helper function to wait for async operations
export function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Helper to mock chrome storage responses
export function mockStorageGet(data: any) {
  mockChrome.storage.sync.get = () => Promise.resolve(data)
  mockChrome.storage.local.get = () => Promise.resolve(data)
}

// Helper to mock chrome storage set
export function mockStorageSet() {
  let storedData = {}
  mockChrome.storage.sync.set = (data: any) => {
    storedData = { ...storedData, ...data }
    return Promise.resolve()
  }
  return () => storedData
}

export { mockChrome }

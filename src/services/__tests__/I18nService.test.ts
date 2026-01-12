import { beforeEach, describe, expect, mock, test } from 'bun:test'

// Store original chrome mock
const originalChrome = globalThis.chrome

describe('I18nService', () => {
  // Define mockMessages that can be modified per test
  let mockMessages: Record<string, string>
  let mockLocale: string
  let mockBidiDir: string

  beforeEach(() => {
    // Reset mock values
    mockMessages = {
      appTitle: 'Pacify',
      proxyEnabled: 'Proxy Enabled',
      proxyDisabled: 'Proxy Disabled',
      settingsTitle: 'Settings',
      '@@bidi_dir': 'ltr',
    }
    mockLocale = 'en'
    mockBidiDir = 'ltr'

    // Setup chrome.i18n mock
    globalThis.chrome = {
      ...originalChrome,
      i18n: {
        getMessage: mock((messageName: string, _substitutions?: string | string[]) => {
          if (messageName === '@@bidi_dir') {
            return mockBidiDir
          }
          return mockMessages[messageName] || ''
        }),
        getUILanguage: mock(() => mockLocale),
      },
    } as unknown as typeof chrome
  })

  // Import fresh module for each test suite
  const getI18nService = async () => {
    // Clear module cache to get fresh import
    delete require.cache[require.resolve('../i18n/i18nService')]
    const module = await import('../i18n/i18nService')
    return module.I18nService
  }

  describe('getMessage', () => {
    test('returns translated message for valid key', async () => {
      const I18nService = await getI18nService()

      const message = I18nService.getMessage('appTitle')

      expect(message).toBe('Pacify')
    })

    test('returns messageName when translation not found', async () => {
      const I18nService = await getI18nService()

      const message = I18nService.getMessage('nonExistentKey')

      expect(message).toBe('nonExistentKey')
    })

    test('passes string substitution to chrome.i18n.getMessage', async () => {
      mockMessages.welcomeUser = 'Welcome, $1!'
      globalThis.chrome = {
        ...globalThis.chrome,
        i18n: {
          ...globalThis.chrome.i18n,
          getMessage: mock((messageName: string, substitutions?: string | string[]) => {
            if (messageName === 'welcomeUser' && substitutions === 'John') {
              return 'Welcome, John!'
            }
            return mockMessages[messageName] || ''
          }),
        },
      } as unknown as typeof chrome

      const I18nService = await getI18nService()

      const message = I18nService.getMessage('welcomeUser', 'John')

      expect(message).toBe('Welcome, John!')
    })

    test('passes array substitution to chrome.i18n.getMessage', async () => {
      globalThis.chrome = {
        ...globalThis.chrome,
        i18n: {
          ...globalThis.chrome.i18n,
          getMessage: mock((messageName: string, substitutions?: string | string[]) => {
            if (messageName === 'multipleArgs' && Array.isArray(substitutions)) {
              return `Hello ${substitutions[0]} and ${substitutions[1]}`
            }
            return mockMessages[messageName] || ''
          }),
        },
      } as unknown as typeof chrome

      const I18nService = await getI18nService()

      const message = I18nService.getMessage('multipleArgs', ['Alice', 'Bob'])

      expect(message).toBe('Hello Alice and Bob')
    })

    test('returns different messages for different keys', async () => {
      const I18nService = await getI18nService()

      expect(I18nService.getMessage('appTitle')).toBe('Pacify')
      expect(I18nService.getMessage('proxyEnabled')).toBe('Proxy Enabled')
      expect(I18nService.getMessage('proxyDisabled')).toBe('Proxy Disabled')
      expect(I18nService.getMessage('settingsTitle')).toBe('Settings')
    })

    test('handles empty string messages', async () => {
      mockMessages.emptyMessage = ''
      const I18nService = await getI18nService()

      const message = I18nService.getMessage('emptyMessage')

      // Returns the key when message is empty
      expect(message).toBe('emptyMessage')
    })
  })

  describe('getCurrentLocale', () => {
    test('returns current UI language', async () => {
      mockLocale = 'en'
      const I18nService = await getI18nService()

      const locale = I18nService.getCurrentLocale()

      expect(locale).toBe('en')
    })

    test('returns different locale when changed', async () => {
      mockLocale = 'ja'
      globalThis.chrome = {
        ...globalThis.chrome,
        i18n: {
          ...globalThis.chrome.i18n,
          getUILanguage: mock(() => 'ja'),
        },
      } as unknown as typeof chrome

      const I18nService = await getI18nService()

      const locale = I18nService.getCurrentLocale()

      expect(locale).toBe('ja')
    })

    test('returns locale with region', async () => {
      globalThis.chrome = {
        ...globalThis.chrome,
        i18n: {
          ...globalThis.chrome.i18n,
          getUILanguage: mock(() => 'en-US'),
        },
      } as unknown as typeof chrome

      const I18nService = await getI18nService()

      const locale = I18nService.getCurrentLocale()

      expect(locale).toBe('en-US')
    })
  })

  describe('isRTL', () => {
    test('returns false for LTR language', async () => {
      mockBidiDir = 'ltr'
      const I18nService = await getI18nService()

      const isRtl = I18nService.isRTL()

      expect(isRtl).toBe(false)
    })

    test('returns true for RTL language', async () => {
      mockBidiDir = 'rtl'
      globalThis.chrome = {
        ...globalThis.chrome,
        i18n: {
          ...globalThis.chrome.i18n,
          getMessage: mock((messageName: string) => {
            if (messageName === '@@bidi_dir') {
              return 'rtl'
            }
            return mockMessages[messageName] || ''
          }),
        },
      } as unknown as typeof chrome

      const I18nService = await getI18nService()

      const isRtl = I18nService.isRTL()

      expect(isRtl).toBe(true)
    })
  })

  describe('edge cases', () => {
    test('handles special characters in message keys', async () => {
      mockMessages['key_with_underscores'] = 'Works with underscores'
      const I18nService = await getI18nService()

      const message = I18nService.getMessage('key_with_underscores')

      expect(message).toBe('Works with underscores')
    })

    test('handles unicode message content', async () => {
      mockMessages.unicodeContent = '你好世界 🌍'
      const I18nService = await getI18nService()

      const message = I18nService.getMessage('unicodeContent')

      expect(message).toBe('你好世界 🌍')
    })

    test('handles HTML entities in messages', async () => {
      mockMessages.htmlContent = '&lt;script&gt;alert(1)&lt;/script&gt;'
      const I18nService = await getI18nService()

      const message = I18nService.getMessage('htmlContent')

      expect(message).toBe('&lt;script&gt;alert(1)&lt;/script&gt;')
    })
  })
})

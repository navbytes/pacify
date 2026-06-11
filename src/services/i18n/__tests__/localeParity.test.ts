import { describe, expect, test } from 'bun:test'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Locale parity guard.
 *
 * The English locale (`_locales/en/messages.json`) is the source of truth for
 * every user-facing string. These tests fail if any other locale drifts out of
 * lockstep — a missing key would silently fall back to English in the UI, and a
 * stale key is dead weight that hides the drift. Keeping them mirrored is what
 * makes the "full localization parity" claim verifiable in CI rather than by eye.
 */

const localesDir = fileURLToPath(new URL('../../../../_locales', import.meta.url))

type Messages = Record<string, { message: string; placeholders?: Record<string, unknown> }>

function readLocale(locale: string): Messages {
  const raw = readFileSync(`${localesDir}/${locale}/messages.json`, 'utf-8')
  return JSON.parse(raw) as Messages
}

const BASE_LOCALE = 'en'
const allLocales = readdirSync(localesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()

const otherLocales = allLocales.filter((locale) => locale !== BASE_LOCALE)
const base = readLocale(BASE_LOCALE)
const baseKeys = Object.keys(base).sort()

describe('locale parity', () => {
  test('the base English locale exists and is non-empty', () => {
    expect(allLocales).toContain(BASE_LOCALE)
    expect(baseKeys.length).toBeGreaterThan(0)
  })

  test('there is more than one locale to keep in sync', () => {
    expect(otherLocales.length).toBeGreaterThan(0)
  })

  for (const locale of otherLocales) {
    describe(`${locale}`, () => {
      const messages = readLocale(locale)
      const keys = new Set(Object.keys(messages))

      test('has every key present in en (no English fallbacks)', () => {
        const missing = baseKeys.filter((key) => !keys.has(key))
        expect(
          missing,
          `${locale} is missing ${missing.length} key(s): ${missing.join(', ')}`
        ).toEqual([])
      })

      test('has no keys that no longer exist in en (no stale entries)', () => {
        const baseKeySet = new Set(baseKeys)
        const extra = [...keys].filter((key) => !baseKeySet.has(key)).sort()
        expect(extra, `${locale} has ${extra.length} stale key(s): ${extra.join(', ')}`).toEqual([])
      })

      test('every entry has a non-empty message string', () => {
        const blank = Object.entries(messages)
          .filter(([, value]) => typeof value?.message !== 'string' || value.message.trim() === '')
          .map(([key]) => key)
        expect(
          blank,
          `${locale} has ${blank.length} blank message(s): ${blank.join(', ')}`
        ).toEqual([])
      })

      test('preserves the same $N / named placeholders as en', () => {
        // A translation that drops or invents a placeholder token will render a
        // literal "$1" or lose an interpolated value, so the token set must match.
        const tokensOf = (s: string): string[] => (s.match(/\$[a-zA-Z0-9_]+\$|\$\d+/g) ?? []).sort()

        const mismatched: string[] = []
        for (const key of baseKeys) {
          if (!keys.has(key)) continue // missing-key test already covers this
          const expected = tokensOf(base[key].message)
          const actual = tokensOf(messages[key].message)
          if (JSON.stringify(expected) !== JSON.stringify(actual)) {
            mismatched.push(`${key} (en:[${expected}] vs ${locale}:[${actual}])`)
          }
        }
        expect(
          mismatched,
          `${locale} has ${mismatched.length} placeholder mismatch(es): ${mismatched.join('; ')}`
        ).toEqual([])
      })
    })
  }
})

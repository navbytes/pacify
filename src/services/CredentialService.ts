import { browserService } from './chrome/BrowserService'
import { logger } from './LoggerService'

const CREDENTIAL_STORAGE_KEY = 'pacify_credentials'
const CRYPTO_KEY_STORAGE_KEY = 'pacify_crypto_key'

interface StoredCredentials {
  [proxyConfigId: string]: {
    [serverKey: string]: { username: string; password: string }
  }
}

/**
 * Manages proxy credentials with encryption at rest.
 * Credentials are stored in chrome.storage.local (not synced across devices)
 * and encrypted using AES-GCM via the Web Crypto API.
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Service class pattern
export class CredentialService {
  private static cryptoKey: CryptoKey | null = null

  private static async getOrCreateKey(): Promise<CryptoKey> {
    if (CredentialService.cryptoKey) return CredentialService.cryptoKey

    try {
      const sessionData = await chrome.storage.session.get(CRYPTO_KEY_STORAGE_KEY)
      const stored = sessionData[CRYPTO_KEY_STORAGE_KEY] as number[] | undefined
      if (stored) {
        const rawKey = new Uint8Array(stored)
        CredentialService.cryptoKey = await crypto.subtle.importKey(
          'raw',
          rawKey,
          'AES-GCM',
          true,
          ['encrypt', 'decrypt']
        )
        return CredentialService.cryptoKey
      }
    } catch {
      // session storage may not be available in all contexts
    }

    const extensionId = chrome.runtime.id || 'pacify-default-key'
    const encoder = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(extensionId),
      'PBKDF2',
      false,
      ['deriveKey']
    )

    CredentialService.cryptoKey = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: encoder.encode('pacify-salt'), iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )

    try {
      const exported = await crypto.subtle.exportKey('raw', CredentialService.cryptoKey)
      await chrome.storage.session.set({
        [CRYPTO_KEY_STORAGE_KEY]: Array.from(new Uint8Array(exported)),
      })
    } catch {
      // session storage may not be available
    }

    return CredentialService.cryptoKey
  }

  private static async encrypt(plaintext: string): Promise<string> {
    const key = await CredentialService.getOrCreateKey()
    const encoder = new TextEncoder()
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(plaintext)
    )
    const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length)
    combined.set(iv)
    combined.set(new Uint8Array(encrypted), iv.length)
    return btoa(String.fromCharCode(...combined))
  }

  private static async decrypt(ciphertext: string): Promise<string> {
    const key = await CredentialService.getOrCreateKey()
    const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0))
    const iv = combined.slice(0, 12)
    const data = combined.slice(12)
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
    return new TextDecoder().decode(decrypted)
  }

  static async saveCredentials(
    configId: string,
    credentials: Record<string, { username: string; password: string }>
  ): Promise<void> {
    try {
      const existing = await CredentialService.loadAllCredentials()
      existing[configId] = credentials

      const plaintext = JSON.stringify(existing)
      const encrypted = await CredentialService.encrypt(plaintext)
      await browserService.storage.local.set({ [CREDENTIAL_STORAGE_KEY]: encrypted })
    } catch (error) {
      logger.error('Failed to save credentials:', error)
    }
  }

  static async loadCredentials(
    configId: string
  ): Promise<Record<string, { username: string; password: string }> | null> {
    try {
      const all = await CredentialService.loadAllCredentials()
      return all[configId] || null
    } catch (error) {
      logger.error('Failed to load credentials:', error)
      return null
    }
  }

  static async deleteCredentials(configId: string): Promise<void> {
    try {
      const existing = await CredentialService.loadAllCredentials()
      delete existing[configId]

      const plaintext = JSON.stringify(existing)
      const encrypted = await CredentialService.encrypt(plaintext)
      await browserService.storage.local.set({ [CREDENTIAL_STORAGE_KEY]: encrypted })
    } catch (error) {
      logger.error('Failed to delete credentials:', error)
    }
  }

  private static async loadAllCredentials(): Promise<StoredCredentials> {
    try {
      const data = await browserService.storage.local.get(CREDENTIAL_STORAGE_KEY)
      const encrypted = data[CREDENTIAL_STORAGE_KEY] as string | undefined
      if (!encrypted) return {}

      const decrypted = await CredentialService.decrypt(encrypted)
      return JSON.parse(decrypted) as StoredCredentials
    } catch (error) {
      logger.error('Failed to decrypt credentials (key may have changed):', error)
      return {}
    }
  }
}

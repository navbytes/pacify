import { describe, expect, test } from 'bun:test'
import { DEFAULT_SETTINGS } from '@/constants/app'
import type { AppSettings, ProxyConfig, ProxyServer } from '@/interfaces'
import { selectActiveProxyCredentials } from '../proxyAuth'

function server(overrides: Partial<ProxyServer>): ProxyServer {
  return { scheme: 'http', host: 'proxy.example', port: '8080', ...overrides }
}

function settings(configs: ProxyConfig[], activeScriptId: string | null = null): AppSettings {
  return { ...DEFAULT_SETTINGS, proxyConfigs: configs, activeScriptId }
}

function cfg(overrides: Partial<ProxyConfig>): ProxyConfig {
  return {
    id: 'c1',
    name: 'P',
    color: '#000',
    isActive: false,
    mode: 'fixed_servers',
    ...overrides,
  }
}

describe('selectActiveProxyCredentials', () => {
  test('returns null when settings are missing', () => {
    expect(selectActiveProxyCredentials(null)).toBeNull()
    expect(selectActiveProxyCredentials(undefined)).toBeNull()
  })

  test('returns null when there is no active config', () => {
    expect(selectActiveProxyCredentials(settings([cfg({ isActive: false })]))).toBeNull()
  })

  test('returns null when the active config has no credentials', () => {
    const active = cfg({
      isActive: true,
      rules: { singleProxy: server({ username: '', password: '' }) },
    })
    expect(selectActiveProxyCredentials(settings([active]))).toBeNull()
  })

  test('returns the single-proxy credentials for an active config', () => {
    const active = cfg({
      isActive: true,
      rules: { singleProxy: server({ username: 'u', password: 'p' }) },
    })
    expect(selectActiveProxyCredentials(settings([active]))).toEqual({
      username: 'u',
      password: 'p',
    })
  })

  test('resolves the active config via activeScriptId when isActive is unset', () => {
    const active = cfg({
      id: 'abc',
      isActive: false,
      rules: { singleProxy: server({ username: 'viaId', password: 'pw' }) },
    })
    expect(selectActiveProxyCredentials(settings([active], 'abc'))).toEqual({
      username: 'viaId',
      password: 'pw',
    })
  })

  test('prefers the server whose host matches the challenger', () => {
    const active = cfg({
      isActive: true,
      rules: {
        proxyForHttp: server({ host: 'http.proxy', username: 'httpUser', password: '1' }),
        proxyForHttps: server({ host: 'https.proxy', username: 'httpsUser', password: '2' }),
      },
    })
    expect(selectActiveProxyCredentials(settings([active]), 'https.proxy')).toEqual({
      username: 'httpsUser',
      password: '2',
    })
  })

  test('falls back to the first credentialed server when no host matches', () => {
    const active = cfg({
      isActive: true,
      rules: {
        proxyForHttp: server({ host: 'http.proxy', username: 'first', password: '1' }),
        fallbackProxy: server({ host: 'fb.proxy', username: 'second', password: '2' }),
      },
    })
    expect(selectActiveProxyCredentials(settings([active]), 'nope.proxy')).toEqual({
      username: 'first',
      password: '1',
    })
  })

  test('only the active config is consulted, not other configs', () => {
    const inactive = cfg({
      id: 'other',
      isActive: false,
      rules: { singleProxy: server({ username: 'shouldNotUse', password: 'x' }) },
    })
    const active = cfg({
      id: 'active',
      isActive: true,
      rules: { singleProxy: server({ username: 'correct', password: 'y' }) },
    })
    expect(selectActiveProxyCredentials(settings([inactive, active]))).toEqual({
      username: 'correct',
      password: 'y',
    })
  })
})

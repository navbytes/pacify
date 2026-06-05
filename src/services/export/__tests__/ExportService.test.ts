import { describe, expect, test } from 'bun:test'
import { DEFAULT_SETTINGS } from '@/constants/app'
import type { AppSettings, ProxyConfig } from '@/interfaces'
import { ExportService } from '../ExportService'
import { FoxyProxyExporter } from '../FoxyProxyExporter'
import { SwitchyOmegaExporter } from '../SwitchyOmegaExporter'

const fixedProxy: ProxyConfig = {
  id: 'p1',
  name: 'Work',
  color: '#112233',
  isActive: false,
  mode: 'fixed_servers',
  rules: {
    singleProxy: { scheme: 'http', host: '10.0.0.1', port: '8080' },
    bypassList: ['*.internal.net'],
  },
}

const autoProxy: ProxyConfig = {
  id: 'a1',
  name: 'Auto',
  color: '#445566',
  isActive: false,
  mode: 'pac_script',
  autoProxy: {
    rules: [
      {
        id: 'r1',
        pattern: '*.example.com',
        matchType: 'wildcard',
        proxyType: 'existing',
        proxyId: 'p1',
        enabled: true,
        priority: 0,
      },
    ],
    fallbackType: 'direct',
  },
}

const settings: AppSettings = {
  ...DEFAULT_SETTINGS,
  proxyConfigs: [fixedProxy, autoProxy],
}

describe('SwitchyOmegaExporter', () => {
  test('exports a FixedProfile under a +name key', () => {
    const out = SwitchyOmegaExporter.export([fixedProxy]) as Record<string, any>
    expect(out.schemaVersion).toBe(2)
    const profile = out['+Work']
    expect(profile.profileType).toBe('FixedProfile')
    expect(profile.fallbackProxy).toEqual({ scheme: 'http', host: '10.0.0.1', port: 8080 })
    expect(profile.bypassList[0]).toEqual({
      conditionType: 'BypassCondition',
      pattern: '*.internal.net',
    })
  })

  test('exports a SwitchProfile resolving rule proxy ids back to names', () => {
    const out = SwitchyOmegaExporter.export([fixedProxy, autoProxy]) as Record<string, any>
    const profile = out['+Auto']
    expect(profile.profileType).toBe('SwitchProfile')
    expect(profile.rules[0].condition).toEqual({
      conditionType: 'HostWildcardCondition',
      pattern: '*.example.com',
    })
    expect(profile.rules[0].profileName).toBe('Work')
    expect(profile.defaultProfileName).toBe('direct')
  })
})

describe('FoxyProxyExporter', () => {
  test('exports fixed proxies with bypass as blackPatterns', () => {
    const out = FoxyProxyExporter.export([fixedProxy])
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ title: 'Work', type: 'http', address: '10.0.0.1', port: 8080 })
    expect(out[0].blackPatterns?.[0].pattern).toBe('*://*.internal.net/*')
  })

  test('skips Auto-Proxy configs that have no FoxyProxy representation', () => {
    const out = FoxyProxyExporter.export([autoProxy])
    expect(out).toHaveLength(0)
  })
})

describe('ExportService.build', () => {
  test('builds a PACify backup artifact', () => {
    const artifact = ExportService.build('pacify', settings)
    expect(artifact.filename).toBe('pacify-settings-backup.json')
    expect(JSON.parse(artifact.content).proxyConfigs).toHaveLength(2)
  })

  test('builds a SwitchyOmega artifact', () => {
    const artifact = ExportService.build('switchyomega', settings)
    expect(artifact.filename.endsWith('.bak')).toBe(true)
    expect(JSON.parse(artifact.content)['+Work']).toBeDefined()
  })

  test('builds a FoxyProxy artifact', () => {
    const artifact = ExportService.build('foxyproxy', settings)
    expect(artifact.filename.endsWith('.json')).toBe(true)
    expect(Array.isArray(JSON.parse(artifact.content))).toBe(true)
  })

  test('round-trips a fixed proxy through SwitchyOmega export and re-import', async () => {
    const artifact = ExportService.build('switchyomega', settings)
    const { ImportService } = await import('@/services/import/ImportService')
    const result = ImportService.parse(artifact.content)
    const work = result.configs.find((c) => c.name === 'Work')
    expect(work?.mode).toBe('fixed_servers')
    expect(work?.rules?.singleProxy).toEqual({ scheme: 'http', host: '10.0.0.1', port: '8080' })
  })
})

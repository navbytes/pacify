import { describe, expect, test } from 'bun:test'
import { PacifyAdapter } from '../adapters/PacifyAdapter'

describe('PacifyAdapter', () => {
  test('returns an empty pacify report for non-object input', () => {
    for (const input of [null, undefined, 42, 'string', true]) {
      const { configs, report } = PacifyAdapter.map(input)
      expect(configs).toHaveLength(0)
      expect(report).toEqual({
        source: 'pacify',
        proxyCount: 0,
        ruleCount: 0,
        warnings: [],
      })
    }
  })

  test('returns an empty report when proxyConfigs is missing or not an array', () => {
    expect(PacifyAdapter.map({}).configs).toHaveLength(0)
    expect(PacifyAdapter.map({ proxyConfigs: 'nope' }).configs).toHaveLength(0)
    expect(PacifyAdapter.map({ proxyConfigs: {} }).configs).toHaveLength(0)
    const { report } = PacifyAdapter.map({ proxyConfigs: null })
    expect(report.proxyCount).toBe(0)
    expect(report.warnings).toHaveLength(0)
  })

  test('skips null / non-object entries without a warning', () => {
    const { configs, report } = PacifyAdapter.map({
      proxyConfigs: [null, 'string', 7, undefined],
    })
    expect(configs).toHaveLength(0)
    // Non-object entries are dropped silently (no name to attribute a warning to).
    expect(report.warnings).toHaveLength(0)
  })

  test('skips entries with empty / whitespace / missing name and warns', () => {
    const { configs, report } = PacifyAdapter.map({
      proxyConfigs: [
        { mode: 'direct' }, // missing name
        { name: '', mode: 'direct' }, // empty name
        { name: '   ', mode: 'direct' }, // whitespace-only name
      ],
    })
    expect(configs).toHaveLength(0)
    expect(report.warnings).toHaveLength(3)
    expect(report.warnings.every((w) => w.level === 'skipped')).toBe(true)
    expect(report.warnings[0].context).toBe('Entry 1')
    expect(report.warnings[0].message).toContain('no name')
    expect(report.warnings[1].context).toBe('Entry 2')
    expect(report.warnings[2].context).toBe('Entry 3')
  })

  test('skips entries with invalid or missing mode and warns using the name as context', () => {
    const { configs, report } = PacifyAdapter.map({
      proxyConfigs: [
        { name: 'Bad mode', mode: 'teleport' },
        { name: 'No mode' }, // missing mode (not a string)
        { name: 'Numeric mode', mode: 123 },
      ],
    })
    expect(configs).toHaveLength(0)
    expect(report.warnings).toHaveLength(3)
    expect(report.warnings.every((w) => w.level === 'skipped')).toBe(true)
    expect(report.warnings[0].context).toBe('Bad mode')
    expect(report.warnings[0].message).toContain('Invalid proxy mode')
    expect(report.warnings[0].message).toContain('teleport')
    expect(report.warnings[1].context).toBe('No mode')
  })

  test('maps a valid entry: fresh uuid id, trimmed name, isActive false, picked color', () => {
    const { configs, report } = PacifyAdapter.map({
      proxyConfigs: [{ name: '  Office  ', mode: 'fixed_servers', color: '#112233' }],
    })
    expect(configs).toHaveLength(1)
    const c = configs[0]
    expect(c.name).toBe('Office')
    expect(c.mode).toBe('fixed_servers')
    expect(c.isActive).toBe(false)
    expect(c.color).toBe('#112233')
    // A fresh UUID is assigned (not the source id).
    expect(typeof c.id).toBe('string')
    expect(c.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(report.warnings).toHaveLength(0)
  })

  test('assigns a fresh id even when the source carries one', () => {
    const { configs } = PacifyAdapter.map({
      proxyConfigs: [{ id: 'original-id', name: 'X', mode: 'direct' }],
    })
    expect(configs[0].id).not.toBe('original-id')
    expect(configs[0].id).toMatch(/^[0-9a-f-]{36}$/)
  })

  test('generates a unique id per entry', () => {
    const { configs } = PacifyAdapter.map({
      proxyConfigs: [
        { name: 'A', mode: 'direct' },
        { name: 'B', mode: 'direct' },
      ],
    })
    expect(configs[0].id).not.toBe(configs[1].id)
  })

  test('picks a random color when the source color is missing or invalid', () => {
    const { configs } = PacifyAdapter.map({
      proxyConfigs: [
        { name: 'NoColor', mode: 'direct' },
        { name: 'BadColor', mode: 'direct', color: 'not-a-hex' },
      ],
    })
    expect(configs[0].color).toMatch(/^#[0-9a-fA-F]{6}$/)
    expect(configs[1].color).toMatch(/^#[0-9a-fA-F]{6}$/)
  })

  test('sums ruleCount from autoProxy.rules across entries', () => {
    const { report } = PacifyAdapter.map({
      proxyConfigs: [
        {
          name: 'Auto1',
          mode: 'pac_script',
          autoProxy: {
            rules: [
              {
                id: 'r1',
                pattern: 'a',
                matchType: 'wildcard',
                proxyType: 'direct',
                enabled: true,
                priority: 0,
              },
              {
                id: 'r2',
                pattern: 'b',
                matchType: 'wildcard',
                proxyType: 'direct',
                enabled: true,
                priority: 1,
              },
            ],
            fallbackType: 'direct',
          },
        },
        {
          name: 'Auto2',
          mode: 'pac_script',
          autoProxy: {
            rules: [
              {
                id: 'r3',
                pattern: 'c',
                matchType: 'wildcard',
                proxyType: 'direct',
                enabled: true,
                priority: 0,
              },
            ],
            fallbackType: 'direct',
          },
        },
        { name: 'NoRules', mode: 'direct' }, // contributes 0 (no autoProxy)
      ],
    })
    expect(report.ruleCount).toBe(3)
    expect(report.proxyCount).toBe(3)
  })

  test('treats a missing autoProxy / rules as zero rules', () => {
    const { report } = PacifyAdapter.map({
      proxyConfigs: [
        { name: 'A', mode: 'pac_script', autoProxy: { fallbackType: 'direct' } },
        { name: 'B', mode: 'direct' },
      ],
    })
    expect(report.ruleCount).toBe(0)
  })

  test('mixes valid and invalid entries in one payload and reports correctly', () => {
    const { configs, report } = PacifyAdapter.map({
      proxyConfigs: [
        { name: 'Good', mode: 'fixed_servers' },
        null,
        { name: '', mode: 'direct' }, // skipped: no name
        { name: 'BadMode', mode: '???' }, // skipped: invalid mode
        {
          name: 'GoodAuto',
          mode: 'pac_script',
          autoProxy: {
            rules: [
              {
                id: 'r1',
                pattern: 'x',
                matchType: 'wildcard',
                proxyType: 'direct',
                enabled: true,
                priority: 0,
              },
            ],
            fallbackType: 'direct',
          },
        },
      ],
    })
    expect(configs).toHaveLength(2)
    expect(configs.map((c) => c.name)).toEqual(['Good', 'GoodAuto'])
    expect(report.source).toBe('pacify')
    expect(report.proxyCount).toBe(2)
    expect(report.ruleCount).toBe(1)
    // Two skipped warnings (empty name + invalid mode); the null entry is silent.
    expect(report.warnings).toHaveLength(2)
    expect(report.warnings.every((w) => w.level === 'skipped')).toBe(true)
  })

  test('accepts every valid proxy mode', () => {
    const modes = ['direct', 'auto_detect', 'pac_script', 'fixed_servers', 'system']
    const { configs } = PacifyAdapter.map({
      proxyConfigs: modes.map((mode, i) => ({ name: `m${i}`, mode })),
    })
    expect(configs).toHaveLength(modes.length)
    expect(configs.map((c) => c.mode)).toEqual(modes as never[])
  })

  test('preserves extra source fields via spread (e.g. rules, badgeLabel)', () => {
    const { configs } = PacifyAdapter.map({
      proxyConfigs: [
        {
          name: 'WithRules',
          mode: 'fixed_servers',
          badgeLabel: 'WR',
          rules: { singleProxy: { scheme: 'http', host: 'h', port: '8080' } },
        },
      ],
    })
    expect(configs[0].badgeLabel).toBe('WR')
    expect(configs[0].rules?.singleProxy?.host).toBe('h')
  })
})

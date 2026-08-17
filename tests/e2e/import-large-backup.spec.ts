import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { type BrowserContext, expect, type Page, test } from '@playwright/test'
import { launchExtension, navigateToExtensionPage } from './helpers/extension-loader'

/**
 * E2E regression coverage for issue #75 — "Resource::kQuotaBytesPerItem quota
 * exceeded" when re-importing a SwitchyOmega `.bak`.
 *
 * A SwitchyOmega SwitchProfile maps 1:1 onto PACify's inline Auto-Proxy rules at
 * roughly 195 bytes each, so a real-world backup blows past two separate
 * chrome.storage.sync limits that only real Chrome enforces:
 *
 *  - QUOTA_BYTES_PER_ITEM (8,192) — ~40 rules. Handled by chunking the settings
 *    across `settings_<n>` keys.
 *  - QUOTA_BYTES (102,400 total) — ~500 rules. Handled by spilling the rule
 *    lists to local storage and reading them back on load.
 *
 * These run against the built extension because the quotas are enforced by
 * Chrome, not by anything we could assert against a mock.
 */

test.setTimeout(120_000)

let context: BrowserContext
let extensionId: string
const tmp = mkdtempSync(path.join(tmpdir(), 'pacify-import-'))

test.beforeAll(async () => {
  const launched = await launchExtension()
  context = launched.context
  extensionId = launched.extensionId
})

test.afterAll(async () => {
  await context?.close()
})

/** A SwitchyOmega backup with `ruleCount` switch rules pointing at one fixed proxy. */
function writeBackup(name: string, ruleCount: number): string {
  const file = path.join(tmp, `${name}.bak`)
  writeFileSync(
    file,
    JSON.stringify({
      schemaVersion: 2,
      '+proxy': {
        profileType: 'FixedProfile',
        name: 'proxy',
        color: '#99ccee',
        fallbackProxy: { scheme: 'http', host: '127.0.0.1', port: 7890 },
      },
      [`+${name}`]: {
        profileType: 'SwitchProfile',
        name,
        color: '#99dd99',
        defaultProfileName: 'direct',
        // Non-ASCII patterns on purpose: they cost more bytes than they have
        // characters, and must survive being cut across chunk boundaries.
        rules: Array.from({ length: ruleCount }, (_, i) => ({
          condition: { conditionType: 'HostWildcardCondition', pattern: `*.站点${i}.example` },
          profileName: 'proxy',
        })),
      },
    })
  )
  return file
}

/**
 * Drive the real Import flow to completion and wait for the commit to reach
 * storage. Imports merge into whatever is already there, so this waits for the
 * newly named profile rather than a config count, which starts out non-zero.
 */
async function importBackup(page: Page, file: string, profileName: string): Promise<void> {
  await page.locator('button[id="tab-settings"]').click()
  await page.getByTestId('import-btn').click()
  await page.getByTestId('import-file-input').setInputFiles(file)
  await page.getByTestId('import-confirm-btn').waitFor({ state: 'visible' })
  await page.getByTestId('import-confirm-btn').click()

  // Assert on storage rather than modal chrome: the import is "done" when the
  // imported config has actually been written.
  await expect
    .poll(async () => (await storedSyncSettings()).configNames, { timeout: 30_000 })
    .toContain(profileName)
}

interface StoredSync {
  meta: { chunks: number; rulesLocal?: boolean } | null
  configNames: string[]
  rulesByName: Record<string, number>
  totalBytes: number
  maxItemBytes: number
}

/** The settings as they are actually stored in sync (reassembled from chunks). */
function storedSyncSettings(): Promise<StoredSync> {
  const [background] = context.serviceWorkers()
  return background.evaluate(async () => {
    const sync = await chrome.storage.sync.get(null)
    const meta = (sync.settings_meta as { chunks: number; rulesLocal?: boolean }) ?? null
    let maxItemBytes = 0
    for (const key of Object.keys(sync)) {
      maxItemBytes = Math.max(maxItemBytes, await chrome.storage.sync.getBytesInUse(key))
    }
    const empty = {
      meta,
      configNames: [] as string[],
      rulesByName: {} as Record<string, number>,
      totalBytes: await chrome.storage.sync.getBytesInUse(null),
      maxItemBytes,
    }
    if (!meta) return empty
    const json =
      meta.chunks > 0
        ? Array.from({ length: meta.chunks }, (_, i) => sync[`settings_${i}`] as string).join('')
        : JSON.stringify(sync.settings)
    try {
      const configs = JSON.parse(json).proxyConfigs as {
        name: string
        autoProxy?: { rules?: unknown[] }
      }[]
      return {
        ...empty,
        configNames: configs.map((c) => c.name),
        rulesByName: Object.fromEntries(
          configs.filter((c) => c.autoProxy).map((c) => [c.name, c.autoProxy?.rules?.length ?? 0])
        ),
      }
    } catch {
      // A chunk may not have been written yet while polling.
      return empty
    }
  })
}

/** Activate a config from the popup and return the PAC script Chrome ends up with. */
async function activateAndReadPac(name: string): Promise<string> {
  const popup = await context.newPage()
  await popup.goto(`chrome-extension://${extensionId}/popup.html`, {
    waitUntil: 'domcontentloaded',
  })
  await popup.getByRole('radio', { name }).first().click()
  await popup.waitForTimeout(1000)
  await popup.close()

  const [background] = context.serviceWorkers()
  return background.evaluate(
    () =>
      new Promise<string>((resolve) => {
        chrome.proxy.settings.get({}, (cfg) => {
          resolve((cfg.value as { pacScript?: { data?: string } })?.pacScript?.data ?? '')
        })
      })
  )
}

test.describe('Importing a large SwitchyOmega backup (issue #75)', () => {
  test('120 rules: chunked across sync items, none over the per-item cap', async () => {
    const page = await navigateToExtensionPage(context, extensionId, 'options.html')
    await importBackup(page, writeBackup('chunked', 120), 'chunked')

    const stored = await storedSyncSettings()
    expect(stored.meta?.chunks).toBeGreaterThan(1)
    expect(stored.maxItemBytes).toBeLessThanOrEqual(8192) // QUOTA_BYTES_PER_ITEM
    expect(stored.meta?.rulesLocal).toBeUndefined() // still small enough to sync
    // Rules stay in sync storage at this size, so they reach other devices.
    expect(stored.rulesByName.chunked).toBe(120)

    // And they survive the round trip into a working PAC.
    const pac = await activateAndReadPac('chunked')
    expect(pac).toContain('站点0.example')
    expect(pac).toContain('站点119.example')
  })

  test('600 rules: spilled to local storage, still under the total sync quota', async () => {
    const page = await navigateToExtensionPage(context, extensionId, 'options.html')
    await importBackup(page, writeBackup('spilled', 600), 'spilled')

    const stored = await storedSyncSettings()
    expect(stored.meta?.rulesLocal).toBe(true)
    expect(stored.totalBytes).toBeLessThanOrEqual(102_400) // QUOTA_BYTES
    // The sync copy carries the configs without their rules...
    expect(stored.rulesByName.spilled).toBe(0)

    // ...and the read path puts them back, proven by the generated PAC.
    const pac = await activateAndReadPac('spilled')
    expect(pac).toContain('站点0.example')
    expect(pac).toContain('站点599.example')
  })
})

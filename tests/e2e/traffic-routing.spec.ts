import { type BrowserContext, expect, type Page, test } from '@playwright/test'
import { launchExtension } from './helpers/extension-loader'
import {
  PROXY_TEST_HOST,
  type ProxyFixtures,
  startProxyFixtures,
  startSocksProxy,
} from './helpers/proxy-fixtures'

/**
 * Real-traffic E2E: proves the whole chain works end to end —
 *   options UI → settingsStore → background → chrome.proxy → actual routing.
 *
 * Two local fakes stand in for the network (see proxy-fixtures.ts): an origin
 * server that answers `ORIGIN_OK` and a forward proxy that answers
 * `PROXIED:<url>`. Because the bodies differ, reading the page text after a
 * navigation tells us unambiguously whether traffic went DIRECT or via the
 * proxy. Chrome is launched with `--host-resolver-rules` so the non-loopback
 * test hostname resolves to the origin on DIRECT (Chrome implicitly bypasses
 * the proxy for real loopback addresses, which would defeat the test).
 */

let fx: ProxyFixtures
let context: BrowserContext
let extensionId: string

test.describe('Proxy traffic routing', () => {
  test.beforeAll(async () => {
    test.setTimeout(30000)
    fx = await startProxyFixtures()
    const launched = await launchExtension({
      extraArgs: [`--host-resolver-rules=${fx.hostResolverRule}`],
    })
    context = launched.context
    extensionId = launched.extensionId
  })

  test.afterAll(async () => {
    await context?.close()
    await fx?.stop()
  })

  /** Navigate to a URL in a throwaway tab and return the trimmed body text. */
  async function fetchBody(url: string): Promise<string> {
    const page = await context.newPage()
    try {
      await page.goto(url, { timeout: 8000 })
      return (await page.locator('body').textContent())?.trim() ?? ''
    } finally {
      await page.close()
    }
  }

  function optionsPage(): Promise<Page> {
    const page = context.pages()[0] ?? context.newPage()
    return Promise.resolve(page).then(async (p) => {
      await p.goto(`chrome-extension://${extensionId}/options.html`)
      await p.waitForLoadState('networkidle')
      return p
    })
  }

  /**
   * Pick a proxy (or "No proxy (direct)") in the popup's single-select list —
   * this is how activation/deactivation works. Pass a name to activate that
   * proxy, or `{ direct: true }` to turn the active one off.
   */
  async function popupSelect(opts: { name?: string; direct?: boolean }): Promise<void> {
    const popup = await context.newPage()
    // Avoid 'networkidle' — once a proxy is active, Chrome's background
    // connection attempts can keep the network from ever going idle.
    await popup.goto(`chrome-extension://${extensionId}/popup.html`, {
      waitUntil: 'domcontentloaded',
    })
    if (opts.direct) {
      await popup.getByTestId('popup-direct-row').click()
    } else {
      await popup
        .getByRole('radio', { name: opts.name as string })
        .first()
        .click()
    }
    await popup.waitForTimeout(700)
    await popup.close()
  }

  test('DIRECT by default (no active proxy)', async () => {
    fx.reset()
    expect(await fetchBody(fx.originHostUrl)).toBe('ORIGIN_OK')
    expect(fx.requests).toHaveLength(0)
  })

  test('a manual proxy routes traffic through the proxy, then DIRECT when off', async () => {
    const page = await optionsPage()

    // Create a manual (fixed_servers) proxy pointing at the fixture proxy.
    await page.getByTestId('add-new-script-btn').click()
    await expect(page.getByTestId('modal-title')).toBeVisible()
    await page.fill('input#scriptName', 'Fixture Proxy')
    await page.getByTestId('segment-fixed_servers').click()
    await page.getByTestId('single-proxy-host-input').fill('127.0.0.1')
    await page.getByTestId('single-proxy-port-input').fill(String(fx.proxyPort))
    await page.getByTestId('modal-save-btn').click()
    await expect(page.getByTestId('modal-title')).not.toBeVisible()

    // Activate it from the popup and confirm Chrome received the config.
    await popupSelect({ name: 'Fixture Proxy' })
    const background = context.serviceWorkers()[0]
    const chromeProxy = await background.evaluate(() => chrome.proxy.settings.get({}))
    // biome-ignore lint/suspicious/noExplicitAny: chrome typings not loaded in eval
    expect((chromeProxy as any)?.value?.mode).toBe('fixed_servers')

    // Traffic must now flow through the proxy.
    fx.reset()
    expect(await fetchBody(fx.originHostUrl)).toContain('PROXIED')
    expect(fx.requests.some((r) => r.target.includes(PROXY_TEST_HOST))).toBe(true)

    // Toggle off → back to DIRECT.
    await popupSelect({ direct: true })
    fx.reset()
    expect(await fetchBody(fx.originHostUrl)).toBe('ORIGIN_OK')
    expect(fx.requests).toHaveLength(0)
  })

  test('bypass list keeps a matching host on a DIRECT connection', async () => {
    const page = await optionsPage()

    await page.getByTestId('add-new-script-btn').click()
    await expect(page.getByTestId('modal-title')).toBeVisible()
    await page.fill('input#scriptName', 'Bypass Proxy')
    await page.getByTestId('segment-fixed_servers').click()
    await page.getByTestId('single-proxy-host-input').fill('127.0.0.1')
    await page.getByTestId('single-proxy-port-input').fill(String(fx.proxyPort))
    await page.locator('#bypassList').fill(PROXY_TEST_HOST)
    await page.getByTestId('modal-save-btn').click()
    await expect(page.getByTestId('modal-title')).not.toBeVisible()

    await popupSelect({ name: 'Bypass Proxy' })

    // Even with the proxy active, the bypassed host must reach the origin
    // directly (regression guard for bypassList being dropped for single proxies).
    fx.reset()
    expect(await fetchBody(fx.originHostUrl)).toBe('ORIGIN_OK')
    expect(fx.requests.some((r) => r.target.includes(PROXY_TEST_HOST))).toBe(false)

    await popupSelect({ direct: true }) // leave the browser back on DIRECT for any later tests
  })

  test('a per-protocol HTTP proxy routes http traffic through it', async () => {
    const page = await optionsPage()

    // "Use the same proxy for all protocols" off → set only the HTTP proxy.
    await page.getByTestId('add-new-script-btn').click()
    await expect(page.getByTestId('modal-title')).toBeVisible()
    await page.fill('input#scriptName', 'Per Protocol')
    await page.getByTestId('segment-fixed_servers').click()
    await page.locator('#useSharedProxy').uncheck()
    await page.getByTestId('http-host-input').fill('127.0.0.1')
    await page.getByTestId('http-port-input').fill(String(fx.proxyPort))
    await page.getByTestId('modal-save-btn').click()
    await expect(page.getByTestId('modal-title')).not.toBeVisible()

    await popupSelect({ name: 'Per Protocol' })
    const background = context.serviceWorkers()[0]
    const chromeProxy = await background.evaluate(() => chrome.proxy.settings.get({}))
    // biome-ignore lint/suspicious/noExplicitAny: chrome typings not loaded in eval
    const rules = (chromeProxy as any)?.value?.rules
    expect(rules?.proxyForHttp).toBeDefined()
    expect(rules?.singleProxy).toBeUndefined()

    fx.reset()
    expect(await fetchBody(fx.originHostUrl)).toContain('PROXIED')
    expect(fx.requests.some((r) => r.target.includes(PROXY_TEST_HOST))).toBe(true)

    await popupSelect({ direct: true })
  })

  test('a SOCKS5 proxy tunnels traffic through the SOCKS server', async () => {
    // SOCKS is a transparent tunnel — the body stays ORIGIN_OK, so routing is
    // proven by the SOCKS server logging the CONNECT.
    const socks = await startSocksProxy()
    try {
      const page = await optionsPage()
      await page.getByTestId('add-new-script-btn').click()
      await expect(page.getByTestId('modal-title')).toBeVisible()
      await page.fill('input#scriptName', 'Socks Proxy')
      await page.getByTestId('segment-fixed_servers').click()
      await page.selectOption('#single-proxy-scheme', 'socks5')
      await page.getByTestId('single-proxy-host-input').fill('127.0.0.1')
      await page.getByTestId('single-proxy-port-input').fill(String(socks.port))
      await page.getByTestId('modal-save-btn').click()
      await expect(page.getByTestId('modal-title')).not.toBeVisible()

      await popupSelect({ name: 'Socks Proxy' })
      const background = context.serviceWorkers()[0]
      const chromeProxy = await background.evaluate(() => chrome.proxy.settings.get({}))
      // biome-ignore lint/suspicious/noExplicitAny: chrome typings not loaded in eval
      expect((chromeProxy as any)?.value?.rules?.singleProxy?.scheme).toBe('socks5')

      socks.reset()
      expect(await fetchBody(fx.originHostUrl)).toBe('ORIGIN_OK')
      expect(
        socks.connections.some((c) => c.host === PROXY_TEST_HOST && c.port === fx.originPort)
      ).toBe(true)

      // No toggle-off cleanup here: this is the last test in the describe and
      // afterAll closes the context. (Opening another popup to deactivate while
      // SOCKS is still routing the browser's background traffic is flaky.)
    } finally {
      await socks.stop()
    }
  })
})

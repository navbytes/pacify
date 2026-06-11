import { type BrowserContext, expect, type Page, test } from '@playwright/test'
import { launchExtension } from './helpers/extension-loader'
import {
  type ForwardProxy,
  HOST_RESOLVER_RULE,
  type OriginServer,
  PROXY_TEST_HOST,
  PROXY_TEST_HOST_ALT,
  startForwardProxy,
  startOriginServer,
  startPacServer,
} from './helpers/proxy-fixtures'

/**
 * Real-traffic E2E for the PAC-based routing modes:
 *   - PAC Script from a URL (exercises the background PAC fetch + apply), and
 *   - Auto-Proxy rules (exercises PACScriptGenerator's generated PAC).
 *
 * Each proves the whole chain in real Chrome: options UI → settingsStore →
 * background → chrome.proxy → actual routing. See proxy-fixtures.ts for how the
 * origin/proxy fakes make routing assertions unambiguous.
 */

let origin: OriginServer
let proxy: ForwardProxy
let context: BrowserContext
let extensionId: string

function originUrl(host: string): string {
  return `http://${host}:${origin.port}/`
}

async function fetchBody(url: string): Promise<string> {
  const page = await context.newPage()
  try {
    await page.goto(url, { timeout: 8000 })
    return (await page.locator('body').textContent())?.trim() ?? ''
  } finally {
    await page.close()
  }
}

async function optionsPage(): Promise<Page> {
  const page = context.pages()[0] ?? (await context.newPage())
  await page.goto(`chrome-extension://${extensionId}/options.html`)
  await page.waitForLoadState('networkidle')
  return page
}

// Pick a proxy (or "No proxy (direct)") in the popup's single-select list.
async function popupSelect(opts: { name?: string; direct?: boolean }): Promise<void> {
  const popup = await context.newPage()
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

test.describe('PAC-based routing modes', () => {
  test.beforeAll(async () => {
    test.setTimeout(30000)
    ;[origin, proxy] = await Promise.all([startOriginServer(), startForwardProxy({ label: 'P' })])
    const launched = await launchExtension({
      extraArgs: [`--host-resolver-rules=${HOST_RESOLVER_RULE}`],
    })
    context = launched.context
    extensionId = launched.extensionId
  })

  test.afterAll(async () => {
    await context?.close()
    await Promise.all([origin?.stop(), proxy?.stop()])
  })

  test('PAC Script from a URL routes per the fetched script', async () => {
    // PAC sends the primary host through the proxy, everything else DIRECT.
    const pac = await startPacServer(
      'function FindProxyForURL(url, host) {\n' +
        `  if (host === "${PROXY_TEST_HOST}") return "PROXY 127.0.0.1:${proxy.port}";\n` +
        `  return "DIRECT";\n}`
    )
    try {
      const page = await optionsPage()
      await page.getByTestId('add-new-script-btn').click()
      await expect(page.getByTestId('modal-title')).toBeVisible()
      await page.fill('input#scriptName', 'PAC URL')
      await page.getByRole('radio', { name: 'PAC Script' }).click()
      await page.getByTestId('pac-url-input').fill(pac.url)
      await page.getByTestId('modal-save-btn').click()
      await expect(page.getByTestId('modal-title')).not.toBeVisible()

      await popupSelect({ name: 'PAC URL' })
      expect(pac.hits).toBeGreaterThan(0) // the extension fetched the PAC

      // Matching host → proxied; non-matching host → DIRECT.
      proxy.reset()
      expect(await fetchBody(originUrl(PROXY_TEST_HOST))).toContain('PROXIED')
      expect(await fetchBody(originUrl(PROXY_TEST_HOST_ALT))).toBe('ORIGIN_OK')
      expect(proxy.requests.some((r) => r.target.includes(PROXY_TEST_HOST_ALT))).toBe(false)

      await popupSelect({ direct: true }) // toggle back to DIRECT
    } finally {
      await pac.stop()
    }
  })

  test('inline PAC script (CodeMirror) routes per its FindProxyForURL', async () => {
    const page = await optionsPage()

    await page.getByTestId('add-new-script-btn').click()
    await expect(page.getByTestId('modal-title')).toBeVisible()
    await page.fill('input#scriptName', 'PAC Inline')
    await page.getByRole('radio', { name: 'PAC Script' }).click()

    // Replace the editor contents (CodeMirror 6 contenteditable) with our PAC.
    const pac =
      'function FindProxyForURL(url, host) {' +
      ` if (host === "${PROXY_TEST_HOST}") return "PROXY 127.0.0.1:${proxy.port}";` +
      ' return "DIRECT"; }'
    await page.locator('.cm-content').click()
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.press('Delete')
    await page.keyboard.insertText(pac)
    await page.getByTestId('modal-save-btn').click()
    await expect(page.getByTestId('modal-title')).not.toBeVisible()

    await popupSelect({ name: 'PAC Inline' })
    proxy.reset()
    expect(await fetchBody(originUrl(PROXY_TEST_HOST))).toContain('PROXIED:P')
    expect(await fetchBody(originUrl(PROXY_TEST_HOST_ALT))).toBe('ORIGIN_OK')
    expect(proxy.requests.some((r) => r.target.includes(PROXY_TEST_HOST_ALT))).toBe(false)

    await popupSelect({ direct: true })
  })

  test('Auto-Proxy routes matching hosts via the rule, others via fallback', async () => {
    const page = await optionsPage()

    // Create an Auto-Proxy whose single rule sends the primary host to an inline
    // proxy; the fallback (default) is DIRECT.
    await page.getByTestId('add-auto-proxy-btn').click()
    await page.locator('#name').fill('Auto Routes')
    const addEmpty = page.getByTestId('add-rule-empty-btn')
    if (await addEmpty.count()) {
      await addEmpty.click()
    } else {
      await page.getByTestId('add-rule-btn').click()
    }
    // Default match type (wildcard) with the literal hostname matches only that
    // host; the fallback assertion below confirms it doesn't over-match.
    await page.getByTestId('rule-pattern-input').fill(PROXY_TEST_HOST)
    await page.getByRole('radio', { name: 'Define Inline' }).click()
    await page.locator('#inline-host').fill('127.0.0.1')
    await page.locator('#inline-port').fill(String(proxy.port))
    await page.getByTestId('rule-save-btn').click()
    await page.getByTestId('auto-proxy-save-btn').click()
    await expect(page.locator('text=Auto Routes').first()).toBeVisible()

    await popupSelect({ name: 'Auto Routes' })
    const background = context.serviceWorkers()[0]
    const chromeProxy = await background.evaluate(() => chrome.proxy.settings.get({}))
    // biome-ignore lint/suspicious/noExplicitAny: chrome typings not loaded in eval
    expect((chromeProxy as any)?.value?.mode).toBe('pac_script')

    // Rule match → inline proxy; everything else → fallback DIRECT.
    proxy.reset()
    expect(await fetchBody(originUrl(PROXY_TEST_HOST))).toContain('PROXIED:P')
    expect(await fetchBody(originUrl(PROXY_TEST_HOST_ALT))).toBe('ORIGIN_OK')
    expect(proxy.requests.some((r) => r.target.includes(PROXY_TEST_HOST_ALT))).toBe(false)

    await popupSelect({ direct: true })
  })
})

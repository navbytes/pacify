import { existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { type BrowserContext, chromium } from '@playwright/test'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Resolve the Chrome binary to test against.
 * Priority: CHROME_PATH env var > Chrome for Testing cache > Playwright's bundled chromium.
 */
function resolveChromePath(): string | undefined {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH
  }
  const cftPath = path.join(os.homedir(), '.cache/chrome-for-testing/chrome-linux64/chrome')
  if (existsSync(cftPath)) {
    return cftPath
  }
  return undefined // fall back to Playwright's bundled chromium
}

/**
 * Launch Chrome with the extension loaded
 * Based on: https://playwright.dev/docs/chrome-extensions
 *
 * Runs headless by default — Chrome's modern headless mode supports MV3
 * extensions. Set HEADED=1 to debug with a visible browser window.
 */
export async function launchExtension(options: { suppressOnboarding?: boolean } = {}) {
  const { suppressOnboarding = true } = options
  const extensionPath = path.join(__dirname, '../../../dist')

  // Launch browser with extension
  const context = await chromium.launchPersistentContext('', {
    headless: process.env.HEADED !== '1',
    executablePath: resolveChromePath(),
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  })

  // Get extension ID
  let [background] = context.serviceWorkers()
  if (!background) {
    background = await context.waitForEvent('serviceworker')
  }

  const extensionId = background.url().split('/')[2]

  // First run sets `pacify.showOnboarding`, which opens a modal that blocks
  // the options page. The background's onInstalled handler writes the flag
  // asynchronously, so wait for it to appear before clearing it.
  if (suppressOnboarding) {
    await background.evaluate(async () => {
      for (let i = 0; i < 30; i++) {
        const v = await chrome.storage.local.get('pacify.showOnboarding')
        if ('pacify.showOnboarding' in v) break
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
      await chrome.storage.local.set({ 'pacify.showOnboarding': false })
    })
  }

  return { context, extensionId }
}

/**
 * Navigate to extension page
 */
export async function navigateToExtensionPage(
  context: BrowserContext,
  extensionId: string,
  page: string
) {
  const extensionPage = context.pages()[0]
  await extensionPage.goto(`chrome-extension://${extensionId}/${page}`)
  return extensionPage
}

/**
 * Get extension URLs
 */
export function getExtensionUrls(extensionId: string) {
  return {
    options: `chrome-extension://${extensionId}/options.html`,
    popup: `chrome-extension://${extensionId}/popup.html`,
  }
}

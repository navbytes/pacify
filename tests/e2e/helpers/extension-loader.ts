import { chromium, type BrowserContext } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Launch Chrome with the extension loaded
 * Based on: https://playwright.dev/docs/chrome-extensions
 */
export async function launchExtension() {
  const extensionPath = path.join(__dirname, '../../../dist')

  // Launch browser with extension
  const context = await chromium.launchPersistentContext('', {
    headless: false, // Extensions require headed mode
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
    options: `chrome-extension://${extensionId}/src/options/options.html`,
    popup: `chrome-extension://${extensionId}/src/popup/popup.html`,
  }
}

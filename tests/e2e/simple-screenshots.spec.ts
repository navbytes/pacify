import { test, type BrowserContext } from '@playwright/test'
import { launchExtension, navigateToExtensionPage } from './helpers/extension-loader'

/**
 * Simple screenshot generator for Chrome Web Store
 * Takes 5 basic screenshots at 1280x800 resolution
 */

const WIDTH = 1280
const HEIGHT = 800

test.describe('Simple Chrome Store Screenshots', () => {
  let context: BrowserContext
  let extensionId: string

  test.beforeAll(async () => {
    const result = await launchExtension()
    context = result.context
    extensionId = result.extensionId
    console.log(`Extension loaded: ${extensionId}`)
  })

  test.afterAll(async () => {
    await context.close()
  })

  test('Take all screenshots', async () => {
    // 1. Popup Screenshot
    console.log('Taking popup screenshot...')
    const popupPage = await navigateToExtensionPage(context, extensionId, 'src/popup/popup.html')
    await popupPage.setViewportSize({ width: WIDTH, height: HEIGHT })
    await popupPage.waitForTimeout(2000)
    await popupPage.screenshot({ path: 'screenshots/1-popup.png' })

    // 2. Options Page Screenshot
    console.log('Taking options page screenshot...')
    const optionsPage = await navigateToExtensionPage(
      context,
      extensionId,
      'src/options/options.html'
    )
    await optionsPage.setViewportSize({ width: WIDTH, height: HEIGHT })
    await optionsPage.waitForTimeout(2000)
    await optionsPage.screenshot({ path: 'screenshots/2-options.png' })

    // 3. Settings Tab Screenshot
    console.log('Taking settings tab screenshot...')
    const settingsButton = await optionsPage.$('button:has-text("Settings")')
    if (settingsButton) {
      await settingsButton.click()
      await optionsPage.waitForTimeout(1000)
    }
    await optionsPage.screenshot({ path: 'screenshots/3-settings.png' })

    // 4. Add Proxy Modal Screenshot
    console.log('Taking add proxy modal screenshot...')
    // Go back to proxy configs tab
    const proxyTabButton = await optionsPage.$('button:has-text("Proxy Configs")')
    if (proxyTabButton) {
      await proxyTabButton.click()
      await optionsPage.waitForTimeout(1000)
    }

    const addButton = await optionsPage.getByTestId('add-new-script-btn')
    if (addButton) {
      await addButton.click()
      await optionsPage.waitForTimeout(1000)
    }
    await optionsPage.screenshot({ path: 'screenshots/4-add-proxy.png' })

    // 5. About Tab Screenshot
    console.log('Taking about tab screenshot...')
    // Close modal if open
    await optionsPage.getByTestId('cancel-config-btn').click()

    const aboutButton = await optionsPage.$('button:has-text("About")')
    if (aboutButton) {
      await aboutButton.click()
      await optionsPage.waitForTimeout(1000)
    }
    await optionsPage.screenshot({ path: 'screenshots/5-about.png' })

    console.log('✅ All screenshots saved to screenshots/ directory')
  })
})

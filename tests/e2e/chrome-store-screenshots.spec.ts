import { expect, test, type BrowserContext } from '@playwright/test'
import {
  launchExtension,
  navigateToExtensionPage,
  getExtensionUrls,
} from './helpers/extension-loader'

/**
 * Chrome Web Store Screenshot Generator
 *
 * Generates 5 screenshots for Chrome Web Store submission:
 * 1. Main popup interface
 * 2. Options/Settings page
 * 3. PAC Script Editor
 * 4. Multiple proxy configurations
 * 5. Quick Switch feature
 *
 * Requirements: 1280x800 pixels (Chrome Web Store standard)
 */

// Chrome Web Store requires 1280x800 or 640x400 screenshots
const SCREENSHOT_WIDTH = 1280
const SCREENSHOT_HEIGHT = 800

test.setTimeout(120000) // 2 minutes timeout for all tests

let sharedContext: BrowserContext | null = null
let sharedExtensionId: string | null = null

test.beforeAll('Launch extension for screenshots', async () => {
  test.setTimeout(30000)
  const { context, extensionId } = await launchExtension()
  sharedContext = context
  sharedExtensionId = extensionId
  console.log(`✓ Extension loaded with ID: ${extensionId}`)
})

test.afterAll(async () => {
  if (sharedContext) {
    await sharedContext.close()
  }
  console.log('\n📸 Screenshots saved to screenshots/ directory')
  console.log('✅ All screenshots are 1280x800 pixels as required by Chrome Web Store')
})

test.describe('Chrome Web Store Screenshots', () => {
  test('Screenshot 1: Main Popup Interface', async () => {
    if (!sharedContext || !sharedExtensionId) {
      throw new Error('Extension not loaded')
    }

    // Open popup
    const popupPage = await navigateToExtensionPage(
      sharedContext,
      sharedExtensionId,
      'src/popup/popup.html'
    )

    // Set popup dimensions
    await popupPage.setViewportSize({
      width: 400,
      height: 600,
    })

    // Wait for popup to load - look for the header
    await popupPage.waitForSelector('h1', {
      timeout: 10000,
      state: 'visible',
    })

    // Create a new page for the styled screenshot
    const screenshotPage = await sharedContext.newPage()
    await screenshotPage.setViewportSize({
      width: SCREENSHOT_WIDTH,
      height: SCREENSHOT_HEIGHT,
    })

    // Create styled wrapper
    const urls = getExtensionUrls(sharedExtensionId)
    await screenshotPage.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: ${SCREENSHOT_HEIGHT}px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .container { text-align: center; }
            .browser-frame {
              background: white;
              border-radius: 12px;
              box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
              overflow: hidden;
              width: 400px;
              height: 600px;
            }
            .title {
              color: white;
              font-size: 36px;
              font-weight: 700;
              margin-bottom: 30px;
              text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .subtitle {
              color: rgba(255,255,255,0.95);
              font-size: 20px;
              margin-top: 24px;
              font-weight: 500;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="title">Pacify Proxy Manager</h1>
            <div class="browser-frame">
              <iframe src="${urls.popup}" style="width: 100%; height: 100%; border: none;"></iframe>
            </div>
            <p class="subtitle">Quick and Easy Proxy Switching</p>
          </div>
        </body>
      </html>
    `)

    await screenshotPage.waitForTimeout(2000) // Wait for iframe to load
    await screenshotPage.screenshot({
      path: 'screenshots/1-main-popup.png',
    })
    await screenshotPage.close()
  })

  test('Screenshot 2: Options Page with Settings', async () => {
    if (!sharedContext || !sharedExtensionId) {
      throw new Error('Extension not loaded')
    }

    const optionsPage = await navigateToExtensionPage(
      sharedContext,
      sharedExtensionId,
      'src/options/options.html'
    )

    await optionsPage.setViewportSize({
      width: SCREENSHOT_WIDTH,
      height: SCREENSHOT_HEIGHT,
    })

    // Wait for options to load
    await optionsPage.waitForSelector('#options-container', { timeout: 10000 })

    // Navigate to Settings tab
    const settingsTab = await optionsPage.$('button:has-text("Settings")')
    if (settingsTab) {
      await settingsTab.click()
      await optionsPage.waitForTimeout(500)
    }

    await optionsPage.screenshot({
      path: 'screenshots/2-settings-page.png',
    })
  })

  test('Screenshot 3: PAC Script Editor', async () => {
    if (!sharedContext || !sharedExtensionId) {
      throw new Error('Extension not loaded')
    }

    const optionsPage = await navigateToExtensionPage(
      sharedContext,
      sharedExtensionId,
      'src/options/options.html'
    )

    await optionsPage.setViewportSize({
      width: SCREENSHOT_WIDTH,
      height: SCREENSHOT_HEIGHT,
    })

    // Wait for options to load
    await optionsPage.waitForSelector('#options-container', { timeout: 10000 })

    // Open Add Proxy modal
    const addButton = await optionsPage.getByTestId('add-new-script-btn')
    if (addButton) {
      await addButton.click()
      await expect(optionsPage.getByTestId('proxy-config-modal')).toBeVisible()
    }

    // Select PAC script mode by clicking the button (not a select dropdown)
    const pacScriptButton = await optionsPage.$('button[role="tab"]:has-text("PAC Script")')
    if (pacScriptButton) {
      await pacScriptButton.click()
      await optionsPage.waitForTimeout(500)
    } else {
      // Fallback: try different text variations
      const altButton = await optionsPage.$('button[role="tab"][aria-selected="false"]')
      if (altButton) {
        const buttonText = await altButton.textContent()
        if (buttonText?.toLowerCase().includes('pac')) {
          await altButton.click()
          await optionsPage.waitForTimeout(500)
        }
      }
    }

    // The editor container should appear automatically when PAC mode is selected
    // and pacUrl is empty (which it is by default)

    // Wait for editor - increased timeout for Monaco initialization
    console.log('Waiting for Monaco editor container to appear after URL cleared...')
    await optionsPage.waitForSelector('#editorContainer', { timeout: 10000 })
    console.log('Editor container found, waiting for Monaco to fully render...')
    await optionsPage.waitForTimeout(2000) // Let Monaco fully render
    console.log('Monaco editor should be fully initialized')

    // Select a template
    const advancedButton = await optionsPage.$('button:has-text("Advanced")')
    if (advancedButton) {
      await advancedButton.click()
      await optionsPage.waitForTimeout(1000)
    }

    await optionsPage.screenshot({
      path: 'screenshots/3-pac-editor.png',
    })
  })

  test('Screenshot 4: Multiple Proxy Configurations', async () => {
    if (!sharedContext || !sharedExtensionId) {
      throw new Error('Extension not loaded')
    }

    const optionsPage = await navigateToExtensionPage(
      sharedContext,
      sharedExtensionId,
      'src/options/options.html'
    )

    await optionsPage.setViewportSize({
      width: SCREENSHOT_WIDTH,
      height: SCREENSHOT_HEIGHT,
    })

    // Wait for options to load
    await optionsPage.waitForSelector('#options-container', { timeout: 10000 })

    // Add sample proxy configurations
    const configs = [
      { name: 'Work Proxy', color: '#3B82F6' },
      { name: 'Home VPN', color: '#10B981' },
      { name: 'Development', color: '#F59E0B' },
    ]

    for (const config of configs) {
      // Check if proxy already exists
      const existing = await optionsPage.$(`text="${config.name}"`)
      if (existing) {
        console.log(`Proxy "${config.name}" already exists, skipping...`)
        continue
      }

      // Add new proxy
      console.log(`Adding proxy: ${config.name}`)
      const addButton = await optionsPage.getByTestId('add-new-script-btn')
      await addButton.click()
      console.log('Waiting for proxy config modal...')
      await expect(optionsPage.getByTestId('proxy-config-modal')).toBeVisible()
      console.log('Modal opened')

      // Fill in details
      await optionsPage.fill('input#scriptName', config.name)

      // Select PAC script mode by clicking the button (not a select dropdown)
      const pacScriptButton = await optionsPage.$('button[role="tab"]:has-text("PAC Script")')
      if (pacScriptButton) {
        await pacScriptButton.click()
        await optionsPage.waitForTimeout(500)
      } else {
        // Fallback: try different text variations
        const altButton = await optionsPage.$('button[role="tab"][aria-selected="false"]')
        if (altButton) {
          const buttonText = await altButton.textContent()
          if (buttonText?.toLowerCase().includes('pac')) {
            await altButton.click()
            await optionsPage.waitForTimeout(500)
          }
        }
      }

      await optionsPage.fill(
        'input#pacUrl',
        `https://example.com/${config.name.toLowerCase().replace(' ', '-')}.pac`
      )

      // Set color
      const colorInput = await optionsPage.$('input[type="color"]')
      if (colorInput) {
        await colorInput.evaluate((el, color) => {
          ;(el as HTMLInputElement).value = color
        }, config.color)
      }

      // Save
      await optionsPage.getByTestId('save-config-btn').click()
      await optionsPage.waitForTimeout(1000)
    }

    // Activate one proxy
    const firstProxy = await optionsPage.$('[data-testid="script-item"]:first-child')
    if (firstProxy) {
      const activateBtn = await firstProxy.$('button:has-text("Activate")')
      if (activateBtn) {
        await activateBtn.click()
        await optionsPage.waitForTimeout(500)
      }
    }

    await optionsPage.screenshot({
      path: 'screenshots/4-multiple-proxies.png',
    })
  })

  test('Screenshot 5: Quick Switch Feature', async () => {
    if (!sharedContext || !sharedExtensionId) {
      throw new Error('Extension not loaded')
    }

    // First enable quick switch in settings
    const settingsPage = await navigateToExtensionPage(
      sharedContext,
      sharedExtensionId,
      'src/options/options.html'
    )

    await settingsPage.setViewportSize({
      width: SCREENSHOT_WIDTH,
      height: SCREENSHOT_HEIGHT,
    })

    // Go to Settings tab
    await settingsPage.click('button:has-text("Settings")')
    await settingsPage.waitForTimeout(500)

    // Enable quick switch
    const quickSwitch = await settingsPage.$('input#quickSwitch')
    if (quickSwitch) {
      await quickSwitch.check()
      await settingsPage.waitForTimeout(500)
    }

    // Take screenshot showing Quick Switch enabled
    await settingsPage.screenshot({
      path: 'screenshots/5-quick-switch.png',
    })
  })
})

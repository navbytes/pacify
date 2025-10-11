import { test } from '@playwright/test'
import { launchExtension, navigateToExtensionPage } from './helpers/extension-loader'

/**
 * This test file helps inspect the actual UI to find correct selectors
 * Run with: npx playwright test tests/e2e/inspect-selectors.spec.ts --headed --debug
 */

test.setTimeout(300000) // 5 minutes to inspect

test('Inspect Options Page UI', async () => {
  const { context, extensionId } = await launchExtension()

  const page = await navigateToExtensionPage(context, extensionId, 'src/options/options.html')
  await page.waitForLoadState('networkidle')

  console.log('\n=== OPTIONS PAGE LOADED ===\n')

  // Create a test proxy to inspect UI elements
  await page.click('button:has-text("Add New Script")')
  await page.waitForSelector('text=Proxy Configuration')
  await page.fill('input#scriptName', 'Test Proxy')
  await page.click('button:has-text("Save Configuration")')
  await page.waitForTimeout(1000)

  console.log('✅ Test proxy created\n')

  // Take snapshot to help identify elements
  // const snapshot = await page.content()
  console.log('Page snapshot taken')

  // Find all buttons and their attributes
  const buttons = await page.locator('button').all()
  console.log(`\n=== FOUND ${buttons.length} BUTTONS ===`)

  for (let i = 0; i < Math.min(buttons.length, 20); i++) {
    const btn = buttons[i]
    const text = await btn.textContent().catch(() => '')
    const ariaLabel = await btn.getAttribute('aria-label').catch(() => null)
    const className = await btn.getAttribute('class').catch(() => null)

    console.log(`\nButton ${i + 1}:`)
    console.log(`  Text: ${text?.trim()}`)
    console.log(`  Aria-label: ${ariaLabel}`)
    console.log(`  Classes: ${className}`)
  }

  // Find toggle switches
  const toggles = await page.locator('input[type="checkbox"], button[role="switch"]').all()
  console.log(`\n=== FOUND ${toggles.length} TOGGLES/CHECKBOXES ===`)

  for (let i = 0; i < Math.min(toggles.length, 10); i++) {
    const toggle = toggles[i]
    const ariaLabel = await toggle.getAttribute('aria-label').catch(() => null)
    const className = await toggle.getAttribute('class').catch(() => null)
    const type = await toggle.getAttribute('type').catch(() => null)

    console.log(`\nToggle ${i + 1}:`)
    console.log(`  Type: ${type}`)
    console.log(`  Aria-label: ${ariaLabel}`)
    console.log(`  Classes: ${className}`)
  }

  // Look for proxy list items
  const listItems = await page.locator('[data-testid], [class*="proxy"], [class*="script"]').all()
  console.log(`\n=== FOUND ${listItems.length} LIST ITEMS ===`)

  // Keep browser open for manual inspection
  console.log('\n=== PAUSED FOR INSPECTION ===')
  console.log('The browser will stay open. Press any key in the terminal to continue...')

  await page.pause() // This opens Playwright Inspector

  await context.close()
})

test('Inspect Popup Page UI', async () => {
  const { context, extensionId } = await launchExtension()

  const page = await navigateToExtensionPage(context, extensionId, 'src/popup/popup.html')
  await page.waitForLoadState('networkidle')

  console.log('\n=== POPUP PAGE LOADED ===\n')

  // Take snapshot
  // const snapshot = await page.content()
  console.log('Page snapshot taken')

  // Find all interactive elements
  const buttons = await page.locator('button, a[role="button"]').all()
  console.log(`\n=== FOUND ${buttons.length} BUTTONS ===`)

  for (let i = 0; i < buttons.length; i++) {
    const btn = buttons[i]
    const text = await btn.textContent().catch(() => '')
    const ariaLabel = await btn.getAttribute('aria-label').catch(() => null)

    console.log(`\nButton ${i + 1}:`)
    console.log(`  Text: ${text?.trim()}`)
    console.log(`  Aria-label: ${ariaLabel}`)
  }

  console.log('\n=== PAUSED FOR INSPECTION ===')
  await page.pause()

  await context.close()
})

import { test, expect } from '@playwright/test'
import { launchExtension, navigateToExtensionPage } from './helpers/extension-loader'

/**
 * Basic E2E tests for PACify Chrome Extension
 *
 * These tests load the actual built extension and test it in Chrome
 * NOTE: These tests require headed mode and are skipped by default
 */

test.describe.skip('PACify Extension - Basic', () => {
  test('should load extension and open options page', async () => {
    // Build must be run first: npm run build
    const { context, extensionId } = await launchExtension()

    try {
      console.log(`Extension ID: ${extensionId}`)

      // Navigate to options page
      const page = await navigateToExtensionPage(context, extensionId, 'src/options/options.html')

      // Wait for page to load
      await page.waitForLoadState('networkidle')

      // Verify page loaded
      await expect(page).toHaveTitle(/PACify/i)

      // Check for main heading or content
      const content = await page.textContent('body')
      expect(content).toBeTruthy()

      console.log('✅ Extension loaded successfully')
    } finally {
      await context.close()
    }
  })

  test('should load extension and open popup', async () => {
    const { context, extensionId } = await launchExtension()

    try {
      // Navigate to popup page
      const page = await navigateToExtensionPage(context, extensionId, 'src/popup/popup.html')

      // Wait for page to load
      await page.waitForLoadState('networkidle')

      // Verify popup content
      const content = await page.textContent('body')
      expect(content).toBeTruthy()

      console.log('✅ Popup loaded successfully')
    } finally {
      await context.close()
    }
  })
})

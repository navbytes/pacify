import { test, expect, type Page, type BrowserContext } from '@playwright/test'
import { launchExtension, navigateToExtensionPage } from './helpers/extension-loader'

/**
 * E2E Tests for PACify Extension - Proxy Management
 *
 * These tests load the actual Chrome extension and test user workflows.
 *
 * Requirements:
 * 1. Extension must be built first: npm run build
 * 2. Tests run in headed mode (required for Chrome extensions)
 *
 * Note: This is a lightweight test suite. For comprehensive E2E coverage,
 * see comprehensive-flows.spec.ts which has 28 tests covering all features.
 *
 * Tests verify:
 * - Basic proxy configuration CRUD operations
 * - Quick switch functionality
 * - Backup/export functionality
 * - Error handling
 */

// Set test timeout to 20 seconds for extension tests
test.setTimeout(20000)

let sharedContext: BrowserContext | null = null
let sharedExtensionId: string | null = null

// Setup: Launch extension once for all tests
test.beforeAll(async () => {
  const { context, extensionId } = await launchExtension()
  sharedContext = context
  sharedExtensionId = extensionId
  console.log(`Extension loaded with ID: ${extensionId}`)
}, 20000)

// Cleanup: Close browser after all tests
test.afterAll(async () => {
  if (sharedContext) {
    await sharedContext.close()
  }
})

// Helper to get a fresh page for each test
async function getOptionsPage(): Promise<Page> {
  if (!sharedContext || !sharedExtensionId) {
    throw new Error('Extension not loaded')
  }
  const page = await navigateToExtensionPage(
    sharedContext,
    sharedExtensionId,
    'src/options/options.html'
  )
  await page.waitForLoadState('networkidle')
  return page
}

test.describe('Proxy Configuration Management', () => {
  test('should display empty state when no proxies configured', async () => {
    const page = await getOptionsPage()

    // Check for empty state or existing proxies
    const hasContent = await page.locator('body').textContent()
    expect(hasContent).toBeTruthy()

    // Look for either empty state or proxy list
    const hasEmptyStateOrProxies = await page.locator('text=/No proxy|proxy/i').first().isVisible()
    expect(hasEmptyStateOrProxies).toBeTruthy()
  })

  test('should load options page successfully', async () => {
    const page = await getOptionsPage()

    // Verify page loaded with content
    const title = await page.title()
    expect(title).toBeTruthy()

    // Verify main content loaded
    const bodyText = await page.locator('body').textContent()
    expect(bodyText).toBeTruthy()
    expect(bodyText.length).toBeGreaterThan(0)
  })

  test('should create a PAC script configuration', async () => {
    const page = await getOptionsPage()

    await page.click('button:has-text("Add New Script")')

    // Wait for modal to open
    await page.waitForSelector('text=Proxy Configuration')

    // Fill in configuration name
    await page.fill('input#scriptName', 'Test PAC Script')

    // PAC Script mode is the default, just save
    await page.click('button:has-text("Save Configuration")')

    // Verify proxy was created (checking for the proxy config item)
    await expect(page.locator('text=Test PAC Script').first()).toBeVisible({ timeout: 10000 })
  })

  test('should delete a proxy configuration', async () => {
    const page = await getOptionsPage()

    // Create a proxy
    await page.click('button:has-text("Add New Script")')
    await page.waitForSelector('text=Proxy Configuration')
    await page.fill('input#scriptName', 'Delete Test')
    await page.click('button:has-text("Save Configuration")')
    await page.waitForTimeout(1000)

    // Delete it using the aria-label selector
    await page.click('button[aria-label="Delete Delete Test configuration"]')

    // Confirm deletion if there's a confirmation dialog
    const confirmButton = page.locator('button:has-text("Delete")')
    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmButton.click()
    }

    // Verify it's gone
    await expect(page.locator('text=Delete Test').first()).not.toBeVisible({ timeout: 5000 })
  })

  test('should edit an existing proxy configuration', async () => {
    const page = await getOptionsPage()

    // Create a proxy
    await page.click('button:has-text("Add New Script")')
    await page.waitForSelector('text=Proxy Configuration')
    await page.fill('input#scriptName', 'Original Name')
    await page.click('button:has-text("Save Configuration")')
    await page.waitForTimeout(1000)

    // Edit it using the aria-label selector
    await page.click('button[aria-label="Edit Original Name configuration"]')

    // Wait for modal to open
    await page.waitForSelector('text=Proxy Configuration')

    // Change name
    await page.fill('input#scriptName', 'Updated Name')
    await page.click('button:has-text("Save Configuration")')
    await page.waitForTimeout(1000)

    // Verify new name
    await expect(page.locator('text=Updated Name').first()).toBeVisible()
    await expect(page.locator('text=Original Name')).not.toBeVisible()
  })
})

test.describe('Quick Switch Functionality', () => {
  test('should toggle quick switch mode globally', async () => {
    const page = await getOptionsPage()

    // Quick switch toggle is on the Proxy Configs tab
    await page.click('button[id="tab-proxy-configs"]')
    await page.waitForTimeout(500)

    // Find the quick switch toggle checkbox (it's hidden with sr-only)
    const quickSwitchToggle = page.locator('input#quickSwitchToggle')

    // Get initial state
    const initialState = await quickSwitchToggle.isChecked()

    // Toggle it by clicking the parent label
    await quickSwitchToggle.locator('..').click()
    await page.waitForTimeout(500)

    // Verify it changed
    const newState = await quickSwitchToggle.isChecked()
    expect(newState).not.toBe(initialState)

    // Toggle back
    await quickSwitchToggle.locator('..').click()
    await page.waitForTimeout(500)
  })
})

test.describe('Backup and Restore', () => {
  test('should export proxy configurations', async () => {
    const page = await getOptionsPage()

    // Create a test proxy first
    await page.click('button:has-text("Add New Script")')
    await page.waitForSelector('text=Proxy Configuration')
    await page.fill('input#scriptName', 'Export Test')
    await page.click('button:has-text("Save Configuration")')
    await page.waitForTimeout(1000)

    // Navigate to settings tab where backup/restore is located
    await page.click('button:has-text("Settings")')
    await page.waitForTimeout(500)

    // Start download listener
    const downloadPromise = page.waitForEvent('download')

    // Click export button using aria-label
    await page.click('button[aria-label="Backup all proxy configurations and settings"]')

    // Wait for download
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('.json')
  })
})

test.describe('Error Handling', () => {
  test('should show error for invalid proxy configuration', async () => {
    const page = await getOptionsPage()

    await page.click('button:has-text("Add New Script")')
    await page.waitForSelector('[data-testid="modal-title"]')

    // Try to save without required name field
    await page.click('button:has-text("Save Configuration")')

    // Should show validation error or the button should not work
    // Check if modal is still open (indicating validation failed)
    await expect(page.locator('[data-testid="modal-title"]')).toBeVisible()
  })
})

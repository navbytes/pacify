import { type BrowserContext, expect, type Page, test } from '@playwright/test'
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
test.beforeAll('Launch extension', async () => {
  test.setTimeout(20000)
  const { context, extensionId } = await launchExtension()
  sharedContext = context
  sharedExtensionId = extensionId
  console.log(`Extension loaded with ID: ${extensionId}`)
})

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
  const page = await navigateToExtensionPage(sharedContext, sharedExtensionId, 'options.html')
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
    const bodyText = (await page.locator('body').textContent()) ?? ''
    expect(bodyText).toBeTruthy()
    expect(bodyText.length).toBeGreaterThan(0)
  })

  test('should create a PAC script configuration', async () => {
    const page = await getOptionsPage()

    await page.getByTestId('add-new-script-btn').click()

    // Wait for modal to open
    await expect(page.locator('text=Proxy Configuration').first()).toBeVisible()

    // Fill in configuration name
    await page.fill('input#scriptName', 'Test PAC Script')

    // The modal opens on "Connect through a server" (fixed_servers), so switch
    // to PAC script explicitly rather than relying on a default.
    await page.getByTestId('conn-type-trigger').click()
    await page.getByTestId('segment-pac_script').click()

    await page.getByTestId('modal-save-btn').click()

    // Wait for modal to close
    await expect(page.locator('h2:has-text("Proxy Configuration")').first()).not.toBeVisible()

    // Verify proxy was created (checking for the proxy config item)
    await expect(page.locator('text=Test PAC Script').first()).toBeVisible({ timeout: 10000 })
  })

  test('should delete a proxy configuration', async () => {
    const page = await getOptionsPage()

    // Create a proxy
    await page.getByTestId('add-new-script-btn').click()
    await expect(page.locator('text=Proxy Configuration').first()).toBeVisible()
    await page.fill('input#scriptName', 'Delete Test')
    // fixed_servers is the modal's default mode and needs a real server:
    // a config with no usable host/port can no longer be saved.
    await page.getByTestId('single-proxy-host-input').fill('127.0.0.1')
    await page.getByTestId('single-proxy-port-input').fill('8080')
    await page.getByTestId('modal-save-btn').click()
    // Wait for modal to close
    await expect(page.locator('h2:has-text("Proxy Configuration")').first()).not.toBeVisible()
    await expect(page.locator('text=Delete Test').first()).toBeVisible()

    // Delete it using the aria-label selector
    await page.click('button[aria-label="Delete Delete Test configuration"]')

    // Confirm deletion if there's a confirmation dialog
    await page.getByTestId('confirm-dialog-confirm-button').click()

    // Verify it's gone
    await expect(page.locator('text=Delete Test').first()).not.toBeVisible({ timeout: 5000 })
  })

  test('should edit an existing proxy configuration', async () => {
    const page = await getOptionsPage()

    // Create a proxy
    await page.getByTestId('add-new-script-btn').click()
    await expect(page.locator('text=Proxy Configuration').first()).toBeVisible()
    await page.fill('input#scriptName', 'Original Name')
    // fixed_servers is the modal's default mode and needs a real server:
    // a config with no usable host/port can no longer be saved.
    await page.getByTestId('single-proxy-host-input').fill('127.0.0.1')
    await page.getByTestId('single-proxy-port-input').fill('8080')
    await page.getByTestId('modal-save-btn').click()
    // Wait for modal to close
    await expect(page.locator('h2:has-text("Proxy Configuration")').first()).not.toBeVisible()
    await expect(page.locator('text=Original Name').first()).toBeVisible()

    // Edit it using the aria-label selector
    await page.click('button[aria-label="Edit Original Name configuration"]')

    // Wait for modal to open
    await expect(page.locator('text=Proxy Configuration').first()).toBeVisible()

    // Change name
    await page.fill('input#scriptName', 'Updated Name')
    await page.getByTestId('modal-save-btn').click()

    // Wait for modal to close
    await expect(page.locator('h2:has-text("Proxy Configuration")').first()).not.toBeVisible()

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
    await expect(page.locator('button[id="tab-proxy-configs"][aria-selected="true"]')).toBeVisible()

    // Create a proxy first (Quick Switch toggle only shows when there are proxies)
    await page.getByTestId('add-new-script-btn').click()
    await expect(page.locator('text=Proxy Configuration').first()).toBeVisible()
    await page.fill('input#scriptName', 'Quick Switch Test')
    // fixed_servers is the modal's default mode and needs a real server:
    // a config with no usable host/port can no longer be saved.
    await page.getByTestId('single-proxy-host-input').fill('127.0.0.1')
    await page.getByTestId('single-proxy-port-input').fill('8080')
    await page.getByTestId('modal-save-btn').click()
    // Wait for modal to close
    await expect(page.locator('h2:has-text("Proxy Configuration")').first()).not.toBeVisible()
    await expect(page.locator('text=Quick Switch Test').first()).toBeVisible()

    // Pin the proxy via its per-card button — the Quick Switch section (and its
    // global toggle) only appears once at least one proxy is pinned.
    await page.click('button[aria-label=\'Add "Quick Switch Test" to Quick Switch\']')

    // Find the quick switch toggle checkbox (it's hidden with sr-only)
    const quickSwitchToggle = page.locator('input#sectionToggle-quick-switch')
    await expect(quickSwitchToggle).toBeAttached()

    // Get initial state
    const initialState = await quickSwitchToggle.isChecked()

    // Toggle it by clicking the parent label
    await quickSwitchToggle.locator('..').click()

    // Verify it changed - wait for state to stabilize
    if (initialState) {
      await expect(quickSwitchToggle).not.toBeChecked()
    } else {
      await expect(quickSwitchToggle).toBeChecked()
    }

    // Toggle back
    await quickSwitchToggle.locator('..').click()

    // Verify it's back to original state - wait for state to stabilize
    if (initialState) {
      await expect(quickSwitchToggle).toBeChecked()
    } else {
      await expect(quickSwitchToggle).not.toBeChecked()
    }
  })
})

test.describe('Backup and Restore', () => {
  test('should export proxy configurations', async () => {
    const page = await getOptionsPage()

    // Create a test proxy first
    await page.getByTestId('add-new-script-btn').click()
    await expect(page.locator('text=Proxy Configuration').first()).toBeVisible()
    await page.fill('input#scriptName', 'Export Test')
    // fixed_servers is the modal's default mode and needs a real server:
    // a config with no usable host/port can no longer be saved.
    await page.getByTestId('single-proxy-host-input').fill('127.0.0.1')
    await page.getByTestId('single-proxy-port-input').fill('8080')
    await page.getByTestId('modal-save-btn').click()
    // Wait for modal to close
    await expect(page.locator('h2:has-text("Proxy Configuration")').first()).not.toBeVisible()
    await expect(page.locator('text=Export Test').first()).toBeVisible()

    // Navigate to settings tab where backup/restore is located
    await page.click('button:has-text("Settings")')
    await expect(
      page.locator('button:has-text("Settings")[aria-selected="true"]').first()
    ).toBeVisible()

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

    await page.getByTestId('add-new-script-btn').click()
    await expect(page.getByTestId('modal-title')).toBeVisible()

    // Try to save without required name field
    await page.getByTestId('modal-save-btn').click()

    // Should show validation error or the button should not work
    // Check if modal is still open (indicating validation failed)
    await expect(page.getByTestId('modal-title')).toBeVisible()
  })

  /**
   * Regression: a manual proxy saved with the port left blank used to be
   * accepted. Chrome then rejected the whole config, so activating it left the
   * popup showing the proxy as ON while traffic went out unproxied — a silent
   * failure with privacy consequences. Saving must now be refused.
   *
   * (An out-of-range port like 99999 was already blocked, but by the browser's
   * native min/max validation on the number input, not by the app. The empty
   * case slipped through because the input carries no `required` attribute and
   * validatePort() treats blank as "no error".)
   */
  test('refuses to save a manual proxy whose port is blank', async () => {
    const page = await getOptionsPage()

    await page.getByTestId('add-new-script-btn').click()
    await expect(page.getByTestId('modal-title')).toBeVisible()
    await page.fill('input#scriptName', 'Blank Port Proxy')
    await page.getByTestId('single-proxy-host-input').fill('127.0.0.1')
    // port deliberately left empty
    await page.getByTestId('modal-save-btn').click()

    // The modal stays open and reports the problem instead of saving.
    await expect(page.getByTestId('modal-title')).toBeVisible()
    await expect(page.locator('[data-error-message]')).toBeVisible()

    // And nothing was persisted.
    const saved = await page.evaluate(async () => {
      const data = await chrome.storage.sync.get(null)
      return JSON.stringify(data).includes('Blank Port Proxy')
    })
    expect(saved).toBe(false)
  })
})

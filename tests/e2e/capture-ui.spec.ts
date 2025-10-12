import { test } from '@playwright/test'
import { launchExtension, navigateToExtensionPage } from './helpers/extension-loader'
import * as fs from 'fs'
import * as path from 'path'

test('Capture Options Page UI', async () => {
  const { context, extensionId } = await launchExtension()

  const page = await navigateToExtensionPage(context, extensionId, 'src/options/options.html')
  await page.waitForLoadState('networkidle')

  // Create a test proxy
  await page.click('button:has-text("Add New Script")')
  await page.waitForSelector('text=Proxy Configuration')
  await page.fill('input#scriptName', 'Test Proxy')
  await page.getByTestId('save-config-btn').click()
  await page.waitForTimeout(1000)

  // Take a snapshot of the page
  const snapshot = await page.locator('body').evaluate((el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT)
    const elements: any[] = []
    let node

    while ((node = walker.nextNode())) {
      const elem = node as Element
      if (elem.tagName === 'BUTTON' || elem.tagName === 'INPUT' || elem.hasAttribute('role')) {
        elements.push({
          tag: elem.tagName,
          text: elem.textContent?.trim().substring(0, 50),
          ariaLabel: elem.getAttribute('aria-label'),
          role: elem.getAttribute('role'),
          type: elem.getAttribute('type'),
          id: elem.getAttribute('id'),
          dataTestId: elem.getAttribute('data-testid'),
          className: elem.className,
        })
      }
    }
    return elements
  })

  console.log('\n=== INTERACTIVE ELEMENTS ===\n')
  console.log(JSON.stringify(snapshot, null, 2))

  // Save to file for reference
  const outputPath = path.join(process.cwd(), 'test-results', 'ui-snapshot.json')
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, JSON.stringify(snapshot, null, 2))

  console.log(`\n✅ Snapshot saved to: ${outputPath}`)

  // Take screenshot
  await page.screenshot({
    path: path.join(process.cwd(), 'test-results', 'options-page.png'),
    fullPage: true,
  })
  console.log('✅ Screenshot saved')

  await context.close()
})

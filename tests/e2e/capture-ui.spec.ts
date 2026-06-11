import * as fs from 'node:fs'
import * as path from 'node:path'
import { test } from '@playwright/test'
import { launchExtension, navigateToExtensionPage } from './helpers/extension-loader'

test('Capture Options Page UI', async () => {
  const { context, extensionId } = await launchExtension()

  const page = await navigateToExtensionPage(context, extensionId, 'options.html')
  await page.waitForLoadState('networkidle')

  // Create a test proxy
  await page.getByTestId('add-new-script-btn').click()
  await page.getByTestId('modal-title').waitFor()
  await page.fill('input#scriptName', 'Test Proxy')
  await page.getByTestId('modal-save-btn').click()
  await page.getByTestId('modal-title').waitFor({ state: 'hidden' })

  // Take a snapshot of the page
  const snapshot = await page.locator('body').evaluate((el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT)
    interface ElementInfo {
      tag: string
      text: string | undefined
      ariaLabel: string | null
      role: string | null
      type: string | null
      id: string | null
      dataTestId: string | null
      className: string
    }
    const elements: ElementInfo[] = []
    let node: Node | null = walker.nextNode()

    while (node) {
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
      node = walker.nextNode()
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

import AxeBuilder from '@axe-core/playwright'
import { type BrowserContext, expect, type Page, test } from '@playwright/test'
import { launchExtension, navigateToExtensionPage } from './helpers/extension-loader'

/**
 * Automated accessibility audit (axe-core).
 *
 * Scans the real extension pages — and a few modal states — against the
 * WCAG 2.0/2.1 A and AA rule sets. This is the audited backstop for the manual
 * a11y work (focus trapping, dialog semantics, localized lang/dir,
 * reduced-motion): it catches regressions like color-contrast drops, unlabeled
 * controls, and missing form labels that are easy to reintroduce by eye.
 */

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

test.setTimeout(60000)

let sharedContext: BrowserContext | null = null
let sharedExtensionId: string | null = null

test.beforeAll('Launch extension', async () => {
  test.setTimeout(20000)
  const { context, extensionId } = await launchExtension()
  sharedContext = context
  sharedExtensionId = extensionId
})

test.afterAll(async () => {
  if (sharedContext) await sharedContext.close()
})

async function open(page: 'options.html' | 'popup.html'): Promise<Page> {
  if (!sharedContext || !sharedExtensionId) throw new Error('Extension not loaded')
  const p = await navigateToExtensionPage(sharedContext, sharedExtensionId, page)
  // Emulate reduced motion so entrance animations collapse to instant (see the
  // global prefers-reduced-motion guard). Without this, axe can scan a modal
  // mid-fade-in and report phantom contrast failures where semi-transparent
  // content is blended against the backdrop. This also exercises that the
  // reduced-motion CSS actually takes effect.
  await p.emulateMedia({ reducedMotion: 'reduce' })
  await p.waitForLoadState('networkidle')
  return p
}

function scan(page: Page, context?: string) {
  const builder = new AxeBuilder({ page }).withTags(WCAG_TAGS)
  return context ? builder.include(context) : builder
}

// Pretty-print violations so CI failures are actionable without a screenshot.
function report(violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations']): string {
  return violations
    .map(
      (v) =>
        `\n  [${v.impact}] ${v.id}: ${v.help}\n    ${v.nodes
          .map((n) => n.target.join(' '))
          .slice(0, 5)
          .join('\n    ')}\n    → ${v.helpUrl}`
    )
    .join('\n')
}

test.describe('Accessibility (axe-core, WCAG 2.1 AA)', () => {
  test('options page — proxy list', async () => {
    const page = await open('options.html')
    await expect(page.getByTestId('add-new-script-btn')).toBeVisible()

    const results = await scan(page).analyze()
    expect(results.violations, report(results.violations)).toEqual([])
  })

  test('options page — settings tab', async () => {
    const page = await open('options.html')
    await page.getByTestId('tabpanel-settings').click()
    await expect(page.locator('h2:has-text("Proxy Behavior")').first()).toBeVisible()

    const results = await scan(page).analyze()
    expect(results.violations, report(results.violations)).toEqual([])
  })

  test('proxy editor modal', async () => {
    const page = await open('options.html')
    await page.getByTestId('add-new-script-btn').click()
    await expect(page.getByTestId('modal-title')).toBeVisible()

    // Scope the scan to the dialog so it reflects the modal's own a11y.
    const results = await scan(page, '[role="dialog"]').analyze()
    expect(results.violations, report(results.violations)).toEqual([])
  })

  test('popup', async () => {
    const page = await open('popup.html')
    await page.waitForSelector('body')

    const results = await scan(page).analyze()
    expect(results.violations, report(results.violations)).toEqual([])
  })
})

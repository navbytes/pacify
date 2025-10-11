import { test, expect } from '@playwright/test'
import { existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

/**
 * Smoke tests for PACify Extension Build
 *
 * These tests verify that the extension is built correctly
 * Actual Chrome extension testing requires headed mode and is skipped in CI
 */

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

test.describe('Extension Build Verification', () => {
  const distPath = path.join(__dirname, '../../dist')

  test('should have dist folder with manifest', () => {
    expect(existsSync(distPath)).toBeTruthy()
    expect(existsSync(path.join(distPath, 'manifest.json'))).toBeTruthy()
  })

  test('should have options page', () => {
    const optionsPath = path.join(distPath, 'src/options/options.html')
    expect(existsSync(optionsPath)).toBeTruthy()
  })

  test('should have popup page', () => {
    const popupPath = path.join(distPath, 'src/popup/popup.html')
    expect(existsSync(popupPath)).toBeTruthy()
  })

  test('should have background script', () => {
    const backgroundPath = path.join(distPath, 'assets/background.js')
    expect(existsSync(backgroundPath)).toBeTruthy()
  })

  test('should have icons', () => {
    expect(existsSync(path.join(distPath, 'icons/icon16.png'))).toBeTruthy()
    expect(existsSync(path.join(distPath, 'icons/icon48.png'))).toBeTruthy()
    expect(existsSync(path.join(distPath, 'icons/icon128.png'))).toBeTruthy()
  })
})

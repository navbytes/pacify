import { ChromeService } from './chrome/ChromeService'
import { convertAppSettingsToChromeConfig } from '@/utils/chrome'
import type { ProxyConfig, ProxyTestResult } from '@/interfaces'
import { withErrorHandling } from '@/utils/errorHandling'
import { ERROR_TYPES } from '@/interfaces/error'

/**
 * Service for testing proxy connections
 * Phase 1: Foundation & Testing
 *
 * Security: Uses native fetch() API and Chrome proxy API
 * No eval() or code execution - completely safe
 */
export class ProxyTestService {
  /**
   * Test if a proxy configuration works
   *
   * Process:
   * 1. Save current proxy settings
   * 2. Temporarily apply test proxy
   * 3. Make HTTP request to test URL
   * 4. Restore original proxy settings
   * 5. Return test results
   *
   * @param proxy - Proxy configuration to test
   * @param testUrl - URL to test against (defaults to settings.testUrl)
   * @returns Test results including success status and response time
   */
  static testProxy = withErrorHandling(
    async (proxy: ProxyConfig, testUrl: string): Promise<ProxyTestResult> => {
      let originalProxy: chrome.types.ChromeSettingGetDetails | null = null

      try {
        // 1. Save current proxy settings
        originalProxy = await ChromeService.getProxy()

        // 2. Temporarily set the test proxy
        const proxyConfig = convertAppSettingsToChromeConfig(proxy)
        await chrome.proxy.settings.set({
          value: proxyConfig,
          scope: 'regular'
        })

        // 3. Make test request with timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

        const startTime = performance.now()

        const response = await fetch(testUrl, {
          signal: controller.signal,
          cache: 'no-store',
          // Don't follow redirects to test the actual proxy connection
          redirect: 'manual'
        })

        clearTimeout(timeoutId)
        const responseTime = Math.round(performance.now() - startTime)

        // 4. Restore original proxy (do this before returning)
        if (originalProxy) {
          await chrome.proxy.settings.set(originalProxy)
        }

        // 5. Return success results
        return {
          success: true,
          responseTime,
          statusCode: response.status,
          testedAt: new Date(),
          testUrl
        }
      } catch (error) {
        // Always restore original proxy, even on error
        if (originalProxy) {
          try {
            await chrome.proxy.settings.set(originalProxy)
          } catch (restoreError) {
            console.error('Failed to restore original proxy:', restoreError)
          }
        }

        // Determine error message
        let errorMessage = 'Unknown error'
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            errorMessage = 'Connection timeout (>10s)'
          } else if (error.message.includes('NetworkError')) {
            errorMessage = 'Network error - proxy may be unreachable'
          } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Failed to connect through proxy'
          } else {
            errorMessage = error.message
          }
        }

        return {
          success: false,
          error: errorMessage,
          testedAt: new Date(),
          testUrl
        }
      }
    },
    ERROR_TYPES.FETCH_SETTINGS
  )

  /**
   * Get human-readable status from test result
   */
  static getTestStatus(result: ProxyTestResult): {
    label: string
    color: 'success' | 'warning' | 'error' | 'neutral'
    icon: string
  } {
    if (!result.success) {
      return {
        label: 'Failed',
        color: 'error',
        icon: '🔴'
      }
    }

    if (!result.responseTime) {
      return {
        label: 'OK',
        color: 'success',
        icon: '🟢'
      }
    }

    // Response time thresholds
    if (result.responseTime < 2000) {
      return {
        label: `OK (${result.responseTime}ms)`,
        color: 'success',
        icon: '🟢'
      }
    }

    if (result.responseTime < 5000) {
      return {
        label: `Slow (${result.responseTime}ms)`,
        color: 'warning',
        icon: '🟡'
      }
    }

    return {
      label: `Very Slow (${result.responseTime}ms)`,
      color: 'warning',
      icon: '🟠'
    }
  }

  /**
   * Format test result for display
   */
  static formatTestResult(result: ProxyTestResult): string {
    if (!result.success) {
      return `❌ ${result.error || 'Connection failed'}`
    }

    const status = this.getTestStatus(result)
    return `${status.icon} ${status.label}`
  }

  /**
   * Check if a test result is recent (within last hour)
   */
  static isTestResultRecent(result: ProxyTestResult): boolean {
    const oneHourAgo = Date.now() - (60 * 60 * 1000)
    return new Date(result.testedAt).getTime() > oneHourAgo
  }

  /**
   * Get time since last test
   */
  static getTimeSinceTest(result: ProxyTestResult): string {
    const now = Date.now()
    const tested = new Date(result.testedAt).getTime()
    const diff = now - tested

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'just now'
  }
}

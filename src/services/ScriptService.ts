import type { ValidationResult } from '@/interfaces'

export class ScriptService {
  private static readonly PROXY_KEYWORDS = ['DIRECT', 'PROXY', 'SOCKS', 'SOCKS5', 'HTTP']
  private static readonly _COMMON_HELPER_FUNCTIONS = [
    'isPlainHostName',
    'dnsDomainIs',
    'localHostOrDomainIs',
    'isResolvable',
    'isInNet',
    'dnsResolve',
    'convert_addr',
    'myIpAddress',
    'dnsDomainLevels',
    'shExpMatch',
  ]

  /**
   * @description Validate PAC script comprehensively
   */
  public static validatePACScript(script: string): ValidationResult {
    try {
      // Basic validation
      if (!script.trim()) {
        return { isValid: false, errorMessage: 'Script cannot be empty' }
      }

      // Check for FindProxyForURL function existence
      if (!script.includes('FindProxyForURL')) {
        return {
          isValid: false,
          errorMessage: 'Script must contain FindProxyForURL function',
        }
      }

      // Validate function declaration and parameters
      const functionDeclaration = script.match(/function\s+FindProxyForURL\s*\(([^)]*)\)/)
      if (!functionDeclaration) {
        return {
          isValid: false,
          errorMessage: 'Invalid FindProxyForURL function declaration',
        }
      }

      // Validate required parameters
      const parameters = functionDeclaration[1].split(',').map((param) => param.trim())
      if (parameters.length < 2) {
        return {
          isValid: false,
          errorMessage: 'FindProxyForURL must have at least two parameters (url, host)',
        }
      }

      // Check for proxy directives
      if (!this.PROXY_KEYWORDS.some((keyword) => script.includes(keyword))) {
        return {
          isValid: false,
          errorMessage: 'Script must contain at least one proxy directive',
        }
      }

      // Check for return statement
      if (!script.includes('return')) {
        return {
          isValid: false,
          errorMessage: 'Script must contain at least one return statement',
        }
      }

      // Check for proper proxy string format
      const proxyStrings = script.match(/return\s+["']([^"']+)["']/g)
      if (proxyStrings) {
        for (const proxyString of proxyStrings) {
          if (!this.validateProxyString(proxyString)) {
            return {
              isValid: false,
              errorMessage: 'Invalid proxy string format',
            }
          }
        }
      }

      // Warning checks (not errors but might indicate issues)
      const warnings = this.getScriptWarnings(script)

      return { isValid: true, errorMessage: warnings }
    } catch (error) {
      return {
        isValid: false,
        errorMessage: `Validation error: ${(error as Error).message}`,
      }
    }
  }

  /**
   * @description Validate proxy string format
   */
  private static validateProxyString(proxyString: string): boolean {
    const proxyPattern =
      /^(DIRECT|PROXY\s+[\w.-]+:\d+|SOCKS\s+[\w.-]+:\d+|SOCKS5\s+[\w.-]+:\d+|HTTP\s+[\w.-]+:\d+)$/
    const parts = proxyString
      .replace(/return\s+["']/, '')
      .replace(/["']$/, '')
      .split(/;\s*/)

    return parts.every((part) => proxyPattern.test(part.trim()))
  }

  /**
   * @description Get warnings about potential issues in the script
   */
  private static getScriptWarnings(script: string): string | null {
    const warnings: string[] = []

    // Check for potentially problematic patterns
    if (script.includes('alert(')) {
      warnings.push('Script contains alert() calls which might interfere with execution')
    }

    if (script.includes('console.log(')) {
      warnings.push('Script contains console.log() calls which might affect performance')
    }

    // Check for potential infinite loops
    if (/while\s*\(\s*true\s*\)/.test(script)) {
      warnings.push('Potential infinite loop detected')
    }

    // Check script size
    if (script.length > 1024 * 100) {
      // 100KB
      warnings.push('Script is unusually large and might cause performance issues')
    }

    if (warnings.length === 0) return null

    return warnings.join(', ')
  }
}

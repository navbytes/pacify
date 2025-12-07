import type { ProxyConfig, ProxyRules, ProxyServer, ValidationResult } from '@/interfaces'
import { PACScriptAnalyzer } from '@/services/PACScriptAnalyzer'

/**
 * Validator for proxy configurations
 * Phase 1: Foundation & Testing
 *
 * Validates proxy settings before save to catch errors early
 */
export class ProxyValidator {
  /**
   * Validate a complete proxy configuration
   */
  static validateProxyConfig(config: ProxyConfig): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Name validation
    if (!config.name || !config.name.trim()) {
      errors.push('Proxy name is required')
    } else if (config.name.length > 50) {
      warnings.push('Proxy name is very long - consider shortening for better display')
    }

    // Color validation
    if (!config.color) {
      errors.push('Proxy color is required')
    } else if (!/^#[0-9A-Fa-f]{6}$/.test(config.color)) {
      errors.push('Invalid color format - must be hex color (e.g., #3b82f6)')
    }

    // Mode-specific validation
    switch (config.mode) {
      case 'fixed_servers':
        if (!config.rules) {
          errors.push('Manual proxy mode requires proxy server configuration')
        } else {
          this.validateProxyRules(config.rules, errors, warnings)
        }
        break

      case 'pac_script':
        if (!config.pacScript) {
          errors.push('PAC script mode requires script configuration')
        } else {
          this.validatePACScript(config.pacScript, errors, warnings)
        }
        break

      case 'direct':
      case 'auto_detect':
      case 'system':
        // These modes don't need additional configuration
        break

      default:
        errors.push(`Unknown proxy mode: ${config.mode}`)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validate manual proxy rules
   */
  private static validateProxyRules(
    rules: ProxyRules,
    errors: string[],
    warnings: string[]
  ): void {
    // Check if at least one proxy is configured
    const hasProxy =
      rules.singleProxy ||
      rules.proxyForHttp ||
      rules.proxyForHttps ||
      rules.proxyForFtp ||
      rules.fallbackProxy

    if (!hasProxy) {
      errors.push('At least one proxy server must be configured')
      return
    }

    // Validate each configured proxy
    if (rules.singleProxy) {
      this.validateProxyServer(rules.singleProxy, 'Shared proxy', errors, warnings)
    }

    if (rules.proxyForHttp) {
      this.validateProxyServer(rules.proxyForHttp, 'HTTP proxy', errors, warnings)
    }

    if (rules.proxyForHttps) {
      this.validateProxyServer(rules.proxyForHttps, 'HTTPS proxy', errors, warnings)
    }

    if (rules.proxyForFtp) {
      this.validateProxyServer(rules.proxyForFtp, 'FTP proxy', errors, warnings)
    }

    if (rules.fallbackProxy) {
      this.validateProxyServer(rules.fallbackProxy, 'Fallback proxy', errors, warnings)
    }

    // Validate bypass list
    if (rules.bypassList && rules.bypassList.length > 0) {
      rules.bypassList.forEach((entry, index) => {
        if (!entry.trim()) {
          warnings.push(`Bypass list entry #${index + 1} is empty`)
        }
      })
    }
  }

  /**
   * Validate a single proxy server configuration
   */
  private static validateProxyServer(
    server: ProxyServer,
    label: string,
    errors: string[],
    warnings: string[]
  ): void {
    // Host validation
    if (!server.host || !server.host.trim()) {
      errors.push(`${label}: Host is required`)
    } else if (!this.isValidHost(server.host)) {
      errors.push(
        `${label}: Invalid host "${server.host}" - must be a domain name or IP address`
      )
    }

    // Port validation
    if (!server.port) {
      errors.push(`${label}: Port is required`)
    } else {
      const port = parseInt(server.port)

      if (isNaN(port)) {
        errors.push(`${label}: Port must be a number`)
      } else if (port < 1 || port > 65535) {
        errors.push(`${label}: Port must be between 1 and 65535`)
      } else {
        // Warnings for unusual ports
        if (port === 80) {
          warnings.push(`${label}: Port 80 is typically for HTTP, not proxies`)
        } else if (port === 443) {
          warnings.push(`${label}: Port 443 is typically for HTTPS, not proxies`)
        } else if (port < 1024) {
          warnings.push(`${label}: Port ${port} is a privileged port`)
        }
      }
    }

    // Scheme validation
    const validSchemes = ['http', 'https', 'socks4', 'socks5', 'quic']
    if (!validSchemes.includes(server.scheme)) {
      errors.push(
        `${label}: Invalid scheme "${server.scheme}" - must be one of: ${validSchemes.join(', ')}`
      )
    }

    // Scheme-specific warnings
    if (server.scheme === 'quic') {
      warnings.push(`${label}: QUIC proxy support may be limited in some environments`)
    }
  }

  /**
   * Validate PAC script configuration
   */
  private static validatePACScript(
    pacScript: { url?: string; data?: string; mandatory?: boolean },
    errors: string[],
    warnings: string[]
  ): void {
    // Must have either URL or inline script
    if (!pacScript.url && !pacScript.data) {
      errors.push('PAC script requires either a URL or inline script')
      return
    }

    // Can't have both
    if (pacScript.url && pacScript.data) {
      warnings.push('Both PAC URL and inline script are set - URL will take precedence')
    }

    // Validate URL if present
    if (pacScript.url) {
      if (!this.isValidURL(pacScript.url)) {
        errors.push(`Invalid PAC script URL: ${pacScript.url}`)
      } else if (!pacScript.url.startsWith('http://') && !pacScript.url.startsWith('https://')) {
        warnings.push('PAC URL should use HTTP or HTTPS protocol')
      }
    }

    // Validate inline script if present
    if (pacScript.data) {
      // Use PAC analyzer for detailed validation
      const analysis = PACScriptAnalyzer.analyze(pacScript.data)

      // Add syntax errors
      errors.push(...analysis.syntax.errors)

      // Add critical security issues as errors
      const criticalIssues = analysis.security.filter(issue => issue.severity === 'critical')
      errors.push(...criticalIssues.map(issue => `Security: ${issue.message}`))

      // Add warnings and non-critical security issues
      const nonCriticalIssues = analysis.security.filter(
        issue => issue.severity !== 'critical'
      )
      warnings.push(...nonCriticalIssues.map(issue => `Security: ${issue.message}`))
      warnings.push(...analysis.warnings)
    }
  }

  /**
   * Check if a string is a valid hostname or IP address
   */
  private static isValidHost(host: string): boolean {
    // Check for valid domain name
    const domainPattern = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)*[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i

    // Check for valid IPv4 address
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/

    // Check for valid IPv6 address (simplified)
    const ipv6Pattern = /^([0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}$/i

    if (domainPattern.test(host)) {
      return true
    }

    if (ipv4Pattern.test(host)) {
      // Validate IP octets are 0-255
      const octets = host.split('.')
      return octets.every(octet => {
        const num = parseInt(octet)
        return num >= 0 && num <= 255
      })
    }

    if (ipv6Pattern.test(host)) {
      return true
    }

    return false
  }

  /**
   * Check if a string is a valid URL
   */
  private static isValidURL(urlString: string): boolean {
    try {
      const url = new URL(urlString)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  }

  /**
   * Quick validation check (just errors, no warnings)
   */
  static isValid(config: ProxyConfig): boolean {
    const result = this.validateProxyConfig(config)
    return result.valid
  }

  /**
   * Get validation summary text
   */
  static getValidationSummary(result: ValidationResult): string {
    if (result.valid && result.warnings.length === 0) {
      return '✅ Configuration is valid'
    }

    if (result.valid && result.warnings.length > 0) {
      return `⚠️ Configuration is valid with ${result.warnings.length} warning(s)`
    }

    return `❌ Configuration has ${result.errors.length} error(s)`
  }
}

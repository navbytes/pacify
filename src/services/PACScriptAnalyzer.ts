import type { PACAnalysisResult, SecurityIssue, SecuritySeverity } from '@/interfaces'

/**
 * Static analyzer for PAC scripts
 * Phase 1: Foundation & Testing
 *
 * Security: Pure static analysis - NO code execution
 * Analyzes syntax, security issues, and common mistakes
 * WITHOUT using eval() or executing the script
 */
export class PACScriptAnalyzer {
  /**
   * Analyze a PAC script for syntax, security, and common issues
   * @param script - PAC script source code
   * @returns Analysis results with syntax validation, security issues, and warnings
   */
  static analyze(script: string): PACAnalysisResult {
    const result: PACAnalysisResult = {
      syntax: { valid: true, errors: [] },
      security: [],
      warnings: []
    }

    // 1. Check syntax
    result.syntax = this.checkSyntax(script)

    // 2. Check for security issues
    result.security = this.checkSecurity(script)

    // 3. Check for common mistakes
    result.warnings = this.checkCommonMistakes(script)

    return result
  }

  /**
   * Check JavaScript syntax without executing the script
   */
  private static checkSyntax(script: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    try {
      // Use Function constructor for syntax check only
      // The script is NOT executed - just parsed for syntax errors
      // This is safe because:
      // 1. We never call the function
      // 2. No user input is interpolated
      // 3. It's only for syntax validation
      new Function(script)
    } catch (error) {
      if (error instanceof SyntaxError) {
        errors.push(`Syntax error: ${error.message}`)
      } else if (error instanceof Error) {
        errors.push(`Error: ${error.message}`)
      }
    }

    // Check for required function
    if (!script.includes('function FindProxyForURL')) {
      errors.push('Missing required function: FindProxyForURL(url, host)')
    }

    // Check function signature
    const funcMatch = script.match(/function\s+FindProxyForURL\s*\((.*?)\)/)
    if (funcMatch) {
      const params = funcMatch[1].split(',').map(p => p.trim())
      if (params.length !== 2) {
        errors.push('FindProxyForURL must have exactly 2 parameters: (url, host)')
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Detect dangerous patterns that could pose security risks
   */
  private static checkSecurity(script: string): SecurityIssue[] {
    const issues: SecurityIssue[] = []

    // Define dangerous patterns
    const dangerousPatterns: Array<{
      pattern: RegExp
      severity: SecuritySeverity
      message: string
    }> = [
      {
        pattern: /eval\s*\(/g,
        severity: 'critical',
        message: 'Uses eval() - critical security risk. Remove eval() calls.'
      },
      {
        pattern: /new\s+Function\s*\(/g,
        severity: 'critical',
        message: 'Uses Function() constructor - security risk'
      },
      {
        pattern: /document\./g,
        severity: 'warning',
        message: 'Attempts to access document object (PAC scripts have no DOM access)'
      },
      {
        pattern: /window\./g,
        severity: 'warning',
        message: 'Attempts to access window object (not available in PAC context)'
      },
      {
        pattern: /XMLHttpRequest|fetch\(/g,
        severity: 'warning',
        message: 'Attempts network requests (not allowed in PAC scripts)'
      },
      {
        pattern: /localStorage|sessionStorage/g,
        severity: 'warning',
        message: 'Attempts to access storage (not available in PAC context)'
      },
      {
        pattern: /chrome\.|browser\./g,
        severity: 'warning',
        message: 'Attempts to access browser APIs (not available in PAC context)'
      },
      {
        pattern: /import\s+|require\s*\(/g,
        severity: 'warning',
        message: 'Uses module imports (not supported in PAC scripts)'
      }
    ]

    // Check each pattern
    dangerousPatterns.forEach(({ pattern, severity, message }) => {
      const matches = script.matchAll(pattern)
      for (const match of matches) {
        // Try to find line number
        const lineNumber = this.getLineNumber(script, match.index || 0)

        issues.push({
          severity,
          message: `${message} (line ${lineNumber})`,
          line: lineNumber
        })
      }
    })

    return issues
  }

  /**
   * Check for common mistakes and best practices
   */
  private static checkCommonMistakes(script: string): string[] {
    const warnings: string[] = []

    // Check for return statement
    if (!script.includes('return ')) {
      warnings.push('No return statement found - PAC must return a proxy string')
    }

    // Check for common PAC return values
    const hasDirectReturn = /return\s+["']DIRECT["']/i.test(script)
    const hasProxyReturn = /return\s+["']PROXY\s+/i.test(script)

    if (!hasDirectReturn && !hasProxyReturn) {
      warnings.push(
        'No DIRECT or PROXY return statements found - verify return values are correct'
      )
    }

    // Check for semicolons (common mistake to forget them)
    const lines = script.split('\n')
    const nonEmptyLines = lines.filter(
      line => line.trim() && !line.trim().startsWith('//')
    )

    if (nonEmptyLines.length > 5) {
      const linesWithSemicolon = nonEmptyLines.filter(
        line =>
          line.trim().endsWith(';') ||
          line.trim().endsWith('{') ||
          line.trim().endsWith('}')
      )

      if (linesWithSemicolon.length < nonEmptyLines.length * 0.5) {
        warnings.push(
          'Many statements may be missing semicolons - verify syntax is correct'
        )
      }
    }

    // Check for undefined variables (common typos in PAC functions)
    const pacFunctions = [
      'isPlainHostName',
      'dnsDomainIs',
      'localHostOrDomainIs',
      'isResolvable',
      'isInNet',
      'dnsResolve',
      'myIpAddress',
      'dnsDomainLevels',
      'shExpMatch',
      'weekdayRange',
      'dateRange',
      'timeRange'
    ]

    // Warn about potentially misspelled PAC functions
    const functionPattern = /\b\w+\s*\(/g
    const matches = script.matchAll(functionPattern)

    for (const match of matches) {
      const funcName = match[0].replace(/\s*\($/, '')
      if (
        funcName !== 'FindProxyForURL' &&
        funcName !== 'function' &&
        !pacFunctions.includes(funcName) &&
        /^[a-z]/.test(funcName)
      ) {
        // Check if it looks like a PAC function typo
        const similar = pacFunctions.find(
          pf => this.levenshteinDistance(funcName, pf) <= 2
        )
        if (similar) {
          warnings.push(`'${funcName}' may be a typo - did you mean '${similar}'?`)
        }
      }
    }

    // Check for console.log (won't work in PAC)
    if (/console\.(log|warn|error)/g.test(script)) {
      warnings.push('console.log/warn/error are not available in PAC scripts')
    }

    // Check script length
    if (script.length > 10000) {
      warnings.push(
        'Script is very large (>10KB) - consider simplifying for better performance'
      )
    }

    return warnings
  }

  /**
   * Get line number from character index
   */
  private static getLineNumber(script: string, index: number): number {
    return script.substring(0, index).split('\n').length
  }

  /**
   * Calculate Levenshtein distance between two strings
   * Used for detecting typos in function names
   */
  private static levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = []

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        }
      }
    }

    return matrix[b.length][a.length]
  }

  /**
   * Get severity color for UI display
   */
  static getSeverityColor(severity: SecuritySeverity): string {
    switch (severity) {
      case 'critical':
        return '#ef4444' // red
      case 'warning':
        return '#f59e0b' // yellow
      case 'info':
        return '#3b82f6' // blue
      default:
        return '#6b7280' // gray
    }
  }

  /**
   * Get severity icon for UI display
   */
  static getSeverityIcon(severity: SecuritySeverity): string {
    switch (severity) {
      case 'critical':
        return '🔴'
      case 'warning':
        return '⚠️'
      case 'info':
        return 'ℹ️'
      default:
        return '•'
    }
  }
}

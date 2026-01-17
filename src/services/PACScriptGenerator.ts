import type {
  AutoProxyConfig,
  AutoProxyMatchType,
  AutoProxyRule,
  ProxyConfig,
  ProxyServer,
} from '@/interfaces/settings'

/**
 * Represents an embedded PAC script with its unique function name
 */
interface EmbeddedPACScript {
  proxyId: string
  functionName: string
  scriptBody: string
}

/**
 * Generates PAC (Proxy Auto-Config) scripts from Auto-Proxy configurations
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Service class pattern provides namespace and consistent API
export class PACScriptGenerator {
  /**
   * Generate a complete PAC script from an Auto-Proxy configuration
   */
  static generate(config: AutoProxyConfig, allProxies: ProxyConfig[]): string {
    const enabledRules = config.rules
      .filter((rule) => rule.enabled)
      .sort((a, b) => a.priority - b.priority)

    // Collect all embedded PAC scripts needed
    const embeddedScripts = PACScriptGenerator.collectEmbeddedPACScripts(
      enabledRules,
      config,
      allProxies
    )

    // Generate rule conditions
    const ruleConditions = enabledRules
      .map((rule) => PACScriptGenerator.generateRuleCondition(rule, allProxies, embeddedScripts))
      .filter((condition) => condition !== null)

    // Generate fallback
    const fallbackStatement = PACScriptGenerator.generateFallbackStatement(
      config,
      allProxies,
      embeddedScripts
    )

    // Build the final PAC script
    const embeddedFunctions = embeddedScripts.map((es) => es.scriptBody).join('\n\n')

    return `${embeddedFunctions}${embeddedFunctions ? '\n\n' : ''}function FindProxyForURL(url, host) {
${ruleConditions.map((c) => `  ${c}`).join('\n')}
  ${fallbackStatement}
}`
  }

  /**
   * Collect all PAC scripts that need to be embedded
   */
  private static collectEmbeddedPACScripts(
    rules: AutoProxyRule[],
    config: AutoProxyConfig,
    allProxies: ProxyConfig[]
  ): EmbeddedPACScript[] {
    const embeddedScripts: EmbeddedPACScript[] = []
    const processedIds = new Set<string>()

    // Check rules for PAC script references
    for (const rule of rules) {
      if (rule.proxyType === 'existing' && rule.proxyId) {
        const proxy = allProxies.find((p) => p.id === rule.proxyId)
        if (
          proxy &&
          PACScriptGenerator.isPACScriptProxy(proxy) &&
          !processedIds.has(rule.proxyId)
        ) {
          const embedded = PACScriptGenerator.createEmbeddedPACScript(proxy, embeddedScripts.length)
          if (embedded) {
            embeddedScripts.push(embedded)
            processedIds.add(rule.proxyId)
          }
        }
      }
    }

    // Check fallback for PAC script reference
    if (config.fallbackType === 'existing' && config.fallbackProxyId) {
      const proxy = allProxies.find((p) => p.id === config.fallbackProxyId)
      if (
        proxy &&
        PACScriptGenerator.isPACScriptProxy(proxy) &&
        !processedIds.has(config.fallbackProxyId)
      ) {
        const embedded = PACScriptGenerator.createEmbeddedPACScript(proxy, embeddedScripts.length)
        if (embedded) {
          embeddedScripts.push(embedded)
          processedIds.add(config.fallbackProxyId)
        }
      }
    }

    return embeddedScripts
  }

  /**
   * Check if a proxy config is a PAC script type
   */
  private static isPACScriptProxy(config: ProxyConfig): boolean {
    return config.mode === 'pac_script' && !!config.pacScript?.data
  }

  /**
   * Create an embedded PAC script from a ProxyConfig
   */
  private static createEmbeddedPACScript(
    config: ProxyConfig,
    index: number
  ): EmbeddedPACScript | null {
    if (!config.pacScript?.data || !config.id) {
      return null
    }

    const functionName = `_embeddedPAC_${index}`
    const extractedBody = PACScriptGenerator.extractPACScriptBody(config.pacScript.data)

    if (!extractedBody) {
      return null
    }

    // Wrap the extracted body in a new function
    const scriptBody = `// Embedded PAC script: ${config.name}
function ${functionName}(url, host) {
${extractedBody}
}`

    return {
      proxyId: config.id,
      functionName,
      scriptBody,
    }
  }

  /**
   * Extract the body of a FindProxyForURL function from a PAC script
   */
  private static extractPACScriptBody(pacScript: string): string | null {
    // Match the FindProxyForURL function and extract its body
    // Handles various formatting styles
    const functionRegex = /function\s+FindProxyForURL\s*\(\s*\w*\s*,?\s*\w*\s*\)\s*\{/i
    const match = pacScript.match(functionRegex)

    if (match?.index === undefined) {
      return null
    }

    const startIndex = match.index + match[0].length
    let braceCount = 1
    let endIndex = startIndex

    // Find the matching closing brace
    for (let i = startIndex; i < pacScript.length && braceCount > 0; i++) {
      if (pacScript[i] === '{') {
        braceCount++
      } else if (pacScript[i] === '}') {
        braceCount--
      }
      endIndex = i
    }

    if (braceCount !== 0) {
      return null
    }

    // Extract the body (excluding the final closing brace)
    const body = pacScript.substring(startIndex, endIndex).trim()

    // Indent each line for better formatting
    return body
      .split('\n')
      .map((line) => `  ${line}`)
      .join('\n')
  }

  /**
   * Generate a condition statement for a single rule
   */
  private static generateRuleCondition(
    rule: AutoProxyRule,
    allProxies: ProxyConfig[],
    embeddedScripts: EmbeddedPACScript[]
  ): string | null {
    const matchCondition = PACScriptGenerator.generateMatchCondition(rule.pattern, rule.matchType)
    if (!matchCondition) return null

    // Check if this rule uses an embedded PAC script
    if (rule.proxyType === 'existing' && rule.proxyId) {
      const embedded = embeddedScripts.find((es) => es.proxyId === rule.proxyId)
      if (embedded) {
        return `if (${matchCondition}) return ${embedded.functionName}(url, host);`
      }
    }

    // Standard proxy string
    const proxyString = PACScriptGenerator.getProxyString(
      rule.proxyType,
      rule.proxyId,
      rule.inlineProxy,
      allProxies
    )
    return `if (${matchCondition}) return "${proxyString}";`
  }

  /**
   * Generate the fallback statement
   */
  private static generateFallbackStatement(
    config: AutoProxyConfig,
    allProxies: ProxyConfig[],
    embeddedScripts: EmbeddedPACScript[]
  ): string {
    // Check if fallback uses an embedded PAC script
    if (config.fallbackType === 'existing' && config.fallbackProxyId) {
      const embedded = embeddedScripts.find((es) => es.proxyId === config.fallbackProxyId)
      if (embedded) {
        return `return ${embedded.functionName}(url, host);`
      }
    }

    // Standard fallback proxy string
    const fallbackProxy = PACScriptGenerator.getProxyString(
      config.fallbackType,
      config.fallbackProxyId,
      config.fallbackInlineProxy,
      allProxies
    )
    return `return "${fallbackProxy}";`
  }

  /**
   * Generate the match condition based on pattern type
   */
  private static generateMatchCondition(
    pattern: string,
    matchType: AutoProxyMatchType
  ): string | null {
    switch (matchType) {
      case 'wildcard':
        return PACScriptGenerator.generateWildcardCondition(pattern)
      case 'exact':
        return PACScriptGenerator.generateExactCondition(pattern)
      case 'regex':
        return PACScriptGenerator.generateRegexCondition(pattern)
      case 'cidr':
        return PACScriptGenerator.generateCIDRCondition(pattern)
      default:
        return null
    }
  }

  /**
   * Generate condition for wildcard patterns (e.g., *.google.com)
   */
  private static generateWildcardCondition(pattern: string): string {
    // Convert wildcard pattern to shExpMatch format
    // shExpMatch uses shell-style wildcards: * matches any characters, ? matches single char
    return `shExpMatch(host, "${pattern}")`
  }

  /**
   * Generate condition for exact hostname match
   */
  private static generateExactCondition(pattern: string): string {
    return `host === "${pattern}"`
  }

  /**
   * Generate condition for regex patterns
   */
  private static generateRegexCondition(pattern: string): string {
    // Escape the pattern for use in JavaScript regex constructor
    const escapedPattern = pattern.replaceAll('\\', '\\\\')
    return `new RegExp("${escapedPattern}").test(host)`
  }

  /**
   * Generate condition for CIDR IP range patterns
   */
  private static generateCIDRCondition(pattern: string): string {
    // Parse CIDR notation (e.g., 192.168.0.0/16)
    const [network, prefixLength] = pattern.split('/')
    if (!network || !prefixLength) {
      return 'false'
    }

    const prefix = Number.parseInt(prefixLength, 10)
    const mask = PACScriptGenerator.prefixToMask(prefix)

    return `isInNet(host, "${network}", "${mask}")`
  }

  /**
   * Convert CIDR prefix length to subnet mask
   */
  private static prefixToMask(prefix: number): string {
    if (prefix < 0 || prefix > 32) return '255.255.255.255'

    const mask = (0xffffffff << (32 - prefix)) >>> 0
    return [(mask >>> 24) & 0xff, (mask >>> 16) & 0xff, (mask >>> 8) & 0xff, mask & 0xff].join('.')
  }

  /**
   * Get the proxy string for a rule based on its type
   */
  private static getProxyString(
    proxyType: string,
    proxyId: string | undefined,
    inlineProxy: ProxyServer | undefined,
    allProxies: ProxyConfig[]
  ): string {
    switch (proxyType) {
      case 'direct':
        return 'DIRECT'

      case 'inline':
        if (inlineProxy) {
          return PACScriptGenerator.formatProxyServer(inlineProxy)
        }
        return 'DIRECT'

      case 'existing':
        if (proxyId) {
          const proxy = allProxies.find((p) => p.id === proxyId)
          if (proxy) {
            return PACScriptGenerator.getProxyStringFromConfig(proxy)
          }
        }
        return 'DIRECT' // Fallback if proxy not found

      default:
        return 'DIRECT'
    }
  }

  /**
   * Get proxy string from a ProxyConfig
   */
  private static getProxyStringFromConfig(config: ProxyConfig): string {
    if (config.mode === 'direct') {
      return 'DIRECT'
    }

    if (config.mode === 'fixed_servers' && config.rules) {
      // Prefer singleProxy, then proxyForHttp
      const server = config.rules.singleProxy || config.rules.proxyForHttp
      if (server) {
        return PACScriptGenerator.formatProxyServer(server)
      }
    }

    // For PAC script mode, we return DIRECT here since the actual handling
    // is done via embedded functions (this is a fallback for edge cases)
    if (config.mode === 'pac_script') {
      return 'DIRECT'
    }

    return 'DIRECT'
  }

  /**
   * Format a ProxyServer into PAC script format
   */
  private static formatProxyServer(server: ProxyServer): string {
    const scheme = server.scheme.toUpperCase()

    switch (scheme) {
      case 'SOCKS4':
        return `SOCKS ${server.host}:${server.port}`
      case 'SOCKS5':
        return `SOCKS5 ${server.host}:${server.port}`
      case 'HTTPS':
        return `HTTPS ${server.host}:${server.port}`
      default:
        return `PROXY ${server.host}:${server.port}`
    }
  }

  /**
   * Validate a pattern based on its type
   */
  static validatePattern(
    pattern: string,
    matchType: AutoProxyMatchType
  ): { valid: boolean; error?: string } {
    if (!pattern || pattern.trim() === '') {
      return { valid: false, error: 'Pattern cannot be empty' }
    }

    switch (matchType) {
      case 'wildcard':
        return PACScriptGenerator.validateWildcardPattern(pattern)
      case 'exact':
        return PACScriptGenerator.validateExactPattern(pattern)
      case 'regex':
        return PACScriptGenerator.validateRegexPattern(pattern)
      case 'cidr':
        return PACScriptGenerator.validateCIDRPattern(pattern)
      default:
        return { valid: false, error: 'Unknown pattern type' }
    }
  }

  private static validateWildcardPattern(pattern: string): { valid: boolean; error?: string } {
    // Wildcard patterns should contain valid hostname characters and wildcards
    if (!/^[\w.*?-]+$/.test(pattern)) {
      return { valid: false, error: 'Invalid characters in wildcard pattern' }
    }
    return { valid: true }
  }

  private static validateExactPattern(pattern: string): { valid: boolean; error?: string } {
    // Exact patterns should be valid hostnames
    if (!/^[\w.-]+$/.test(pattern)) {
      return { valid: false, error: 'Invalid hostname format' }
    }
    return { valid: true }
  }

  private static validateRegexPattern(pattern: string): { valid: boolean; error?: string } {
    try {
      new RegExp(pattern)
      return { valid: true }
    } catch {
      return { valid: false, error: 'Invalid regular expression' }
    }
  }

  private static validateCIDRPattern(pattern: string): { valid: boolean; error?: string } {
    const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/
    if (!cidrRegex.test(pattern)) {
      return { valid: false, error: 'Invalid CIDR notation (e.g., 192.168.0.0/16)' }
    }

    const [ip, prefix] = pattern.split('/')
    const prefixNum = Number.parseInt(prefix, 10)

    if (prefixNum < 0 || prefixNum > 32) {
      return { valid: false, error: 'CIDR prefix must be between 0 and 32' }
    }

    const octets = ip.split('.').map((o) => Number.parseInt(o, 10))
    if (octets.some((o) => o < 0 || o > 255)) {
      return { valid: false, error: 'Invalid IP address octets' }
    }

    return { valid: true }
  }

  /**
   * Test a URL against the rules and return match information
   */
  static testUrl(
    url: string,
    rules: AutoProxyRule[],
    allProxies: ProxyConfig[]
  ): {
    matched: boolean
    rule?: AutoProxyRule
    proxyResult: string
    isPACScript?: boolean
  } {
    // Extract host from URL
    let host: string
    try {
      const urlObj = new URL(url)
      host = urlObj.hostname
    } catch {
      // If URL parsing fails, treat the input as a hostname
      host = url
    }

    const enabledRules = rules.filter((r) => r.enabled).sort((a, b) => a.priority - b.priority)

    for (const rule of enabledRules) {
      if (PACScriptGenerator.matchesPattern(host, rule.pattern, rule.matchType)) {
        // Check if this is a PAC script reference
        if (rule.proxyType === 'existing' && rule.proxyId) {
          const proxy = allProxies.find((p) => p.id === rule.proxyId)
          if (proxy && PACScriptGenerator.isPACScriptProxy(proxy)) {
            return {
              matched: true,
              rule,
              proxyResult: `PAC Script: ${proxy.name}`,
              isPACScript: true,
            }
          }
        }

        return {
          matched: true,
          rule,
          proxyResult: PACScriptGenerator.getProxyString(
            rule.proxyType,
            rule.proxyId,
            rule.inlineProxy,
            allProxies
          ),
        }
      }
    }

    return {
      matched: false,
      proxyResult: 'DIRECT',
    }
  }

  /**
   * Check if a host matches a pattern
   */
  private static matchesPattern(
    host: string,
    pattern: string,
    matchType: AutoProxyMatchType
  ): boolean {
    switch (matchType) {
      case 'wildcard':
        return PACScriptGenerator.matchWildcard(host, pattern)
      case 'exact':
        return host === pattern
      case 'regex':
        try {
          return new RegExp(pattern).test(host)
        } catch {
          return false
        }
      case 'cidr':
        return PACScriptGenerator.matchCIDR(host, pattern)
      default:
        return false
    }
  }

  /**
   * Match a host against a wildcard pattern
   */
  private static matchWildcard(host: string, pattern: string): boolean {
    // Convert wildcard pattern to regex
    const regexPattern = pattern
      .replaceAll(/[.+^${}()|[\]\\]/g, String.raw`\$&`) // Escape special regex chars except * and ?
      .replaceAll('*', '.*') // Convert * to .*
      .replaceAll('?', '.') // Convert ? to .

    try {
      return new RegExp(`^${regexPattern}$`, 'i').test(host)
    } catch {
      return false
    }
  }

  /**
   * Match a host (IP) against a CIDR pattern
   */
  private static matchCIDR(host: string, pattern: string): boolean {
    // Check if host is an IP address
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!ipRegex.test(host)) {
      return false
    }

    const [network, prefixStr] = pattern.split('/')
    if (!network || !prefixStr) return false

    const prefix = Number.parseInt(prefixStr, 10)
    const mask = PACScriptGenerator.prefixToMask(prefix)

    // Convert IPs to numbers for comparison
    const hostParts = host.split('.').map((o) => Number.parseInt(o, 10))
    const networkParts = network.split('.').map((o) => Number.parseInt(o, 10))
    const maskParts = mask.split('.').map((o) => Number.parseInt(o, 10))

    // Check if host is in the network
    for (let i = 0; i < 4; i++) {
      if ((hostParts[i] & maskParts[i]) !== (networkParts[i] & maskParts[i])) {
        return false
      }
    }

    return true
  }
}

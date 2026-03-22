import type { SubscriptionFormat } from '@/interfaces/settings'

/**
 * Parsed result from a subscription rule list
 */
export interface ParsedSubscription {
  domains: string[] // Domain patterns to proxy (wildcard format)
  metadata?: {
    title?: string
    homepage?: string
    lastModified?: string
  }
}

/**
 * Parses remote rule list subscriptions in various formats
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Service class pattern
export class SubscriptionParser {
  private static readonly TITLE_REGEX = /^[!#]\s*Title:\s*(.+)/i
  private static readonly HOME_REGEX = /^[!#]\s*Homepage:\s*(.+)/i
  private static readonly MODIFIED_REGEX = /^[!#]\s*Last modified:\s*(.+)/i
  private static readonly PLAIN_DOMAIN_REGEX = /^\.?[\w][\w.-]*\.\w{2,}$/

  /**
   * Fetch and parse a subscription URL
   */
  static async fetchAndParse(url: string, format: SubscriptionFormat): Promise<ParsedSubscription> {
    // Use a non-browser User-Agent to avoid bot protection systems (e.g., Anubis)
    // that challenge requests with "Mozilla" in the UA string.
    // This is the same approach used by curl, wget, and package managers.
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
      headers: { 'User-Agent': 'PACify/1.31' },
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch subscription: HTTP ${response.status}`)
    }

    const rawText = await response.text()

    // Detect HTML responses (e.g., from proxy login pages, firewalls, bot challenges)
    const trimmedStart = rawText.trimStart().slice(0, 200).toLowerCase()
    if (trimmedStart.startsWith('<!doctype') || trimmedStart.startsWith('<html')) {
      // Check specifically for Anubis bot protection
      if (rawText.includes('anubis') || rawText.includes('not a bot')) {
        throw new Error(
          'This server uses bot protection (Anubis) that blocks automated requests. ' +
            'Try using a mirror URL, or paste the rule list content directly.'
        )
      }
      throw new Error(
        'The URL returned an HTML page instead of a rule list. Check the URL or your network connection.'
      )
    }

    return SubscriptionParser.parse(rawText, format)
  }

  /**
   * Parse raw text content based on format
   */
  static parse(rawText: string, format: SubscriptionFormat): ParsedSubscription {
    // Try to decode base64 if it looks encoded
    const text = SubscriptionParser.tryDecodeBase64(rawText)

    const detectedFormat = format === 'auto' ? SubscriptionParser.detectFormat(text) : format

    switch (detectedFormat) {
      case 'abp':
        return SubscriptionParser.parseABP(text)
      case 'surge':
        return SubscriptionParser.parseSurge(text)
      case 'clash':
        return SubscriptionParser.parseClash(text)
      case 'domains':
        return SubscriptionParser.parseDomainList(text)
      default:
        return SubscriptionParser.parseDomainList(text)
    }
  }

  /**
   * Try to decode base64-encoded content (like gfwlist)
   */
  private static tryDecodeBase64(text: string): string {
    const trimmed = text.trim()

    // Quick check: if it contains newlines with typical text markers, it's not base64
    if (
      trimmed.includes('\n') &&
      (trimmed.startsWith('[') ||
        trimmed.startsWith('!') ||
        trimmed.startsWith('#') ||
        trimmed.startsWith('||'))
    ) {
      return trimmed
    }

    // Check if it looks like base64 (only valid base64 chars, no newlines in content, reasonable length)
    const stripped = trimmed.replaceAll(/\s/g, '')
    if (/^[A-Za-z0-9+/]+=*$/.test(stripped) && stripped.length > 40) {
      try {
        const decoded = atob(stripped)
        // Verify the decoded content is readable text
        if (/^[\x20-\x7E\n\r\t]/.test(decoded)) {
          return decoded
        }
      } catch {
        // Not valid base64, return original
      }
    }

    return trimmed
  }

  /**
   * Auto-detect the format of a rule list
   */
  private static detectFormat(text: string): 'abp' | 'domains' | 'surge' | 'clash' {
    const lines = text.split('\n').slice(0, 30) // Check first 30 lines

    // ABP format markers
    if (lines.some((l) => l.startsWith('[Adblock') || l.startsWith('[AutoProxy'))) {
      return 'abp'
    }

    // ABP-style rules
    if (lines.some((l) => l.startsWith('||') || l.startsWith('@@') || l.startsWith('!'))) {
      return 'abp'
    }

    // Clash format: YAML-style payload list
    if (lines.some((l) => l.trimStart().startsWith('payload:'))) {
      return 'clash'
    }

    // Clash-style entries (- 'domain' or - DOMAIN,domain)
    if (
      lines.some((l) => {
        const t = l.trim()
        return t.startsWith("- '") || t.startsWith('- "') || t.startsWith('- DOMAIN')
      })
    ) {
      return 'clash'
    }

    // Surge format markers
    if (
      lines.some((l) => {
        const t = l.trim()
        return (
          t.startsWith('DOMAIN,') ||
          t.startsWith('DOMAIN-SUFFIX,') ||
          t.startsWith('DOMAIN-KEYWORD,') ||
          t.startsWith('[Rule]')
        )
      })
    ) {
      return 'surge'
    }

    return 'domains'
  }

  /**
   * Parse ABP (Adblock Plus) / AutoProxy filter format
   *
   * Supported rule types:
   * - ||domain.com  -> block domain and all subdomains
   * - |https://url  -> URL prefix match (converted to domain)
   * - @@||domain    -> exception/whitelist (skipped - we only extract proxy rules)
   * - /regex/       -> regex rules (skipped - too complex for domain lists)
   * - ! comment     -> comments (skipped)
   * - [header]      -> section headers (skipped)
   * - domain.com    -> plain domain entries
   */
  private static parseABP(text: string): ParsedSubscription {
    const lines = text.split('\n')
    const domains: string[] = []
    const metadata: ParsedSubscription['metadata'] = {}
    const seen = new Set<string>()

    for (const rawLine of lines) {
      const line = rawLine.trim()

      // Skip empty lines
      if (!line) continue

      // Parse metadata from comments
      if (line.startsWith('!') || line.startsWith('#')) {
        const titleMatch = line.match(SubscriptionParser.TITLE_REGEX)
        if (titleMatch) metadata.title = titleMatch[1].trim().slice(0, 200)

        const homeMatch = line.match(SubscriptionParser.HOME_REGEX)
        if (homeMatch) metadata.homepage = homeMatch[1].trim().slice(0, 500)

        const modifiedMatch = line.match(SubscriptionParser.MODIFIED_REGEX)
        if (modifiedMatch) metadata.lastModified = modifiedMatch[1].trim().slice(0, 100)

        continue
      }

      // Skip section headers
      if (line.startsWith('[')) continue

      // Skip exception/whitelist rules
      if (line.startsWith('@@')) continue

      // Skip regex rules (too complex to convert to domain patterns reliably)
      if (line.startsWith('/') && line.endsWith('/')) continue

      // Skip rules with advanced modifiers we can't handle
      if (line.includes('$') && !line.startsWith('||')) continue

      let domain: string | null = null

      // ||domain.com^ or ||domain.com
      if (line.startsWith('||')) {
        domain = line
          .slice(2)
          .replace(/\^.*$/, '') // Remove ^ and everything after
          .replace(/\/.*$/, '') // Remove path
          .replace(/\$.*$/, '') // Remove modifiers
          .trim()
      }
      // |https://domain.com or |http://domain.com
      else if (line.startsWith('|') && !line.startsWith('||')) {
        try {
          const urlPart = line.slice(1).replace(/\$.*$/, '').trim()
          const url = new URL(urlPart)
          domain = url.hostname
        } catch {
          // Not a valid URL, try as domain
          domain = line.slice(1).replace(/\^.*$/, '').replace(/\/.*$/, '').trim()
        }
      }
      // .domain.com or domain.com (plain domain entries common in some lists)
      else if (SubscriptionParser.PLAIN_DOMAIN_REGEX.test(line)) {
        domain = line.startsWith('.') ? line.slice(1) : line
      }

      if (domain && SubscriptionParser.isValidDomain(domain) && !seen.has(domain)) {
        seen.add(domain)
        domains.push(domain)
      }
    }

    return { domains, metadata }
  }

  /**
   * Parse a plain domain list (one domain per line)
   */
  private static parseDomainList(text: string): ParsedSubscription {
    const lines = text.split('\n')
    const domains: string[] = []
    const seen = new Set<string>()

    for (const rawLine of lines) {
      const line = rawLine.trim()

      // Skip empty lines and comments
      if (!line || line.startsWith('#') || line.startsWith('!') || line.startsWith('//')) {
        continue
      }

      // Handle hosts-file format (IP address followed by domain)
      let domain = line
      const hostsMatch = line.match(/^\d{1,3}(?:\.\d{1,3}){3}\s+(.+)/)
      if (hostsMatch) {
        domain = hostsMatch[1].trim()
      }

      // Remove leading dot
      if (domain.startsWith('.')) {
        domain = domain.slice(1)
      }

      // Remove trailing dot
      if (domain.endsWith('.')) {
        domain = domain.slice(0, -1)
      }

      if (domain && SubscriptionParser.isValidDomain(domain) && !seen.has(domain)) {
        seen.add(domain)
        domains.push(domain)
      }
    }

    return { domains }
  }

  /**
   * Parse Surge-style rule list
   *
   * Supported rule types:
   * - DOMAIN,example.com       -> exact domain
   * - DOMAIN-SUFFIX,example.com -> domain suffix (acts like wildcard)
   * - DOMAIN-KEYWORD,example    -> keyword (skipped - not a domain)
   * - IP-CIDR,1.2.3.0/24       -> IP range (skipped)
   * - [Rule], [Header], etc.   -> section headers (skipped)
   * - # or // comments         -> skipped
   */
  private static parseSurge(text: string): ParsedSubscription {
    const lines = text.split('\n')
    const domains: string[] = []
    const seen = new Set<string>()

    for (const rawLine of lines) {
      const line = rawLine.trim()

      if (!line || line.startsWith('#') || line.startsWith('//') || line.startsWith('[')) continue

      const domain = SubscriptionParser.extractSurgeRuleDomain(line)

      if (domain && SubscriptionParser.isValidDomain(domain) && !seen.has(domain)) {
        seen.add(domain)
        domains.push(domain)
      }
    }

    return { domains }
  }

  /**
   * Parse Clash-style rule list (YAML payload format)
   *
   * Supported formats:
   * - payload:
   *   - DOMAIN,example.com
   *   - DOMAIN-SUFFIX,example.com
   *   - '+.example.com'          -> domain suffix shorthand
   *   - '.example.com'           -> domain suffix shorthand
   *   - 'example.com'            -> exact domain
   */
  private static parseClash(text: string): ParsedSubscription {
    const lines = text.split('\n')
    const domains: string[] = []
    const seen = new Set<string>()

    for (const rawLine of lines) {
      const line = rawLine.trim()

      if (!line || line === 'payload:' || line.startsWith('#')) continue

      // Strip YAML list prefix
      let entry = line
      if (entry.startsWith('- ')) {
        entry = entry.slice(2).trim()
      }

      // Strip surrounding quotes
      if (
        (entry.startsWith("'") && entry.endsWith("'")) ||
        (entry.startsWith('"') && entry.endsWith('"'))
      ) {
        entry = entry.slice(1, -1)
      }

      let domain: string | null = null

      // Clash-specific shorthand: +.example.com or .example.com
      if (entry.startsWith('+.')) {
        domain = entry.slice(2)
      } else if (entry.startsWith('.')) {
        domain = entry.slice(1)
      }
      // Surge-style entries within Clash lists
      else if (entry.startsWith('DOMAIN,') || entry.startsWith('DOMAIN-SUFFIX,')) {
        domain = SubscriptionParser.extractSurgeRuleDomain(entry)
      }
      // Plain domain entry
      else if (/^[\w][\w.-]*\.\w{2,}$/.test(entry)) {
        domain = entry
      }

      if (domain && SubscriptionParser.isValidDomain(domain) && !seen.has(domain)) {
        seen.add(domain)
        domains.push(domain)
      }
    }

    return { domains }
  }

  /**
   * Extract domain from a Surge-style rule line (DOMAIN, or DOMAIN-SUFFIX,).
   * Shared between Surge and Clash parsers.
   */
  private static extractSurgeRuleDomain(entry: string): string | null {
    if (entry.startsWith('DOMAIN,')) {
      return entry.slice('DOMAIN,'.length).split(',')[0].trim()
    }
    if (entry.startsWith('DOMAIN-SUFFIX,')) {
      return entry.slice('DOMAIN-SUFFIX,'.length).split(',')[0].trim()
    }
    return null
  }

  /**
   * Validate a domain string
   */
  private static isValidDomain(domain: string): boolean {
    // Basic domain validation
    if (domain.length === 0 || domain.length > 253) return false
    if (domain.includes(' ') || domain.includes('\t')) return false
    // Reject characters that could enable JS injection when interpolated into PAC scripts
    if (/["'\\<>`]/.test(domain)) return false
    // Must contain at least one dot and only valid chars
    return /^[\w][\w.-]*\.\w{2,}$/.test(domain)
  }

  /**
   * Convert parsed domains to wildcard patterns for PAC script generation
   * Each domain gets a wildcard prefix to match subdomains
   */
  static domainsToWildcardPatterns(domains: string[]): string[] {
    return domains.map((domain) => `*.${domain}`)
  }
}

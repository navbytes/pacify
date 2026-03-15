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
  /**
   * Fetch and parse a subscription URL
   */
  static async fetchAndParse(url: string, format: SubscriptionFormat): Promise<ParsedSubscription> {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch subscription: HTTP ${response.status}`)
    }

    const rawText = await response.text()
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
  private static detectFormat(text: string): 'abp' | 'domains' {
    const lines = text.split('\n').slice(0, 20) // Check first 20 lines

    // ABP format markers
    if (lines.some((l) => l.startsWith('[Adblock') || l.startsWith('[AutoProxy'))) {
      return 'abp'
    }

    // ABP-style rules
    if (lines.some((l) => l.startsWith('||') || l.startsWith('@@') || l.startsWith('!'))) {
      return 'abp'
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
        const titleMatch = line.match(/^[!#]\s*Title:\s*(.+)/i)
        if (titleMatch) metadata.title = titleMatch[1].trim()

        const homeMatch = line.match(/^[!#]\s*Homepage:\s*(.+)/i)
        if (homeMatch) metadata.homepage = homeMatch[1].trim()

        const modifiedMatch = line.match(/^[!#]\s*Last modified:\s*(.+)/i)
        if (modifiedMatch) metadata.lastModified = modifiedMatch[1].trim()

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
      else if (/^\.?[\w][\w.-]*\.\w{2,}$/.test(line)) {
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
   * Validate a domain string
   */
  private static isValidDomain(domain: string): boolean {
    // Basic domain validation
    if (domain.length === 0 || domain.length > 253) return false
    if (domain.includes(' ') || domain.includes('\t')) return false
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

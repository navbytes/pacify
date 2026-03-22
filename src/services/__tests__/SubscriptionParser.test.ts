import { describe, expect, test } from 'bun:test'
import { SubscriptionParser } from '../SubscriptionParser'

describe('SubscriptionParser', () => {
  describe('parse ABP format', () => {
    test('parses basic ABP rules with || prefix', () => {
      const text = `[AutoProxy 0.2.9]
! Title: Test List
! Homepage: https://example.com
||google.com
||facebook.com^
||twitter.com^|
`
      const result = SubscriptionParser.parse(text, 'abp')

      expect(result.domains).toContain('google.com')
      expect(result.domains).toContain('facebook.com')
      expect(result.domains).toContain('twitter.com')
      expect(result.metadata?.title).toBe('Test List')
      expect(result.metadata?.homepage).toBe('https://example.com')
    })

    test('skips comments and section headers', () => {
      const text = `[Adblock Plus 2.0]
! This is a comment
# Another comment
||valid.com
`
      const result = SubscriptionParser.parse(text, 'abp')

      expect(result.domains).toEqual(['valid.com'])
    })

    test('skips exception/whitelist rules', () => {
      const text = `||blocked.com
@@||allowed.com
||also-blocked.com
`
      const result = SubscriptionParser.parse(text, 'abp')

      expect(result.domains).toContain('blocked.com')
      expect(result.domains).toContain('also-blocked.com')
      expect(result.domains).not.toContain('allowed.com')
    })

    test('skips regex rules', () => {
      const text = `||valid.com
/^https?://.*.evil.com/
||also-valid.com
`
      const result = SubscriptionParser.parse(text, 'abp')

      expect(result.domains).toEqual(['valid.com', 'also-valid.com'])
    })

    test('handles URL prefix rules with |', () => {
      const text = `|https://blocked.example.com/path
||simple.com
`
      const result = SubscriptionParser.parse(text, 'abp')

      expect(result.domains).toContain('blocked.example.com')
      expect(result.domains).toContain('simple.com')
    })

    test('handles plain domain entries', () => {
      const text = `! comment
example.com
.subdomain.test.org
||explicit.com
`
      const result = SubscriptionParser.parse(text, 'abp')

      expect(result.domains).toContain('example.com')
      expect(result.domains).toContain('subdomain.test.org')
      expect(result.domains).toContain('explicit.com')
    })

    test('strips modifiers after $', () => {
      const text = `||domain.com^$third-party
||other.com$image
`
      const result = SubscriptionParser.parse(text, 'abp')

      expect(result.domains).toContain('domain.com')
      expect(result.domains).toContain('other.com')
    })

    test('deduplicates domains', () => {
      const text = `||duplicate.com
||duplicate.com
||duplicate.com^
`
      const result = SubscriptionParser.parse(text, 'abp')

      expect(result.domains.filter((d) => d === 'duplicate.com')).toHaveLength(1)
    })
  })

  describe('parse domain list format', () => {
    test('parses simple domain list', () => {
      const text = `example.com
google.com
facebook.com
`
      const result = SubscriptionParser.parse(text, 'domains')

      expect(result.domains).toEqual(['example.com', 'google.com', 'facebook.com'])
    })

    test('skips comments and empty lines', () => {
      const text = `# Comment
example.com

! Another comment
// JS-style comment
google.com
`
      const result = SubscriptionParser.parse(text, 'domains')

      expect(result.domains).toEqual(['example.com', 'google.com'])
    })

    test('handles hosts file format', () => {
      const text = `127.0.0.1 ad.example.com
0.0.0.0 tracker.example.com
example.com
`
      const result = SubscriptionParser.parse(text, 'domains')

      expect(result.domains).toContain('ad.example.com')
      expect(result.domains).toContain('tracker.example.com')
      expect(result.domains).toContain('example.com')
    })

    test('strips leading and trailing dots', () => {
      const text = `.example.com
google.com.
`
      const result = SubscriptionParser.parse(text, 'domains')

      expect(result.domains).toContain('example.com')
      expect(result.domains).toContain('google.com')
    })

    test('rejects invalid domains', () => {
      const text = `valid.com
not valid
a
127.0.0.1
`
      const result = SubscriptionParser.parse(text, 'domains')

      expect(result.domains).toEqual(['valid.com'])
    })
  })

  describe('auto format detection', () => {
    test('detects ABP format from header', () => {
      const text = `[Adblock Plus 2.0]
||example.com
`
      const result = SubscriptionParser.parse(text, 'auto')

      expect(result.domains).toContain('example.com')
    })

    test('detects ABP format from || prefix', () => {
      const text = `! Title: My List
||example.com
||google.com
`
      const result = SubscriptionParser.parse(text, 'auto')

      expect(result.domains).toContain('example.com')
      expect(result.domains).toContain('google.com')
    })

    test('falls back to domain list format', () => {
      const text = `example.com
google.com
`
      const result = SubscriptionParser.parse(text, 'auto')

      expect(result.domains).toEqual(['example.com', 'google.com'])
    })
  })

  describe('base64 decoding', () => {
    test('decodes base64-encoded content', () => {
      const original = `[AutoProxy 0.2.9]
||example.com
||google.com
`
      const encoded = btoa(original)
      const result = SubscriptionParser.parse(encoded, 'auto')

      expect(result.domains).toContain('example.com')
      expect(result.domains).toContain('google.com')
    })

    test('handles non-base64 content gracefully', () => {
      const text = `||example.com
||google.com
`
      const result = SubscriptionParser.parse(text, 'auto')

      expect(result.domains).toContain('example.com')
      expect(result.domains).toContain('google.com')
    })
  })

  describe('parse Surge format', () => {
    test('parses DOMAIN and DOMAIN-SUFFIX rules', () => {
      const text = `[Rule]
DOMAIN,google.com
DOMAIN-SUFFIX,youtube.com
DOMAIN-KEYWORD,facebook
IP-CIDR,91.108.0.0/16,Proxy
FINAL,DIRECT
`
      const result = SubscriptionParser.parse(text, 'surge')

      expect(result.domains).toContain('google.com')
      expect(result.domains).toContain('youtube.com')
      expect(result.domains).not.toContain('facebook')
      expect(result.domains).toHaveLength(2)
    })

    test('handles rules with policy group suffix', () => {
      const text = `DOMAIN,api.example.com,Proxy
DOMAIN-SUFFIX,cdn.example.com,DIRECT
`
      const result = SubscriptionParser.parse(text, 'surge')

      expect(result.domains).toContain('api.example.com')
      expect(result.domains).toContain('cdn.example.com')
    })

    test('skips comments and section headers', () => {
      const text = `# Proxy rules
[Rule]
// Another comment
DOMAIN,valid.com
`
      const result = SubscriptionParser.parse(text, 'surge')

      expect(result.domains).toEqual(['valid.com'])
    })

    test('deduplicates domains', () => {
      const text = `DOMAIN,dup.com
DOMAIN-SUFFIX,dup.com
`
      const result = SubscriptionParser.parse(text, 'surge')

      expect(result.domains).toEqual(['dup.com'])
    })
  })

  describe('parse Clash format', () => {
    test('parses YAML payload with quoted domains', () => {
      const text = `payload:
  - '+.google.com'
  - '.youtube.com'
  - 'twitter.com'
`
      const result = SubscriptionParser.parse(text, 'clash')

      expect(result.domains).toContain('google.com')
      expect(result.domains).toContain('youtube.com')
      expect(result.domains).toContain('twitter.com')
    })

    test('parses DOMAIN and DOMAIN-SUFFIX entries', () => {
      const text = `payload:
  - DOMAIN,api.example.com
  - DOMAIN-SUFFIX,cdn.example.com
`
      const result = SubscriptionParser.parse(text, 'clash')

      expect(result.domains).toContain('api.example.com')
      expect(result.domains).toContain('cdn.example.com')
    })

    test('handles double-quoted entries', () => {
      const text = `payload:
  - "+.example.com"
  - "test.org"
`
      const result = SubscriptionParser.parse(text, 'clash')

      expect(result.domains).toContain('example.com')
      expect(result.domains).toContain('test.org')
    })

    test('skips invalid entries and comments', () => {
      const text = `# Rule provider
payload:
  - '+.valid.com'
  - 'not a domain!'
  - DOMAIN-KEYWORD,partial
`
      const result = SubscriptionParser.parse(text, 'clash')

      expect(result.domains).toEqual(['valid.com'])
    })

    test('deduplicates domains', () => {
      const text = `payload:
  - '+.dup.com'
  - DOMAIN-SUFFIX,dup.com
`
      const result = SubscriptionParser.parse(text, 'clash')

      expect(result.domains).toEqual(['dup.com'])
    })
  })

  describe('auto format detection', () => {
    test('detects Surge format', () => {
      const text = `DOMAIN,google.com
DOMAIN-SUFFIX,youtube.com
`
      const result = SubscriptionParser.parse(text, 'auto')

      expect(result.domains).toContain('google.com')
      expect(result.domains).toContain('youtube.com')
    })

    test('detects Clash format from payload header', () => {
      const text = `payload:
  - '+.google.com'
  - '+.youtube.com'
`
      const result = SubscriptionParser.parse(text, 'auto')

      expect(result.domains).toContain('google.com')
      expect(result.domains).toContain('youtube.com')
    })

    test('detects Clash format from list entries', () => {
      const text = `- '+.google.com'
- DOMAIN,youtube.com
`
      const result = SubscriptionParser.parse(text, 'auto')

      expect(result.domains).toContain('google.com')
      expect(result.domains).toContain('youtube.com')
    })
  })

  describe('domainsToWildcardPatterns', () => {
    test('converts domains to wildcard patterns', () => {
      const domains = ['example.com', 'google.com']
      const patterns = SubscriptionParser.domainsToWildcardPatterns(domains)

      expect(patterns).toEqual(['*.example.com', '*.google.com'])
    })

    test('handles empty array', () => {
      expect(SubscriptionParser.domainsToWildcardPatterns([])).toEqual([])
    })
  })
})

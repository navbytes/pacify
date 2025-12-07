# PACify Enhancement Roadmap

Comprehensive plan for implementing enhancements to the PACify Chrome extension, organized into manageable phases with clear priorities and security considerations.

**Document Version**: 1.0
**Created**: 2024-11-13
**Status**: Planning

---

## Table of Contents
- [Overview](#overview)
- [Security Principles](#security-principles)
- [Phase 1: Foundation & Testing](#phase-1-foundation--testing)
- [Phase 2: User Experience](#phase-2-user-experience)
- [Phase 3: Smart Features](#phase-3-smart-features)
- [Phase 4: Advanced Automation](#phase-4-advanced-automation)
- [Phase 5: Enterprise & Power Users](#phase-5-enterprise--power-users)
- [Implementation Guidelines](#implementation-guidelines)
- [Success Metrics](#success-metrics)

---

## Overview

### Goals
1. Improve proxy reliability and user confidence
2. Reduce manual proxy management effort
3. Enhance developer experience for PAC scripts
4. Maintain security and privacy standards
5. Keep extension lightweight and performant

### Principles
- **Security First**: No `eval()`, minimal permissions, privacy-focused
- **Progressive Enhancement**: Each phase adds value independently
- **Backward Compatibility**: Don't break existing features
- **Performance**: Keep bundle size < 600KB, maintain fast startup
- **User Choice**: Features are opt-in, sensible defaults

---

## Security Principles

### Non-Negotiable Security Requirements

1. **No Code Evaluation**
   - ❌ No `eval()`
   - ❌ No `new Function()` with user input
   - ❌ No `setTimeout(string)`
   - ✅ Web Workers for PAC testing (isolated context)
   - ✅ Chrome's built-in PAC validator

2. **Minimal Permissions**
   - Current: `proxy`, `storage`
   - Future additions must be justified
   - User must understand why permission is needed

3. **Data Privacy**
   - All data stays local (Chrome Sync Storage)
   - No external analytics or tracking
   - No network requests except for user-initiated tests
   - Encrypt sensitive data (proxy credentials)

4. **Input Validation**
   - Validate all user inputs
   - Sanitize before storage
   - Type checking with TypeScript
   - CSP compliance

---

## Phase 1: Foundation & Testing

**Timeline**: 2-3 weeks
**Priority**: 🔥 Critical
**Dependencies**: None

### Objectives
- Build reliability and user confidence
- Establish testing infrastructure
- Improve error handling

### Features

#### 1.1 Proxy Connection Testing ⭐⭐⭐⭐⭐
**Effort**: Medium | **Value**: Very High

```typescript
// New interface
interface ProxyTestResult {
  success: boolean
  responseTime?: number
  statusCode?: number
  error?: string
  testedAt: Date
  testUrl: string
}

// Extend ProxyConfig
interface ProxyConfig {
  // ... existing fields
  lastTestResult?: ProxyTestResult
  autoTest?: boolean  // Test on save
}
```

**Implementation**:
- Create `ProxyTestService.ts`
- Add "Test Connection" button to proxy cards
- Show test status with visual indicators:
  - 🟢 Green: Success (< 2s response)
  - 🟡 Yellow: Slow (2-5s response)
  - 🔴 Red: Failed
  - ⚪ Gray: Not tested
- Add settings for test URL (default: `https://www.google.com/generate_204`)
- Auto-test on save (optional setting)

**Security**: Uses native `fetch()` + Chrome proxy API, no eval()

**Files to Create/Modify**:
- `src/services/ProxyTestService.ts` (new)
- `src/interfaces/settings.ts` (extend ProxyConfig)
- `src/components/ScriptItem.svelte` (add test button)
- `src/constants/app.ts` (add test URL constant)

---

#### 1.2 Enhanced Error Handling & User Feedback ⭐⭐⭐⭐
**Effort**: Small | **Value**: High

**Features**:
- Better error messages with actionable advice
- Loading states for all async operations
- Success/failure animations
- Retry mechanism for failed operations

**Implementation**:
```typescript
// Enhanced error types
interface UserFacingError {
  title: string
  message: string
  suggestions: string[]
  recoverable: boolean
  retryAction?: () => Promise<void>
}

// Error catalog
const ERROR_CATALOG = {
  PROXY_CONNECTION_FAILED: {
    title: 'Proxy Connection Failed',
    message: 'Could not connect through the proxy server',
    suggestions: [
      'Check if proxy server is running',
      'Verify host and port are correct',
      'Try testing the connection',
      'Check your internet connection'
    ]
  },
  // ... more errors
}
```

**Files to Create/Modify**:
- `src/utils/errorCatalog.ts` (new)
- `src/components/Toast.svelte` (enhance with suggestions)
- `src/components/common/LoadingSpinner.svelte` (add to async operations)

---

#### 1.3 PAC Script Validation (Safe) ⭐⭐⭐⭐
**Effort**: Medium | **Value**: High

**Features**:
- Static syntax analysis (no execution)
- Security pattern detection
- Common mistake warnings
- Real-time validation in editor

**Implementation**:
```typescript
// services/PACScriptAnalyzer.ts
export class PACScriptAnalyzer {
  static analyze(script: string): PACAnalysisResult {
    return {
      syntax: this.checkSyntax(script),
      security: this.checkSecurity(script),
      warnings: this.checkCommonMistakes(script)
    }
  }

  private static checkSecurity(script: string): SecurityIssue[] {
    const issues: SecurityIssue[] = []

    // Dangerous patterns
    const dangerousPatterns = [
      { pattern: /eval\s*\(/g, severity: 'critical', message: 'Uses eval() - security risk' },
      { pattern: /new\s+Function\s*\(/g, severity: 'critical', message: 'Uses Function() constructor' },
      { pattern: /document\./g, severity: 'warning', message: 'Attempts to access document (PAC has no DOM)' },
      { pattern: /XMLHttpRequest|fetch\(/g, severity: 'warning', message: 'Network requests not allowed in PAC' }
    ]

    dangerousPatterns.forEach(({ pattern, severity, message }) => {
      if (pattern.test(script)) {
        issues.push({ severity, message })
      }
    })

    return issues
  }
}
```

**Security**: Pure static analysis, no code execution

**Files to Create/Modify**:
- `src/services/PACScriptAnalyzer.ts` (new)
- `src/components/ProxyConfig/PACScriptSettings.svelte` (add validation UI)
- `src/interfaces/settings.ts` (add validation result types)

---

#### 1.4 Proxy Validation Before Save ⭐⭐⭐
**Effort**: Small | **Value**: Medium

**Features**:
- Validate host format (domain/IP)
- Validate port range (1-65535)
- Check for duplicate proxies
- Warn about suspicious configurations

**Implementation**:
```typescript
// utils/proxyValidation.ts
export class ProxyValidator {
  static validateProxyConfig(config: ProxyConfig): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Name validation
    if (!config.name.trim()) {
      errors.push('Proxy name is required')
    }

    // Mode-specific validation
    if (config.mode === 'fixed_servers' && config.rules) {
      this.validateProxyRules(config.rules, errors, warnings)
    }

    if (config.mode === 'pac_script' && config.pacScript) {
      this.validatePACScript(config.pacScript, errors, warnings)
    }

    return { valid: errors.length === 0, errors, warnings }
  }

  private static validateProxyRules(rules: ProxyRules, errors: string[], warnings: string[]) {
    // Validate each proxy server
    Object.entries(rules).forEach(([key, server]) => {
      if (server && key !== 'bypassList') {
        this.validateProxyServer(server as ProxyServer, errors, warnings)
      }
    })
  }

  private static validateProxyServer(server: ProxyServer, errors: string[], warnings: string[]) {
    // Port validation
    const port = parseInt(server.port)
    if (isNaN(port) || port < 1 || port > 65535) {
      errors.push(`Invalid port: ${server.port}. Must be between 1-65535`)
    }

    // Common ports warning
    if (port === 80 || port === 443) {
      warnings.push(`Port ${port} is typically used for web traffic, not proxies`)
    }

    // Host validation
    if (!this.isValidHost(server.host)) {
      errors.push(`Invalid host: ${server.host}`)
    }
  }

  private static isValidHost(host: string): boolean {
    // Check if valid domain or IP
    const domainPattern = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/

    return domainPattern.test(host) || ipPattern.test(host)
  }
}
```

**Files to Create/Modify**:
- `src/utils/proxyValidation.ts` (new)
- `src/components/ProxyConfig/ProxyConfigModal.svelte` (add validation on save)

---

### Phase 1 Summary

**Deliverables**:
- ✅ Safe proxy connection testing
- ✅ PAC script static analysis
- ✅ Enhanced error messages
- ✅ Input validation
- ✅ Better loading states

**Success Criteria**:
- Users can test proxies before using them
- PAC scripts show security warnings
- Error messages are helpful and actionable
- Invalid configs are caught before save

**Bundle Size Impact**: +20-30KB (acceptable)

---

## Phase 2: User Experience

**Timeline**: 3-4 weeks
**Priority**: 🔥 High
**Dependencies**: Phase 1 complete

### Objectives
- Reduce friction in proxy management
- Improve organization and discoverability
- Enhance visual feedback

### Features

#### 2.1 Proxy Usage Statistics ⭐⭐⭐⭐⭐
**Effort**: Medium | **Value**: Very High

```typescript
// New interface
interface ProxyStats {
  proxyId: string
  activationCount: number
  totalActiveTime: number  // milliseconds
  lastUsed: Date | null
  firstUsed: Date | null
  averageSessionDuration: number
}

// Add to AppSettings
interface AppSettings {
  // ... existing
  proxyStats: Record<string, ProxyStats>
  statsEnabled: boolean  // opt-in
}
```

**Features**:
- Track proxy usage (local only, no external tracking)
- Show in proxy card:
  - Last used: "2 hours ago"
  - Usage count: "Used 15 times"
  - Total time: "Active for 3h 24m"
- Statistics dashboard in Settings tab
- Suggest removing unused proxies
- Export stats as JSON

**Privacy**:
- All stats stored locally
- No external tracking
- Can be disabled
- Clear stats option

**Implementation**:
```typescript
// services/ProxyStatsService.ts
export class ProxyStatsService {
  private static activeProxy: {
    id: string
    startTime: number
  } | null = null

  static async recordActivation(proxyId: string) {
    const settings = await StorageService.getSettings()

    if (!settings.statsEnabled) return

    const stats = settings.proxyStats[proxyId] || {
      proxyId,
      activationCount: 0,
      totalActiveTime: 0,
      lastUsed: null,
      firstUsed: null,
      averageSessionDuration: 0
    }

    stats.activationCount++
    stats.lastUsed = new Date()
    stats.firstUsed = stats.firstUsed || new Date()

    // Track active time
    this.activeProxy = { id: proxyId, startTime: Date.now() }

    settings.proxyStats[proxyId] = stats
    await StorageService.saveSettings(settings)
  }

  static async recordDeactivation() {
    if (!this.activeProxy) return

    const settings = await StorageService.getSettings()
    if (!settings.statsEnabled) return

    const duration = Date.now() - this.activeProxy.startTime
    const stats = settings.proxyStats[this.activeProxy.id]

    if (stats) {
      stats.totalActiveTime += duration
      stats.averageSessionDuration =
        stats.totalActiveTime / stats.activationCount
    }

    this.activeProxy = null
    await StorageService.saveSettings(settings)
  }

  static formatDuration(ms: number): string {
    const hours = Math.floor(ms / 3600000)
    const minutes = Math.floor((ms % 3600000) / 60000)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }
}
```

**Files to Create/Modify**:
- `src/services/ProxyStatsService.ts` (new)
- `src/interfaces/settings.ts` (add ProxyStats)
- `src/components/ScriptItem.svelte` (display stats)
- `src/options/SettingsTab.svelte` (add stats dashboard)
- `src/stores/settingsStore.ts` (integrate stats tracking)

---

#### 2.2 Proxy Search & Filter ⭐⭐⭐⭐
**Effort**: Small | **Value**: High

**Features**:
- Search box in popup and options
- Filter by:
  - Name
  - Mode (PAC, Manual, etc.)
  - Color
  - Quick Switch enabled
  - Status (active, tested, etc.)
- Keyboard navigation
- Recent searches

**Implementation**:
```svelte
<!-- components/ProxySearch.svelte -->
<script lang="ts">
  interface Props {
    proxies: ProxyConfig[]
    onFilter: (filtered: ProxyConfig[]) => void
  }

  let { proxies, onFilter }: Props = $props()

  let searchQuery = $state('')
  let filterMode = $state<ProxyMode | 'all'>('all')
  let filterQuickSwitch = $state<boolean | 'all'>('all')

  let filteredProxies = $derived(() => {
    let results = proxies

    // Search by name or host
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      results = results.filter(p =>
        p.name.toLowerCase().includes(query) ||
        (p.rules?.singleProxy?.host || '').toLowerCase().includes(query)
      )
    }

    // Filter by mode
    if (filterMode !== 'all') {
      results = results.filter(p => p.mode === filterMode)
    }

    // Filter by quick switch
    if (filterQuickSwitch !== 'all') {
      results = results.filter(p => p.quickSwitch === filterQuickSwitch)
    }

    return results
  })

  $effect(() => {
    onFilter(filteredProxies)
  })
</script>

<div class="proxy-search">
  <input
    type="text"
    bind:value={searchQuery}
    placeholder="Search proxies..."
    class="search-input"
  />

  <select bind:value={filterMode} class="filter-select">
    <option value="all">All Modes</option>
    <option value="pac_script">PAC Script</option>
    <option value="fixed_servers">Manual</option>
    <option value="direct">Direct</option>
    <option value="auto_detect">Auto-detect</option>
    <option value="system">System</option>
  </select>
</div>
```

**Files to Create/Modify**:
- `src/components/ProxySearch.svelte` (new)
- `src/popup/Popup.svelte` (add search)
- `src/options/ProxyConfigsTab.svelte` (add search & filters)

---

#### 2.3 Duplicate & Template System ⭐⭐⭐
**Effort**: Small | **Value**: Medium

**Features**:
- "Duplicate" button on proxy cards
- Save proxy as template
- Template library
- Apply template to new proxy

**Implementation**:
```typescript
// services/ProxyTemplateService.ts
export class ProxyTemplateService {
  static duplicateProxy(proxy: ProxyConfig): ProxyConfig {
    return {
      ...proxy,
      id: crypto.randomUUID(),
      name: `${proxy.name} (Copy)`,
      isActive: false,
      quickSwitch: false,
      lastTestResult: undefined  // Don't copy test results
    }
  }

  static saveAsTemplate(proxy: ProxyConfig, templateName: string): ProxyTemplate {
    return {
      id: crypto.randomUUID(),
      name: templateName,
      mode: proxy.mode,
      pacScript: proxy.pacScript,
      rules: proxy.rules,
      createdAt: new Date()
    }
  }

  static applyTemplate(template: ProxyTemplate): Omit<ProxyConfig, 'id'> {
    return {
      name: template.name,
      color: '#3b82f6',  // Default color
      quickSwitch: false,
      isActive: false,
      mode: template.mode,
      pacScript: template.pacScript,
      rules: template.rules
    }
  }
}
```

**Files to Create/Modify**:
- `src/services/ProxyTemplateService.ts` (new)
- `src/interfaces/settings.ts` (add ProxyTemplate)
- `src/components/ScriptItem.svelte` (add duplicate button)
- `src/components/ProxyConfig/ProxyConfigModal.svelte` (add template selector)

---

#### 2.4 Enhanced Visual Indicators ⭐⭐⭐
**Effort**: Small | **Value**: Medium

**Features**:
- Test status badges with icons
- Connection strength indicator
- Last used timestamp
- Usage frequency indicator
- Better empty states

**Implementation**:
```svelte
<!-- components/ProxyStatusBadge.svelte -->
<script lang="ts">
  interface Props {
    testResult?: ProxyTestResult
    isActive: boolean
    lastUsed?: Date
  }

  let { testResult, isActive, lastUsed }: Props = $props()

  let statusInfo = $derived(() => {
    if (isActive) {
      return { icon: '🟢', text: 'ACTIVE', color: 'green' }
    }

    if (!testResult) {
      return { icon: '⚪', text: 'Not tested', color: 'gray' }
    }

    if (!testResult.success) {
      return { icon: '🔴', text: 'Failed', color: 'red' }
    }

    if (testResult.responseTime! > 5000) {
      return { icon: '🟡', text: 'Slow', color: 'yellow' }
    }

    return { icon: '🟢', text: 'OK', color: 'green' }
  })
</script>

<div class="status-badge" data-color={statusInfo.color}>
  <span class="icon">{statusInfo.icon}</span>
  <span class="text">{statusInfo.text}</span>
  {#if testResult?.responseTime}
    <span class="time">{testResult.responseTime}ms</span>
  {/if}
</div>
```

**Files to Create/Modify**:
- `src/components/ProxyStatusBadge.svelte` (new)
- `src/components/ScriptItem.svelte` (use new badge)
- `src/components/EmptyState.svelte` (enhance with illustrations)

---

#### 2.5 Keyboard Shortcuts ⭐⭐⭐
**Effort**: Small | **Value**: Medium

**Features**:
- `Ctrl/Cmd + K`: Open quick search
- `Ctrl/Cmd + N`: New proxy
- `Ctrl/Cmd + T`: Test selected proxy
- `Escape`: Close modals
- Arrow keys: Navigate proxy list
- `Enter`: Activate selected proxy

**Implementation**:
```typescript
// services/KeyboardShortcutService.ts
export class KeyboardShortcutService {
  private static handlers: Map<string, () => void> = new Map()

  static register(key: string, handler: () => void) {
    this.handlers.set(key, handler)
  }

  static unregister(key: string) {
    this.handlers.delete(key)
  }

  static init() {
    document.addEventListener('keydown', (e) => {
      const isMac = navigator.platform.includes('Mac')
      const modifier = isMac ? e.metaKey : e.ctrlKey

      // Ctrl/Cmd + K: Quick search
      if (modifier && e.key === 'k') {
        e.preventDefault()
        this.handlers.get('quickSearch')?.()
      }

      // Ctrl/Cmd + N: New proxy
      if (modifier && e.key === 'n') {
        e.preventDefault()
        this.handlers.get('newProxy')?.()
      }

      // Ctrl/Cmd + T: Test proxy
      if (modifier && e.key === 't') {
        e.preventDefault()
        this.handlers.get('testProxy')?.()
      }

      // Escape: Close modal
      if (e.key === 'Escape') {
        this.handlers.get('closeModal')?.()
      }
    })
  }
}
```

**Files to Create/Modify**:
- `src/services/KeyboardShortcutService.ts` (new)
- `src/options/Options.svelte` (init shortcuts)
- `src/popup/Popup.svelte` (init shortcuts)

---

### Phase 2 Summary

**Deliverables**:
- ✅ Usage statistics (privacy-focused)
- ✅ Search and filtering
- ✅ Duplicate proxies
- ✅ Template system
- ✅ Enhanced visual indicators
- ✅ Keyboard shortcuts

**Success Criteria**:
- Users can find proxies quickly
- Usage patterns are visible
- Proxy management is faster
- Better visual feedback

**Bundle Size Impact**: +30-40KB

---

## Phase 3: Smart Features

**Timeline**: 4-5 weeks
**Priority**: 🟡 Medium
**Dependencies**: Phase 1 & 2 complete

### Objectives
- Reduce manual proxy switching
- Enable context-aware automation
- Improve PAC script development

### Features

#### 3.1 PAC Script Live Testing ⭐⭐⭐⭐⭐
**Effort**: Medium-High | **Value**: Very High

**Features**:
- Test PAC script against URLs in real-time
- Show which proxy would be used
- Test multiple URLs at once
- No eval() - uses Web Worker

**Implementation**:
```typescript
// services/PACScriptTestService.ts
export class PACScriptTestService {
  /**
   * Test PAC script using Web Worker (safe, no eval)
   */
  static async testPACScript(
    pacScript: string,
    testUrls: string[]
  ): Promise<PACTestResult[]> {
    return Promise.all(
      testUrls.map(url => this.testSingleUrl(pacScript, url))
    )
  }

  private static async testSingleUrl(
    pacScript: string,
    testUrl: string
  ): Promise<PACTestResult> {
    return new Promise((resolve, reject) => {
      // Create Web Worker with PAC script
      const workerCode = `
        ${this.getPACHelpers()}

        ${pacScript}

        self.onmessage = function(e) {
          try {
            const { url, host } = e.data
            const result = FindProxyForURL(url, host)
            self.postMessage({ success: true, result })
          } catch (error) {
            self.postMessage({
              success: false,
              error: error.message
            })
          }
        }
      `

      const blob = new Blob([workerCode], { type: 'application/javascript' })
      const workerUrl = URL.createObjectURL(blob)
      const worker = new Worker(workerUrl)

      const timeout = setTimeout(() => {
        worker.terminate()
        reject(new Error('Timeout'))
      }, 3000)

      worker.onmessage = (e) => {
        clearTimeout(timeout)
        worker.terminate()
        URL.revokeObjectURL(workerUrl)

        resolve({
          url: testUrl,
          success: e.data.success,
          proxyResult: e.data.result,
          error: e.data.error
        })
      }

      worker.onerror = (error) => {
        clearTimeout(timeout)
        worker.terminate()
        URL.revokeObjectURL(workerUrl)
        reject(error)
      }

      const urlObj = new URL(testUrl)
      worker.postMessage({
        url: testUrl,
        host: urlObj.hostname
      })
    })
  }

  private static getPACHelpers(): string {
    // Return safe implementations of PAC helper functions
    // dnsDomainIs, shExpMatch, isInNet, etc.
    return `
      function dnsDomainIs(host, domain) {
        return host.toLowerCase() === domain.toLowerCase() ||
               host.toLowerCase().endsWith('.' + domain.toLowerCase())
      }

      function shExpMatch(str, pattern) {
        const regexPattern = pattern
          .replace(/\./g, '\\\\.')
          .replace(/\\*/g, '.*')
          .replace(/\\?/g, '.')
        return new RegExp('^' + regexPattern + '$').test(str)
      }

      function isInNet(host, pattern, mask) {
        const ipToNum = (ip) => {
          return ip.split('.').reduce((num, octet) =>
            (num << 8) + parseInt(octet), 0) >>> 0
        }

        try {
          const hostNum = ipToNum(host)
          const patternNum = ipToNum(pattern)
          const maskNum = ipToNum(mask)
          return (hostNum & maskNum) === (patternNum & maskNum)
        } catch {
          return false
        }
      }

      function isPlainHostName(host) {
        return !host.includes('.')
      }

      function dnsDomainLevels(host) {
        return host.split('.').length - 1
      }

      function isResolvable(host) {
        // Simplified - always return true for testing
        return true
      }

      function localHostOrDomainIs(host, hostdom) {
        return host === hostdom || host === hostdom.split('.')[0]
      }

      function myIpAddress() {
        return '127.0.0.1'  // Placeholder for testing
      }

      function dnsResolve(host) {
        return '0.0.0.0'  // Placeholder for testing
      }

      function weekdayRange(...args) {
        // Simplified implementation
        return true
      }

      function dateRange(...args) {
        // Simplified implementation
        return true
      }

      function timeRange(...args) {
        // Simplified implementation
        return true
      }
    `
  }
}
```

**UI Component**:
```svelte
<!-- components/ProxyConfig/PACScriptTester.svelte -->
<script lang="ts">
  import { PACScriptTestService } from '@/services/PACScriptTestService'

  interface Props {
    pacScript: string
  }

  let { pacScript }: Props = $props()

  let testUrls = $state([
    'https://www.google.com',
    'http://internal.company.com',
    'https://api.example.com'
  ])

  let newUrl = $state('')
  let testResults = $state<PACTestResult[]>([])
  let testing = $state(false)

  async function runTests() {
    testing = true
    try {
      testResults = await PACScriptTestService.testPACScript(
        pacScript,
        testUrls.filter(url => url.trim())
      )
    } catch (error) {
      console.error('Test failed:', error)
    } finally {
      testing = false
    }
  }

  function addUrl() {
    if (newUrl.trim()) {
      testUrls = [...testUrls, newUrl.trim()]
      newUrl = ''
    }
  }
</script>

<div class="pac-tester">
  <h3>Test PAC Script</h3>

  <div class="test-urls">
    {#each testUrls as url, i}
      <div class="url-input">
        <input type="text" bind:value={testUrls[i]} />
        <button onclick={() => testUrls.splice(i, 1)}>×</button>
      </div>
    {/each}

    <div class="add-url">
      <input
        type="text"
        bind:value={newUrl}
        placeholder="Add test URL"
        onkeypress={(e) => e.key === 'Enter' && addUrl()}
      />
      <button onclick={addUrl}>Add</button>
    </div>
  </div>

  <button onclick={runTests} disabled={testing}>
    {testing ? 'Testing...' : 'Run Tests'}
  </button>

  {#if testResults.length > 0}
    <div class="results">
      <h4>Results:</h4>
      {#each testResults as result}
        <div class="result" class:success={result.success} class:error={!result.success}>
          <div class="url">{result.url}</div>
          {#if result.success}
            <div class="proxy-result">→ {result.proxyResult}</div>
          {:else}
            <div class="error-msg">{result.error}</div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .pac-tester {
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 16px;
    margin-top: 16px;
  }

  .test-urls {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 16px 0;
  }

  .url-input {
    display: flex;
    gap: 8px;
  }

  .url-input input {
    flex: 1;
  }

  .results {
    margin-top: 16px;
    padding: 12px;
    background: var(--bg-secondary);
    border-radius: 4px;
  }

  .result {
    padding: 8px;
    margin: 4px 0;
    border-left: 3px solid;
  }

  .result.success {
    border-color: var(--color-success);
    background: var(--bg-success-light);
  }

  .result.error {
    border-color: var(--color-error);
    background: var(--bg-error-light);
  }

  .proxy-result {
    font-family: monospace;
    color: var(--color-success);
  }
</style>
```

**Security**: Web Worker provides isolation, no eval()

**Files to Create/Modify**:
- `src/services/PACScriptTestService.ts` (new)
- `src/components/ProxyConfig/PACScriptTester.svelte` (new)
- `src/components/ProxyConfig/PACScriptSettings.svelte` (integrate tester)
- `src/interfaces/settings.ts` (add PACTestResult type)

---

#### 3.2 Proxy Groups/Profiles ⭐⭐⭐⭐
**Effort**: Medium | **Value**: High

**Features**:
- Group related proxies
- Switch entire groups
- Group-level quick switch
- Visual organization

**Implementation**:
```typescript
// New interface
interface ProxyGroup {
  id: string
  name: string
  icon: string  // emoji or icon name
  color: string
  proxyIds: string[]
  quickSwitch: boolean
  rotationType: 'manual' | 'round-robin' | 'random'
}

// Extend AppSettings
interface AppSettings {
  // ... existing
  proxyGroups: ProxyGroup[]
}
```

**Files to Create/Modify**:
- `src/interfaces/settings.ts` (add ProxyGroup)
- `src/components/ProxyGroupManager.svelte` (new)
- `src/options/ProxyConfigsTab.svelte` (add groups UI)
- `src/stores/settingsStore.ts` (add group methods)

---

#### 3.3 Smart Notifications ⭐⭐⭐
**Effort**: Small | **Value**: Medium

**Features**:
- Notify on proxy switch success/failure
- Warn before switching from untested proxy
- Notify when proxy test fails
- Suggest cleanup of unused proxies

**Implementation**:
```typescript
// services/NotificationService.ts
export class NotificationService {
  static async notifyProxySwitched(proxy: ProxyConfig) {
    NotifyService.success(`Switched to ${proxy.name}`)
  }

  static async warnUntestedProxy(proxy: ProxyConfig) {
    const shouldContinue = await this.showConfirmation(
      'Untested Proxy',
      `"${proxy.name}" has not been tested. Continue anyway?`
    )
    return shouldContinue
  }

  static async suggestCleanup(unusedProxies: ProxyConfig[]) {
    if (unusedProxies.length > 5) {
      NotifyService.info(
        `You have ${unusedProxies.length} unused proxies. Consider cleaning up?`
      )
    }
  }
}
```

**Files to Create/Modify**:
- `src/services/NotificationService.ts` (new)
- `src/stores/settingsStore.ts` (integrate notifications)

---

### Phase 3 Summary

**Deliverables**:
- ✅ PAC script live testing (Web Worker, safe)
- ✅ Proxy groups/profiles
- ✅ Smart notifications

**Success Criteria**:
- PAC scripts can be tested before deployment
- Users can organize proxies into groups
- Better awareness of proxy state

**Bundle Size Impact**: +40-50KB

---

## Phase 4: Advanced Automation

**Timeline**: 5-6 weeks
**Priority**: 🟢 Nice to Have
**Dependencies**: Phase 1, 2, 3 complete

### Objectives
- Minimize manual intervention
- Context-aware proxy switching
- Power user features

### Features

#### 4.1 Rule-Based Proxy Switching ⭐⭐⭐⭐⭐
**Effort**: High | **Value**: Very High

**Features**:
- Automatic proxy switching based on:
  - Domain patterns
  - URL patterns
  - Time of day
  - Network (WiFi SSID)
- Rule priority system
- Enable/disable rules

**Implementation**:
```typescript
// New interfaces
interface ProxyRule {
  id: string
  name: string
  enabled: boolean
  priority: number  // Higher = runs first
  trigger: RuleTrigger
  action: RuleAction
}

interface RuleTrigger {
  type: 'domain' | 'url-pattern' | 'time' | 'network'
  condition: DomainCondition | URLCondition | TimeCondition | NetworkCondition
}

interface DomainCondition {
  domains: string[]  // e.g., ['*.company.com', 'internal.local']
  matchType: 'exact' | 'wildcard' | 'regex'
}

interface URLCondition {
  patterns: string[]
  matchType: 'contains' | 'starts-with' | 'regex'
}

interface TimeCondition {
  weekdays?: number[]  // 0-6 (Sunday-Saturday)
  startTime?: string   // '09:00'
  endTime?: string     // '17:00'
  timezone?: string
}

interface NetworkCondition {
  ssids: string[]      // WiFi network names
  matchType: 'exact' | 'contains'
}

interface RuleAction {
  type: 'activate-proxy' | 'activate-group' | 'deactivate-all'
  targetId: string  // proxy ID or group ID
}
```

**Required Chrome Permission**:
- For network detection: `networkState` or similar
- **Alternative**: Use without network detection for Phase 4

**Files to Create/Modify**:
- `src/interfaces/rules.ts` (new - rule types)
- `src/services/RuleEngineService.ts` (new - rule evaluation)
- `src/components/RuleManager.svelte` (new - UI for rules)
- `src/background/background.ts` (integrate rule evaluation)

---

#### 4.2 Quick Switch History ⭐⭐⭐
**Effort**: Small | **Value**: Medium

**Features**:
- Track recently used proxies
- Quick access to last N proxies
- "Switch back" button

**Implementation**:
```typescript
// Extend AppSettings
interface AppSettings {
  // ... existing
  proxyHistory: string[]  // proxy IDs, most recent first
  historySize: number     // default: 10
}

// In settingsStore
async setProxy(id: string, isActive: boolean) {
  // ... existing code ...

  // Add to history
  this.updateHistory(id)
}

private updateHistory(proxyId: string) {
  update(settings => {
    const history = settings.proxyHistory.filter(id => id !== proxyId)
    history.unshift(proxyId)

    return {
      ...settings,
      proxyHistory: history.slice(0, settings.historySize)
    }
  })
}
```

**Files to Create/Modify**:
- `src/stores/settingsStore.ts` (add history tracking)
- `src/popup/Popup.svelte` (show recent proxies)
- `src/components/ProxyHistory.svelte` (new)

---

#### 4.3 Proxy Authentication Support ⭐⭐⭐⭐
**Effort**: Medium-High | **Value**: High

**Features**:
- Store proxy credentials (encrypted)
- Auto-fill on connection
- Support for different auth types

**Implementation**:
```typescript
// New interface
interface ProxyAuth {
  username: string
  password: string  // Encrypted with Web Crypto API
  authType: 'basic' | 'digest'
}

// Extend ProxyServer
interface ProxyServer {
  // ... existing
  auth?: ProxyAuth
}

// Encryption service
export class EncryptionService {
  private static async getKey(): Promise<CryptoKey> {
    // Derive key from extension ID (consistent across sessions)
    const encoder = new TextEncoder()
    const data = encoder.encode(chrome.runtime.id)

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      data,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    )

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('pacify-encryption-salt'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    )
  }

  static async encrypt(text: string): Promise<string> {
    const key = await this.getKey()
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const iv = crypto.getRandomValues(new Uint8Array(12))

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    )

    // Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encrypted), iv.length)

    // Convert to base64
    return btoa(String.fromCharCode(...combined))
  }

  static async decrypt(encrypted: string): Promise<string> {
    const key = await this.getKey()
    const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0))

    const iv = combined.slice(0, 12)
    const data = combined.slice(12)

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    )

    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  }
}
```

**Security**:
- Uses Web Crypto API (browser standard)
- Encryption key derived from extension ID
- No plain-text storage

**Files to Create/Modify**:
- `src/services/EncryptionService.ts` (new)
- `src/interfaces/settings.ts` (add ProxyAuth)
- `src/components/ProxyConfig/ProxyAuthSettings.svelte` (new)
- `src/services/chrome/ChromeService.ts` (handle auth)

---

### Phase 4 Summary

**Deliverables**:
- ✅ Rule-based automation
- ✅ Proxy history
- ✅ Authentication support

**Success Criteria**:
- Proxies switch automatically based on context
- Credentials are stored securely
- Quick access to recent proxies

**Bundle Size Impact**: +50-60KB

**New Permission**: May need `networkState` for network-based rules (optional)

---

## Phase 5: Enterprise & Power Users

**Timeline**: 4-5 weeks
**Priority**: 🔵 Future
**Dependencies**: All previous phases

### Features (Summary)

#### 5.1 Advanced PAC Features
- PAC script versioning
- Diff viewer
- Community templates
- Import/export PAC library

#### 5.2 Export & Reporting
- Usage reports (CSV/JSON)
- Share configs via encrypted URL
- QR code generation
- Command-line import/export

#### 5.3 Developer Tools
- Debug mode with verbose logging
- Network inspector
- Performance profiling
- Dry-run mode

#### 5.4 Custom Themes
- Manual theme toggle
- Custom color schemes
- Compact/spacious modes
- Accessibility themes

---

## Implementation Guidelines

### Code Quality Standards

1. **TypeScript Strict Mode**
   ```typescript
   // All new code must pass strict type checking
   "strict": true,
   "noImplicitAny": true,
   "strictNullChecks": true
   ```

2. **Testing Requirements**
   - Unit tests for all services
   - E2E tests for critical workflows
   - Minimum 80% coverage for new code

3. **Performance Budgets**
   - Bundle size: < 600KB total
   - Service worker init: < 100ms
   - Proxy switch time: < 500ms
   - Storage operations: < 50ms

4. **Security Checklist**
   - [ ] No `eval()` or `new Function()`
   - [ ] Input validation on all user data
   - [ ] Encrypt sensitive data
   - [ ] Follow CSP guidelines
   - [ ] Minimal permissions
   - [ ] Audit dependencies

### Git Workflow

1. **Branch Naming**
   ```
   feature/phase1-proxy-testing
   feature/phase2-statistics
   fix/proxy-validation-bug
   ```

2. **Commit Messages**
   ```
   feat(phase1): add proxy connection testing
   fix(validation): handle invalid port numbers
   test(pac-script): add PAC analyzer tests
   ```

3. **Pull Request Template**
   ```markdown
   ## Phase X - Feature Name

   ### Changes
   - [ ] Feature implementation
   - [ ] Unit tests added
   - [ ] E2E tests added
   - [ ] Documentation updated
   - [ ] Bundle size checked

   ### Security
   - [ ] No eval() or unsafe patterns
   - [ ] Input validation added
   - [ ] CSP compliant

   ### Testing
   - [ ] All tests pass
   - [ ] Manual testing completed
   - [ ] No regressions
   ```

---

## Success Metrics

### Phase 1 Metrics
- **Reliability**: 95% of users test proxies before using
- **Error Reduction**: 50% fewer proxy connection errors
- **Validation**: 100% of invalid configs caught before save

### Phase 2 Metrics
- **Efficiency**: 40% reduction in time to find/switch proxies
- **Organization**: 70% of users with >5 proxies use search/groups
- **Awareness**: Users aware of proxy usage patterns

### Phase 3 Metrics
- **PAC Development**: 60% faster PAC script development
- **Automation**: 30% reduction in manual proxy switches
- **Confidence**: Users trust proxy state

### Phase 4 Metrics
- **Automation**: 80% of switches are rule-based
- **Security**: Credentials stored securely
- **Convenience**: Quick access to recent proxies

---

## Risk Assessment

### Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Bundle size growth | High | Medium | Code splitting, lazy loading |
| Storage quota exceeded | Medium | Low | Cleanup suggestions, size monitoring |
| Service worker timeout | High | Low | Message queue, retry logic |
| CSP violations | High | Low | Strict review process, testing |
| Performance degradation | Medium | Low | Performance budgets, profiling |

### User Experience Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Feature complexity | Medium | Medium | Progressive disclosure, defaults |
| Migration issues | High | Low | Careful migration, rollback plan |
| Breaking changes | High | Low | Semantic versioning, changelog |

---

## Migration Strategy

### Version Compatibility

```typescript
// services/MigrationService.ts
export class MigrationService {
  static async migrateSettings(settings: any, fromVersion: string): Promise<AppSettings> {
    let current = settings

    // Phase 1 migrations
    if (fromVersion < '2.0.0') {
      current = this.migrateToPhase1(current)
    }

    // Phase 2 migrations
    if (fromVersion < '2.1.0') {
      current = this.migrateToPhase2(current)
    }

    return current
  }

  private static migrateToPhase1(settings: any): any {
    // Add test results to existing proxies
    return {
      ...settings,
      proxyConfigs: settings.proxyConfigs.map(p => ({
        ...p,
        lastTestResult: undefined,
        autoTest: false
      }))
    }
  }

  private static migrateToPhase2(settings: any): any {
    // Add statistics
    return {
      ...settings,
      proxyStats: {},
      statsEnabled: true,
      proxyHistory: []
    }
  }
}
```

---

## Next Steps

1. **Review this document** with stakeholders
2. **Prioritize phases** based on user feedback
3. **Set up project tracking** (GitHub Projects/Issues)
4. **Create Phase 1 milestone** with detailed tasks
5. **Begin implementation** of Phase 1 features

---

## Questions & Decisions

### Open Questions
1. Should we add network-based rules in Phase 4? (requires new permission)
2. What's the max number of test URLs for PAC testing?
3. Should stats be opt-in or opt-out?
4. Cloud sync in future phases?

### Decisions Made
- ✅ No eval() anywhere - use Web Workers
- ✅ All stats are local only
- ✅ Phases are independent - can be released separately
- ✅ Bundle size budget: 600KB
- ✅ Support Chromium-based browsers only

---

**Document Maintenance**:
- Update after each phase completion
- Track actual vs. estimated timelines
- Document lessons learned
- Adjust future phases based on feedback

**Contact**: [Your contact info]
**Last Review**: 2024-11-13

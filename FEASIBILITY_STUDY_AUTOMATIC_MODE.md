# Feasibility Study: Automatic Proxy Switching Feature

**Issue:** [#17 - Automatic mode](https://github.com/navbytes/pacify/issues/17)
**Date:** January 2026
**Status:** ✅ Feasible and Recommended

---

## Executive Summary

This study evaluates the feasibility of implementing an "Automatic Mode" feature that allows users to automatically switch between different proxies based on URL patterns, similar to Proxy SwitchyOmega.

**Conclusion:** The feature is **technically feasible** and can be implemented using Chrome's PAC (Proxy Auto-Configuration) script functionality that Pacify already supports. The implementation can be done in phases without disrupting existing features.

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Feature Requirements](#feature-requirements)
3. [Technical Feasibility](#technical-feasibility)
4. [Implementation Strategy](#implementation-strategy)
5. [Architecture Recommendations](#architecture-recommendations)
6. [Implementation Phases](#implementation-phases)
7. [Potential Challenges](#potential-challenges)
8. [Competitive Analysis](#competitive-analysis)
9. [Next Steps](#next-steps)

---

## Current State Analysis

### Extension Architecture

**Current Components:**

- **Popup** (`src/popup/Popup.svelte`): Quick access to enable/disable proxies
- **Options Page** (`src/options/ProxyConfigsTab.svelte`): Full proxy management interface
- **Background Service** (`src/background/background.ts`): Handles proxy application and browser events

### Existing Features

1. **Manual Proxy Management**
   - Create and manage multiple proxy configurations
   - Support for different proxy types (HTTP, HTTPS, SOCKS4/5)

2. **Quick Switch Mode**
   - Toggle-based rotation through favorite proxies
   - Keyboard shortcuts (1-9) for quick access
   - Icon click to cycle through proxies

3. **Supported Proxy Modes**
   - `direct` - No proxy
   - `system` - Use system proxy settings
   - `auto_detect` - Auto-detect proxy configuration
   - `pac_script` - PAC script (URL or inline) ✅ _Key for automatic mode_
   - `fixed_servers` - Manual proxy configuration

### Current Data Model

```typescript
// src/interfaces/settings.ts
interface ProxyConfig {
  id?: string
  name: string
  color: string
  quickSwitch?: boolean
  isActive: boolean
  mode: ProxyMode
  pacScript?: {
    url?: string
    data?: string
    mandatory?: boolean
  }
  rules?: ProxyRules
}

interface AppSettings {
  quickSwitchEnabled: boolean
  activeScriptId: string | null
  proxyConfigs: ProxyConfig[]
  disableProxyOnStartup: boolean
  autoReloadOnProxySwitch: boolean
}
```

### Storage Architecture

- **Primary Storage**: `chrome.storage.sync` for settings
- **Large Data**: PAC scripts >8KB stored in `chrome.storage.local`
- **Reference System**: Automatic splitting and referencing (already implemented in `src/services/StorageService.ts`)

---

## Feature Requirements

### User Story

> "As a user, I want to define URL patterns that automatically route traffic through specific proxies, so I don't have to manually switch proxies when visiting different websites."

### Use Cases

1. **Work vs Personal**
   - `*.company.com` → Corporate Proxy
   - `*.github.com` → Personal Proxy
   - Everything else → Direct

2. **Geographic Routing**
   - `*.netflix.com` → US Proxy
   - `*.bbc.co.uk` → UK Proxy
   - Default → Local Proxy

3. **Service-Specific**
   - `*.google.com, *.youtube.com` → Proxy A
   - `*.facebook.com, *.instagram.com` → Proxy B
   - `*.local, 192.168.*` → Direct

### Core Requirements

- Define URL patterns (wildcards, hostnames, IPs)
- Associate patterns with specific proxy configurations
- Enable/disable automatic mode
- Pattern validation and testing
- Visual feedback on active rules
- Import/export rule sets

---

## Technical Feasibility

### ✅ Available Chrome APIs

**PAC Script Support** ([Chrome Proxy API](https://developer.chrome.com/docs/extensions/reference/api/proxy)):

- ✅ Inline PAC scripts via `pacScript.data`
- ✅ URL-based PAC scripts via `pacScript.url`
- ✅ Automatic evaluation on every network request
- ✅ Pattern matching functions: `shExpMatch()`, `dnsDomainIs()`, `isInNet()`

**Supported Pattern Types:**

- Hostname patterns: `*.example.com`, `example.com`, `*example.com`
- IP address patterns: `192.168.1.1`, `[::1]`
- CIDR notation: `192.168.1.0/24`, `fefe:13::abc/33`
- Local addresses: `<local>` for simple hostnames

### ❌ Not Available in Chrome

- `proxy.onRequest()` API (Firefox only)
- Per-request programmatic proxy selection
- Native URL pattern → proxy mapping

### What Pacify Already Has

✅ PAC script mode support (`src/services/chrome/ChromeService.ts`)
✅ Multiple proxy configuration management
✅ Proxy switching infrastructure
✅ Storage service with large data handling
✅ UI components and design system
✅ Background service for proxy management

### What Needs to Be Built

1. **URL Rule Management System**
   - Data model for URL patterns
   - Pattern validation and sanitization
   - Rule priority/ordering

2. **PAC Script Generator**
   - Convert user rules to JavaScript
   - Optimize for performance
   - Handle edge cases and fallbacks

3. **User Interface**
   - Rule creation/editing interface
   - Pattern testing tool
   - Visual rule organization
   - Import/export functionality

4. **Automatic Mode Toggle**
   - Enable/disable automatic routing
   - Integration with existing modes
   - Status indicators

---

## Implementation Strategy

### Recommended Approach: Dynamic PAC Script Generation

**How It Works:**

1. User defines URL patterns and associates them with proxies
2. When "Automatic Mode" is enabled:
   - Generate PAC script from user-defined rules
   - Set proxy mode to `pac_script` with generated script
   - Chrome automatically evaluates script for each request

3. PAC script performs pattern matching:

   ```javascript
   function FindProxyForURL(url, host) {
     // User Rule 1: *.google.com → Proxy A
     if (shExpMatch(host, '*.google.com')) {
       return 'PROXY proxy-a.example.com:8080'
     }

     // User Rule 2: *.github.com → Proxy B
     if (shExpMatch(host, '*.github.com')) {
       return 'SOCKS5 proxy-b.example.com:1080'
     }

     // Default: Direct connection
     return 'DIRECT'
   }
   ```

### Why This Approach?

✅ **Native Chrome Support**: Uses built-in PAC script functionality
✅ **Performance**: Chrome optimizes PAC script evaluation
✅ **Flexibility**: Supports complex patterns and logic
✅ **Compatibility**: Works with existing Pacify architecture
✅ **No API Limitations**: Doesn't require unavailable Chrome APIs

---

## Architecture Recommendations

### Option 1: Separate "Automatic Mode" (✅ Recommended)

**Structure:**

```
Settings
├── Quick Switch Mode (existing)
│   └── Toggle through favorite proxies
└── Automatic Mode (new)
    ├── Enable/Disable toggle
    └── URL Rules Management
        ├── Add/Edit/Delete rules
        ├── Pattern validation
        └── Test patterns
```

**Pros:**

- Clear separation from Quick Switch mode
- Doesn't disrupt existing workflows
- Can coexist with manual proxy selection
- Similar to Proxy SwitchyOmega's approach
- Easy to understand for users

**Cons:**

- Another mode to manage
- Need to handle mode conflicts

**Data Model Extension:**

```typescript
interface AutoProxyRule {
  id: string
  pattern: string // e.g., "*.google.com"
  matchType: 'wildcard' | 'regex' | 'cidr'
  proxyId: string // Which proxy config to use
  enabled: boolean
  priority: number // For rule ordering
  description?: string
}

interface AppSettings {
  // ... existing fields
  quickSwitchEnabled: boolean
  autoProxyEnabled: boolean // NEW
  autoProxyRules: AutoProxyRule[] // NEW
  autoProxyFallback: string // NEW: 'direct' or proxyId
}
```

### Option 2: Enhanced Proxy Configs with URL Rules

**Structure:**
Each proxy config includes optional URL rules.

**Pros:**

- More flexible for complex scenarios
- Natural extension of existing model

**Cons:**

- More complex UI
- Potential rule conflicts between proxies
- Harder to get overview of all rules
- Not recommended for initial implementation

---

## Implementation Phases

### Phase 1: MVP - Core Functionality (4-6 weeks)

**Goals:**

- Basic automatic mode with wildcard patterns
- Simple rule management UI
- PAC script generation and application

**Tasks:**

1. **Data Model** (1 week)
   - [ ] Extend `AppSettings` interface
   - [ ] Create `AutoProxyRule` interface
   - [ ] Add storage migrations
   - [ ] Update SettingsReader/Writer services

2. **PAC Script Generator** (1 week)
   - [ ] Create `PACScriptGenerator` service
   - [ ] Implement wildcard pattern converter
   - [ ] Add pattern validation
   - [ ] Handle fallback logic
   - [ ] Write unit tests

3. **Background Service Integration** (1 week)
   - [ ] Add automatic mode handler
   - [ ] Integrate with existing proxy switching
   - [ ] Handle mode transitions
   - [ ] Update badge/status indicators

4. **UI Components** (2 weeks)
   - [ ] Automatic mode toggle in Settings tab
   - [ ] Rule list component
   - [ ] Add/Edit rule modal
   - [ ] Pattern input with validation
   - [ ] Proxy selector dropdown
   - [ ] Simple pattern tester

5. **Testing & Polish** (1 week)
   - [ ] E2E tests for automatic mode
   - [ ] Test with various pattern types
   - [ ] Error handling and edge cases
   - [ ] Documentation
   - [ ] User guide

**Deliverables:**

- Working automatic mode with wildcard patterns
- UI for creating and managing rules
- Documentation and tests

### Phase 2: Enhanced UX (3-4 weeks)

**Features:**

1. **Pattern Validation & Testing**
   - Real-time pattern validation
   - Test URL against all rules
   - Visual feedback on matches
   - Pattern syntax helper

2. **Rule Templates**
   - Common patterns (e.g., "All Google services")
   - Predefined rule sets
   - Template marketplace/sharing

3. **Import/Export**
   - Export rules as JSON
   - Import from Proxy SwitchyOmega
   - Backup/restore functionality

4. **Enhanced UI**
   - Drag & drop rule ordering
   - Bulk actions (enable/disable multiple)
   - Search/filter rules
   - Rule statistics

### Phase 3: Advanced Features (4-6 weeks)

**Features:**

1. **Regex Pattern Support**
   - Full regex pattern matching
   - Regex validation and testing
   - Performance optimization

2. **Conditional Rules**
   - Time-based rules (work hours only)
   - IP-based conditions
   - Weekday/weekend rules
   - Custom JavaScript conditions

3. **Analytics & Monitoring**
   - Rule usage statistics
   - Most/least used rules
   - Performance metrics
   - Traffic analysis

4. **Advanced PAC Features**
   - Custom PAC functions
   - Multiple fallback proxies
   - Load balancing logic
   - Proxy failover

---

## Potential Challenges

### 1. PAC Script Size Limits

**Challenge:** Chrome sync storage has 8KB limit

**Solution:** ✅ Already handled!

- Pacify stores large PAC scripts in `local` storage
- Reference system in place (`src/services/StorageService.ts:28-38`)
- Can store unlimited rules

### 2. Pattern Matching Complexity

**Challenge:** Users may want regex, wildcards, and complex patterns

**Solution:**

- Phase 1: Simple wildcards using `shExpMatch()`
- Phase 2: Add regex support with validation
- Provide pattern templates and examples
- Real-time pattern testing UI

### 3. Mode Conflicts

**Challenge:** Quick Switch and Automatic Mode both manipulate proxy settings

**Solution:**

- Make modes mutually exclusive, OR
- Automatic mode takes precedence when enabled
- Clear UI indicators of active mode
- Warn user when switching modes

### 4. PAC Script Performance

**Challenge:** PAC script evaluated on every network request

**Solution:**

- Keep generated PAC script optimized
- Use efficient pattern matching (avoid regex when possible)
- Cache pattern compilations
- Limit rule count (warn at 50+ rules)
- Provide performance tips in UI

### 5. Pattern Syntax Learning Curve

**Challenge:** Users may not understand wildcard/regex syntax

**Solution:**

- Visual pattern builder
- Real-time validation and testing
- Example patterns library
- Interactive tutorial
- Import from other extensions

### 6. Migration from Quick Switch

**Challenge:** Existing users rely on Quick Switch

**Solution:**

- Don't remove Quick Switch
- Both modes can coexist
- Provide migration guide
- Optional: Convert Quick Switch to Automatic Mode rules

---

## Competitive Analysis

### Proxy SwitchyOmega

- **Auto-switch mode** with URL patterns
- Wildcards and regex support
- Rule import/export
- 2M+ users
- **Pacify can match this** ✅

### FoxyProxy

- Multiple switching methods
- Pattern-based switching
- 400K+ users
- Complex rule conditions
- **Target for Phase 3** 🎯

### SmartProxy

- Automatic proxy based on patterns
- Custom PAC generation
- Open source
- **Similar approach** 👍

---

## Risk Assessment

### Technical Risks

| Risk                               | Probability | Impact | Mitigation                                     |
| ---------------------------------- | ----------- | ------ | ---------------------------------------------- |
| PAC script generation bugs         | Medium      | High   | Extensive testing, validation                  |
| Performance issues with many rules | Low         | Medium | Optimize PAC generation, warn users            |
| Chrome API changes                 | Low         | High   | Monitor Chrome updates, maintain compatibility |
| Pattern matching edge cases        | Medium      | Medium | Comprehensive test suite, user feedback        |

### User Experience Risks

| Risk                        | Probability | Impact | Mitigation                                 |
| --------------------------- | ----------- | ------ | ------------------------------------------ |
| Feature too complex         | Medium      | Medium | Phase 1 focuses on simplicity, tutorials   |
| Conflicts with Quick Switch | Low         | Low    | Clear mode separation, UI indicators       |
| Migration confusion         | Medium      | Low    | Maintain existing features, provide guides |
| Pattern syntax errors       | High        | Low    | Real-time validation, examples             |

---

## Success Metrics

### Phase 1 (MVP)

- [ ] 80%+ unit test coverage for PAC generator
- [ ] Successfully create and apply rules
- [ ] No performance degradation with <20 rules
- [ ] Positive user feedback (beta testing)

### Phase 2 (Enhanced)

- [ ] 50%+ of users try automatic mode
- [ ] Import feature used by 20%+ of users
- [ ] <5% bug reports related to patterns
- [ ] 4+ star average rating

### Phase 3 (Advanced)

- [ ] Match feature parity with Proxy SwitchyOmega
- [ ] Support 100+ rules without issues
- [ ] Advanced features used by 10%+ of users

---

## Next Steps

### Immediate Actions (Week 1-2)

1. **Design & Planning**
   - [ ] Create UI mockups for automatic mode
   - [ ] Define URL pattern syntax and rules
   - [ ] Review and approve this feasibility study
   - [ ] Create GitHub project board

2. **Technical Preparation**
   - [ ] Spike: Build prototype PAC generator
   - [ ] Test PAC script with Chrome
   - [ ] Validate pattern matching approaches
   - [ ] Research import from SwitchyOmega

3. **Documentation**
   - [ ] Architecture decision record (ADR)
   - [ ] API design for rule management
   - [ ] User guide outline
   - [ ] Migration guide outline

### Implementation Kickoff (Week 3)

1. **Sprint 1: Data Model & Storage**
   - Implement data model changes
   - Storage service updates
   - Migration scripts
   - Unit tests

2. **Sprint 2: PAC Generator**
   - Core PAC generation logic
   - Pattern matching
   - Validation
   - Tests

3. **Sprint 3+: UI & Integration**
   - Follow Phase 1 task list
   - Weekly demos
   - Continuous testing

---

## Conclusion

### ✅ Recommendation: Proceed with Implementation

**The automatic proxy switching feature is:**

1. ✅ **Technically Feasible**
   - Chrome's PAC script API provides all necessary functionality
   - Pacify's architecture supports the addition seamlessly
   - Storage and proxy management infrastructure already in place

2. ✅ **Strategically Valuable**
   - Requested by users (Issue #17)
   - Standard feature in competing extensions
   - Differentiation opportunity with better UX
   - Natural evolution of Pacify's capabilities

3. ✅ **Low Risk**
   - Non-disruptive to existing features
   - Can be built incrementally
   - Known technical patterns
   - Clear fallback strategies

4. ✅ **Phased Approach**
   - MVP delivers core value quickly
   - Progressive enhancement in later phases
   - Clear success metrics
   - Manageable scope

**Estimated Timeline:**

- **Phase 1 (MVP)**: 4-6 weeks
- **Phase 2 (Enhanced)**: 3-4 weeks
- **Phase 3 (Advanced)**: 4-6 weeks
- **Total**: 11-16 weeks for full implementation

**Resources Required:**

- 1 full-time developer (or equivalent)
- UI/UX design consultation (Phase 1 & 2)
- Beta testing group (20-50 users)

---

## References

### Technical Documentation

- [Chrome Proxy API](https://developer.chrome.com/docs/extensions/reference/api/proxy)
- [PAC File Specification (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Proxy_servers_and_tunneling/Proxy_Auto-Configuration_PAC_file)
- [Chrome Proxy Support Documentation](https://chromium.googlesource.com/chromium/src/+/HEAD/net/docs/proxy.md)

### Competitive Products

- [Proxy SwitchyOmega Setup Guide](https://roundproxies.com/blog/proxy-switchomega/)
- [SmartProxy GitHub](https://github.com/salarcode/SmartProxy)

### Related Issues

- [Issue #17: Automatic mode](https://github.com/navbytes/pacify/issues/17)

---

## Appendix

### A. Example PAC Script Template

```javascript
// Generated by Pacify Automatic Mode
function FindProxyForURL(url, host) {
  // Rule 1: Corporate domains
  if (shExpMatch(host, '*.company.com') || shExpMatch(host, '*.company.io')) {
    return 'PROXY corporate-proxy.company.com:8080'
  }

  // Rule 2: Development environments
  if (shExpMatch(host, '*.dev.local') || shExpMatch(host, 'localhost')) {
    return 'DIRECT'
  }

  // Rule 3: Media streaming
  if (shExpMatch(host, '*.netflix.com') || shExpMatch(host, '*.hulu.com')) {
    return 'SOCKS5 media-proxy.example.com:1080'
  }

  // Rule 4: Private network
  if (isInNet(host, '192.168.0.0', '255.255.0.0')) {
    return 'DIRECT'
  }

  // Default fallback
  return 'PROXY default-proxy.example.com:8080'
}
```

### B. Data Model Schema

```typescript
// Complete schema for Automatic Mode

interface AutoProxyRule {
  id: string // UUID
  pattern: string // "*.google.com"
  matchType: MatchType
  proxyId: string // Reference to ProxyConfig.id
  enabled: boolean
  priority: number // Lower = higher priority
  description?: string
  createdAt: number
  updatedAt: number
}

type MatchType =
  | 'wildcard' // Uses shExpMatch
  | 'regex' // Uses regex match
  | 'exact' // Exact hostname match
  | 'cidr' // IP range match

interface AppSettings {
  // Existing fields...
  quickSwitchEnabled: boolean
  activeScriptId: string | null
  proxyConfigs: ProxyConfig[]
  disableProxyOnStartup: boolean
  autoReloadOnProxySwitch: boolean

  // New fields for Automatic Mode
  autoProxyEnabled: boolean
  autoProxyRules: AutoProxyRule[]
  autoProxyFallback: string // 'direct' or proxyId
  autoProxyGeneratedPAC?: string // Cache of generated PAC
  autoProxyLastGenerated?: number // Timestamp
}
```

### C. UI Mockup Descriptions

**Settings Tab - Automatic Mode Section:**

```
┌─────────────────────────────────────────────────┐
│ ⚡ Automatic Mode                    [ Toggle ] │
├─────────────────────────────────────────────────┤
│ Automatically route traffic based on URL rules  │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ URL Pattern          Proxy      [Actions]   │ │
│ ├─────────────────────────────────────────────┤ │
│ │ *.google.com        Work Proxy   [Edit][Del]│ │
│ │ *.github.com        Personal     [Edit][Del]│ │
│ │ localhost           Direct       [Edit][Del]│ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [+ Add Rule]  [Import]  [Export]  [Test]       │
└─────────────────────────────────────────────────┘
```

**Add/Edit Rule Modal:**

```
┌─────────────────────────────────────────────────┐
│ Add Automatic Proxy Rule                    [X] │
├─────────────────────────────────────────────────┤
│                                                 │
│ URL Pattern *                                   │
│ [*.example.com                                ] │
│ ℹ️ Use * for wildcards (e.g., *.google.com)     │
│                                                 │
│ Match Type                                      │
│ ( ) Wildcard  ( ) Regex  ( ) Exact             │
│                                                 │
│ Use Proxy *                                     │
│ [Work Proxy ▼                                 ] │
│                                                 │
│ Description (optional)                          │
│ [Route all Google services through work proxy] │
│                                                 │
│ ☑ Enable this rule                             │
│                                                 │
│ [Test Pattern]           [Cancel]  [Save Rule] │
└─────────────────────────────────────────────────┘
```

---

**Document Version:** 1.0
**Last Updated:** January 2026
**Author:** Claude (AI Assistant)
**Reviewers:** TBD

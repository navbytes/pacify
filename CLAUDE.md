# PACify Extension - Claude AI Guide

This document provides comprehensive information about the PACify Chrome extension to help Claude AI understand the codebase and assist with development tasks effectively.

## Quick Project Overview

**PACify** is a modern Chrome extension (Manifest V3) for managing proxy configurations with a focus on quick switching between different proxy setups.

- **Version**: 1.22.0
- **Tech Stack**: Svelte 5, TypeScript, Vite 7, Tailwind CSS 4, Bun
- **Repository**: https://github.com/navbytes/pacify
- **Chrome Permissions**: `proxy`, `storage` only

## Technology Stack

### Core
- **Svelte 5** (runes API): `$props()`, `$state()`, `$derived()`, `$effect()` - NOT legacy syntax
- **TypeScript 5.9+**: Strict mode enabled
- **Vite 7**: Build tool with code splitting
- **Tailwind CSS 4**: Utility-first CSS
- **Bun**: Package manager and test runner

### Key Libraries
- **CodeMirror 6**: Lightweight code editor (replaced Monaco in v1.18.0)
- **Lucide Svelte**: Icon library
- **Playwright**: E2E testing
- **Bun Test**: Unit testing

## Project Structure (Key Locations)

```
src/
├── background/background.ts        # Service worker (message handling, proxy mgmt)
├── popup/Popup.svelte              # Quick switcher UI (384px wide)
├── options/Options.svelte          # Full settings page (tabbed interface)
│
├── components/
│   ├── ProxyConfig/                # Proxy configuration modal & forms
│   │   ├── ProxyConfigModal.svelte       # Main modal
│   │   ├── BasicSettings.svelte          # Name, color, mode
│   │   ├── PACScriptSettings.svelte      # PAC editor (CodeMirror)
│   │   └── ManualProxyConfiguration.svelte # Manual proxy forms
│   ├── DragDrop/                   # Drag-and-drop system
│   ├── Tabs/                       # Tab navigation
│   └── [others]                    # Card, Button, Toast, etc.
│
├── stores/
│   └── settingsStore.ts            # PRIMARY store - all state management
│
├── services/
│   ├── chrome/ChromeService.ts     # Chrome API wrapper
│   ├── StorageService.ts           # Settings persistence (Sync + cache)
│   ├── SettingsReader.ts           # Read settings (used by background)
│   ├── SettingsWriter.ts           # Write settings (used by background)
│   └── CodeMirrorService.ts        # Editor integration
│
├── interfaces/
│   ├── settings.ts                 # Core types (AppSettings, ProxyConfig)
│   ├── message.ts                  # Background message types
│   └── index.ts                    # Exports all interfaces
│
├── constants/
│   ├── app.ts                      # Default settings, constants
│   └── templates.ts                # PAC script templates
│
└── utils/
    ├── chrome.ts                   # Chrome API helpers
    ├── proxyUtils.ts               # Proxy validation/conversion
    └── errorHandling.ts            # Error wrappers
```

## Core Data Models

### AppSettings (Main State)
```typescript
interface AppSettings {
  quickSwitchEnabled: boolean          // One-click proxy cycling mode
  activeScriptId: string | null        // Currently active proxy ID
  proxyConfigs: ProxyConfig[]          // Array of proxy configurations
  disableProxyOnStartup: boolean       // Clear proxy on browser start
  autoReloadOnProxySwitch: boolean     // Auto-reload tabs when proxy changes
}
```

### ProxyConfig
```typescript
interface ProxyConfig {
  id?: string                    // Unique ID (UUID)
  name: string                   // Display name
  color: string                  // Visual identifier
  quickSwitch?: boolean          // Include in quick switch rotation
  isActive: boolean              // Currently active flag
  mode: ProxyMode                // Type: direct | auto_detect | pac_script | fixed_servers | system
  pacScript?: {                  // For mode=pac_script
    url?: string                 // External PAC URL
    data?: string                // Inline PAC script
    mandatory?: boolean          // Fail closed if PAC fails
  }
  rules?: ProxyRules             // For mode=fixed_servers
}
```

## Key Concepts & Patterns

### 1. State Management (settingsStore)

**Primary store**: `src/stores/settingsStore.ts`

```typescript
// Usage pattern
import { settingsStore } from '@/stores/settingsStore'

// Load settings
await settingsStore.load()

// Create/update proxy
await settingsStore.updatePACScript(proxyConfig, scriptId)

// Activate proxy (with MUTEX - prevents race conditions!)
await settingsStore.setProxy(scriptId, true)

// Delete proxy
await settingsStore.deletePACScript(scriptId)

// Toggle quick switch mode
await settingsStore.quickSwitchToggle(true)
```

**CRITICAL**: `setProxy()` uses a mutex pattern - never bypass it or call proxy changes directly!

### 2. Background Service Worker (Message Queue Pattern)

**File**: `src/background/background.ts`

**Key feature**: Message queue system prevents race conditions when service worker wakes from idle.

```typescript
// Message types
type BackgroundMessageType =
  | 'QUICK_SWITCH'    // Update quick switch mode
  | 'SET_PROXY'       // Activate proxy
  | 'CLEAR_PROXY'     // Deactivate proxy
  | 'SCRIPT_UPDATE'   // Script settings updated

// Send message from UI
await ChromeService.sendMessage({
  type: 'SET_PROXY',
  proxy: proxyConfig
})
```

**How it works**:
1. Messages arriving during initialization are queued
2. After initialization completes, queue is processed in order
3. Prevents lost messages when service worker wakes from idle

### 3. Storage Architecture (Cache + Chrome Storage)

```typescript
// StorageService: Two-layer system
// - Cache layer (in-memory)
// - Chrome Sync Storage (cross-device, 100KB limit)

// Read (with cache)
const settings = await StorageService.getSettings()

// Write (updates cache + storage)
await StorageService.saveSettings(settings)

// Invalidate cache (force fresh read)
await StorageService.invalidateCache()
```

**Cache invalidation points**:
- Background `QUICK_SWITCH` message (prevents stale data bug)
- Manual reload: `settingsStore.reloadSettings()`
- Initialization

### 4. Svelte 5 Component Pattern

**IMPORTANT**: Use Svelte 5 runes, NOT legacy syntax!

```svelte
<script lang="ts">
  // ✅ Correct (Svelte 5 runes)
  interface Props {
    title: string
    onSave?: () => void
  }

  let { title, onSave }: Props = $props()
  let count = $state(0)
  let doubled = $derived(count * 2)

  $effect(() => {
    console.log('count changed:', count)
  })

  // ❌ Incorrect (legacy syntax - DO NOT USE)
  // export let title
  // $: doubled = count * 2
</script>

<div>
  <h2>{title}</h2>
  <p>{count} * 2 = {doubled}</p>
  <button onclick={() => count++}>Increment</button>
</div>
```

## Common Development Tasks

### Adding a New Proxy Mode
1. Add to `ProxyMode` type in `src/interfaces/settings.ts`
2. Add mode option in `ProxyModeSelector.svelte`
3. Create settings component (like `PACScriptSettings.svelte`)
4. Update `convertAppSettingsToChromeConfig()` in `src/utils/chrome.ts`
5. Add validation if needed

### Adding a New Setting
1. Add field to `AppSettings` in `src/interfaces/settings.ts`
2. Update `DEFAULT_SETTINGS` in `src/constants/app.ts`
3. Add UI control in `SettingsTab.svelte`
4. Update store methods in `settingsStore.ts` if needed
5. Add i18n keys to `_locales/*/messages.json`

### Adding a Background Message Handler
1. Add type to `BackgroundMessageType` in `src/interfaces/message.ts`
2. Create message interface extending `BackgroundMessage`
3. Add handler to `messageHandlers` in `background.ts`
4. Update sender in ChromeService or component

### Updating Version
1. Update `version` in `manifest.json`
2. Update `version` in `package.json`
3. Add entry to `CHANGELOG.md`
4. Commit: `chore: bump version to X.Y.Z`

## Critical Patterns & Gotchas

### 1. Mutex Pattern (Prevent Proxy Race Conditions)
```typescript
// settingsStore maintains a mutex for proxy changes
let proxyChangePending: Promise<void> | null = null

// Always use settingsStore.setProxy() - never bypass!
await settingsStore.setProxy(scriptId, true)
```
**Why**: Prevents multiple proxy changes from overlapping → incorrect state.

### 2. Message Queue (Service Worker Wake-Up)
```typescript
// Background queues messages during initialization
if (!isInitialized) {
  messageQueue.push({ message, sender, sendResponse })
  return true
}
```
**Why**: Service worker can be asleep when message arrives. Fixed Issue #9.

### 3. Cache Invalidation
```typescript
// CRITICAL: Invalidate before reading fresh settings
SettingsReader.invalidateCache()
const settings = await SettingsReader.getSettings()
```
**Why**: Different contexts can have stale cached data.

### 4. Debounced vs Immediate Saves
```typescript
// Non-critical: Debounced (500ms) - UI preferences
handleSettingsChange(callback, true)

// Critical: Immediate - Proxy activation, QuickSwitch toggle
handleSettingsChange(callback, false)
```
**Why**: Reduces storage writes but ensures critical changes persist immediately.

### 5. QuickSwitch Flag Preservation
When editing a proxy, preserve the existing `quickSwitch` value:
```typescript
// In ProxyConfigModal.svelte
const existingQuickSwitch = script?.quickSwitch ?? false
// Include in saved config
```
**Bug history**: v1.20.0 fixed issue where editing reset this flag.

## Testing

### Unit Tests (Bun)
```bash
bun run test              # Run all unit tests
bun run test:watch        # Watch mode
bun run test:coverage     # Coverage report

# Test files: src/**/__tests__/*.test.ts
```

### E2E Tests (Playwright)
```bash
bun run test:e2e          # Run all E2E tests
bun run test:e2e:ui       # UI mode for debugging
bun run test:e2e:smoke    # Smoke tests only

# Test files: tests/e2e/*.spec.ts
```

## Build & Development

### Commands
```bash
# Development (hot reload)
bun run dev:extension

# Production build
bun run build

# Type check
bun run check

# Lint & fix
bun run lint:fix

# Format
bun run format

# All quality checks
bun run check && bun run lint && bun run test
```

### Build Output
```
dist/
├── manifest.json              # Extension manifest
├── icons/                     # Extension icons
├── _locales/                  # i18n files
├── src/
│   ├── popup/popup.html
│   └── options/options.html
└── assets/
    ├── background.js          # Service worker
    ├── popup.js               # Popup UI
    ├── options.js             # Options UI
    ├── vendor.[hash].js       # Svelte + libs (~200KB)
    └── codemirror.[hash].js   # CodeMirror (~150KB, separate chunk)
```

## Recent Version History

### v1.22.0 (Current - 2024-11-13)
- Consolidated tabs: Moved Help & Resources to Settings tab
- Removed About tab and unused analytics components
- Cleaner 2-tab interface

### v1.21.0 (2024-11-13)
- Added auto-reload toggle setting
- Fixed manual proxy save error (DataCloneError)
- Improved settings UI layout

### v1.20.0 (2024-10-24)
- Modern button navigation
- Enhanced proxy cards
- Fixed quickSwitch preservation bug
- Automatic tab reload on proxy change

### v1.18.0
- Replaced Monaco with CodeMirror 6 (87% smaller bundle!)
- Faster initialization

### v1.10.0
- **CRITICAL FIX**: Message queueing system (Issue #9: Extension doesn't switch after idle)
- Cache invalidation
- Response validation

## Debugging Tips

### Background Script
1. Go to `chrome://extensions/`
2. Find PACify
3. Click "service worker" link
4. Opens DevTools for background

### Popup/Options
1. Right-click popup/options page
2. "Inspect"
3. DevTools opens

### Storage
1. DevTools → Application tab
2. Storage → Chrome Sync / Local
3. View saved settings

### Common Issues

**Extension not loading**: Check `dist/manifest.json` exists, verify build succeeded

**Changes not reflecting**: Click "Reload" in chrome://extensions/

**Service worker not receiving messages**: Check background script logs, verify handler exists

**Proxy not switching**: Check storage in DevTools, invalidate cache, verify config is valid

## File Location Quick Reference

### UI Changes
- Popup: `src/popup/Popup.svelte`
- Options: `src/options/Options.svelte`
- Proxy Modal: `src/components/ProxyConfig/ProxyConfigModal.svelte`
- Settings Tab: `src/options/SettingsTab.svelte`

### Logic Changes
- Background: `src/background/background.ts`
- State: `src/stores/settingsStore.ts`
- Chrome API: `src/services/chrome/ChromeService.ts`
- Storage: `src/services/StorageService.ts`

### Types
- Settings: `src/interfaces/settings.ts`
- Messages: `src/interfaces/message.ts`
- All: `src/interfaces/index.ts`

### Config
- Manifest: `manifest.json`
- Build: `vite.config.ts`
- TypeScript: `tsconfig.json`
- Tailwind: `tailwind.config.js`

## Architecture Summary

### Three Runtime Contexts
1. **Service Worker** (background.ts): Message handling, proxy management, badge updates
2. **Popup** (popup.svelte): Quick proxy switcher (384px wide)
3. **Options Page** (options.svelte): Full settings interface with tabs

### Data Flow (Proxy Activation)
```
User clicks "Activate"
  → ScriptItem.svelte
  → settingsStore.setProxy(id, true)
  → Update state + Save storage
  → ChromeService.sendMessage({ type: 'SET_PROXY', proxy })
  → Background receives message
  → setProxySettings(proxy)
  → chrome.proxy.settings.set()
  → Reload active tab (if autoReload enabled)
  → Update badge
  → Proxy active!
```

### State Management Flow
```
UI Component
  ↓ (calls method)
settingsStore
  ↓ (reads/writes)
StorageService (with cache)
  ↓ (uses)
Chrome Storage API (Sync)
```

## Security & Privacy

- **Minimal permissions**: Only `proxy` and `storage`
- **No external servers**: All data local/sync storage
- **No analytics**: Zero telemetry
- **No network requests**: Fully offline
- **Open source**: Full code audit available
- **Manifest V3**: Latest Chrome security standards

## Code Quality

- **TypeScript**: Strict mode
- **ESLint**: TypeScript + Svelte plugins
- **Prettier**: Auto-formatting
- **Husky**: Pre-commit hooks
- **Lint-staged**: Only lint changed files

## Resources

- **README.md**: User documentation
- **DEVELOPMENT.md**: Developer guide
- **CHANGELOG.md**: Version history
- **Chrome Extension Docs**: https://developer.chrome.com/docs/extensions/
- **Svelte 5 Docs**: https://svelte.dev/docs/svelte/overview

---

**Document Version**: 1.0
**Last Updated**: 2024-11-13
**Purpose**: Claude AI reference guide for PACify development assistance

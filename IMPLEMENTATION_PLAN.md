# PACify Enhancement Implementation Plan

## Table of Contents

- [Executive Summary](#executive-summary)
- [Phase 1: Quick Wins (Low Complexity)](#phase-1-quick-wins)
- [Phase 2: Core Features (Medium Complexity)](#phase-2-core-features)
- [Phase 3: Advanced Features (High Complexity)](#phase-3-advanced-features)
- [Phase 4: Power User Features (High Complexity)](#phase-4-power-user-features)
- [Shared Infrastructure](#shared-infrastructure)
- [Manifest Changes Summary](#manifest-changes-summary)

---

## Executive Summary

22 features organized into 4 phases by complexity and dependency order. Each feature includes a feasibility assessment, required changes, and implementation steps.

### New Permissions Required

| Permission | Features That Need It |
|---|---|
| `privacy` | WebRTC Leak Protection, DNS-over-HTTPS |
| `webRequest` | Proxy Usage Logging, Rule Hit Counter |
| `commands` (manifest key) | Keyboard Shortcut |
| `omnibox` (manifest key) | Omnibox Integration |

### Shared Infrastructure (Build First)

These cross-cutting concerns support multiple features and should be built before individual features:

1. **Settings schema migration system** — needed by almost every feature (new fields in `AppSettings`)
2. **Extended `ProxyConfig` interface** — new fields for groups, chains, schedules, credentials
3. **New storage namespace for history/stats** — versioning, traffic stats, rule hits use `storage.local`

---

## Phase 1: Quick Wins

Low complexity, high impact, no major architectural changes.

---

### 1.1 Keyboard Shortcut for Quick Switch

**Feasibility: FULLY FEASIBLE**

- `chrome.commands` API is fully supported in MV3
- Works in service workers
- No new permissions needed (declared in manifest `commands` key)
- Limitation: max 4 suggested shortcuts; global shortcuts restricted to `Ctrl+Shift+[0-9]`

**Current State:**
- Options page already has keyboard shortcuts (`Ctrl+N`, `Ctrl+K`, `?`, `Esc`) — but these are in-page only
- Background already handles `chrome.action.onClicked` for quick switch cycling
- Quick switch logic exists in `handleActionClick()` in `background.ts`

**Implementation:**

1. **`manifest.json`** — Add `commands` key:
   ```json
   "commands": {
     "quick-switch": {
       "suggested_key": { "default": "Alt+Shift+P" },
       "description": "Quick switch to next proxy"
     },
     "disable-proxy": {
       "suggested_key": { "default": "Alt+Shift+O" },
       "description": "Disable proxy (direct connection)"
     }
   }
   ```

2. **`background.ts`** — Add `chrome.commands.onCommand` listener:
   - `"quick-switch"` → reuse existing `handleActionClick()` logic
   - `"disable-proxy"` → reuse existing `clearProxySettings()` logic
   - Must register at top level of service worker (not inside async)

3. **`OnboardingModal.svelte`** — Update keyboard shortcuts step to mention global shortcuts

4. **`SettingsTab.svelte`** — Add a "Keyboard Shortcuts" section with link to `chrome://extensions/shortcuts`

**Files to modify:** `manifest.json`, `background.ts`, `OnboardingModal.svelte`, `SettingsTab.svelte`
**Estimated scope:** ~50 lines

---

### 1.2 WebRTC Leak Protection

**Feasibility: FULLY FEASIBLE**

- `chrome.privacy.network.webRTCIPHandlingPolicy` available in MV3
- Works in service workers
- Requires new `privacy` permission
- 4 policy values; `disable_non_proxied_udp` is the strongest protection
- Enterprise/other extensions can override via `levelOfControl`

**Current State:**
- No privacy API usage anywhere in the codebase
- Settings store has `AppSettings` interface — needs new field
- Background service worker manages proxy lifecycle — natural place to toggle WebRTC

**Implementation:**

1. **`manifest.json`** — Add `"privacy"` to permissions array

2. **`settings.ts`** (interfaces) — Add to `AppSettings`:
   ```typescript
   webRTCProtection: boolean  // default: false
   ```

3. **`settingsStore.ts`** — Add `toggleWebRTCProtection()` method:
   - Call `chrome.privacy.network.webRTCIPHandlingPolicy.set()`
   - Value: `"disable_non_proxied_udp"` when enabled, `"default"` when disabled
   - Check `levelOfControl` before setting; warn if controlled by other extension/policy

4. **`background.ts`** — On proxy activation, if `webRTCProtection` is enabled, also set WebRTC policy. On proxy clear, optionally revert.

5. **`SettingsTab.svelte`** — Add toggle in "Proxy Behavior" section:
   - "Prevent WebRTC IP Leak" with tooltip explaining what it does
   - Show warning if controlled by another extension

6. **`_locales/`** — Add i18n strings for all 12 languages

**Files to modify:** `manifest.json`, `settings.ts`, `settingsStore.ts`, `background.ts`, `SettingsTab.svelte`, `_locales/*/messages.json`
**Estimated scope:** ~120 lines

---

### 1.3 Export to PAC File

**Feasibility: FULLY FEASIBLE**

- `PACScriptGenerator.ts` already generates PAC scripts from Auto-Proxy rules
- Just need a "Download as .pac" button
- No new APIs or permissions needed

**Current State:**
- `PACScriptGenerator.generate()` returns a complete PAC script string
- `BackupRestore.svelte` already has file download logic (creates blob, triggers download)
- Auto-Proxy configs stored in `ProxyConfig.autoProxy`

**Implementation:**

1. **`PACScriptGenerator.ts`** — Add `exportAsFile(config: ProxyConfig): string` method:
   - For `auto_proxy` mode: generate PAC from rules (already exists)
   - For `pac_script` mode with `data`: return the inline script directly
   - For `pac_script` mode with `url`: fetch and return the content
   - Add header comment with export date, config name

2. **`ScriptItem.svelte`** (or card context menu) — Add "Export as PAC" option:
   - Only visible for pac_script and auto_proxy mode configs
   - Triggers download of `{config-name}.pac` file

3. **`AutoProxyModal.svelte`** — Add "Export PAC" button in the modal footer

**Files to modify:** `PACScriptGenerator.ts`, `ScriptItem.svelte`, `AutoProxyModal.svelte`
**Estimated scope:** ~60 lines

---

### 1.4 Chrome Omnibox Integration

**Feasibility: FULLY FEASIBLE**

- `chrome.omnibox` API fully supported in MV3
- Works in service workers
- No permissions needed beyond manifest `omnibox` key
- Supports rich suggestions with `<match>` and `<dim>` formatting

**Current State:**
- No omnibox usage in codebase
- Background already has proxy switching logic
- Settings reader can load proxy configs by name

**Implementation:**

1. **`manifest.json`** — Add omnibox keyword:
   ```json
   "omnibox": { "keyword": "px" }
   ```

2. **`background.ts`** — Add omnibox event listeners (top-level registration):
   - `chrome.omnibox.onInputChanged` — fuzzy-match proxy names, return suggestions
   - `chrome.omnibox.onInputEntered` — find matching proxy config, call `setProxySettings()`
   - Special commands: `"off"` / `"direct"` → clear proxy, `"list"` → open options page
   - Load proxy configs from storage on each input event (service worker may have restarted)

3. **`OnboardingModal.svelte`** — Mention omnibox feature in shortcuts step

**Files to modify:** `manifest.json`, `background.ts`, `OnboardingModal.svelte`
**Estimated scope:** ~80 lines

---

### 1.5 Notification Actions

**Feasibility: FULLY FEASIBLE (with OS caveats)**

- `chrome.notifications` API supports `buttons` (max 2) in MV3
- `chrome.notifications.onButtonClicked` works in service workers
- Caveat: button rendering is OS-dependent; macOS may not show buttons
- Extension already has `notifications` permission

**Current State:**
- `NotificationService.ts` creates basic notifications via `chrome.notifications.create()`
- Background already handles proxy switch events
- No button handlers registered

**Implementation:**

1. **`NotificationService.ts`** — Enhance `show()` to accept optional `buttons` array:
   ```typescript
   interface NotificationButton {
     title: string
     action: string  // identifier for the button handler
   }
   ```

2. **`background.ts`** — Register `chrome.notifications.onButtonClicked` listener at top level:
   - Map notification IDs to actions (store in memory or `storage.session`)
   - Actions: `"undo-switch"` → restore previous proxy, `"open-settings"` → open options page

3. **Update notification calls** in background.ts:
   - Proxy switch notification: add "Undo" and "Settings" buttons
   - Proxy error notification: add "Retry" and "Settings" buttons

4. **Track previous proxy state** — store `previousActiveScriptId` in `storage.session` for undo

**Files to modify:** `NotificationService.ts`, `background.ts`
**Estimated scope:** ~80 lines

---

### 1.6 Badge Customization

**Feasibility: PARTIALLY FEASIBLE**

- `chrome.action.setBadgeText()` limited to 4 characters (Chrome truncates)
- `chrome.action.setBadgeBackgroundColor()` supports any color
- `chrome.action.setIcon()` can set custom per-pixel icons (ImageData or path)
- No emoji support in badge text (Chrome renders them as squares)
- Canvas API NOT available in service workers — cannot dynamically generate icons there
- Can use offscreen documents to generate canvas-based icons in MV3

**Current State:**
- `updateBadge()` in `background.ts` sets text + color from `ProxyConfig.badgeLabel` and `.color`
- `ProxyConfig` has `color` (8 options) and `badgeLabel` (1-4 chars)
- Badge colors defined in constants

**Implementation:**

1. **`settings.ts`** — Extend badge options in `ProxyConfig`:
   ```typescript
   badgeStyle?: 'text' | 'dot' | 'icon'
   badgeIcon?: string  // predefined icon key: 'shield', 'lock', 'globe', etc.
   ```

2. **Create `BadgeIconService.ts`** — Precomputed 16x16 / 19x19 icon data:
   - Store a set of predefined mini-icons as base64 PNG data URLs
   - Precompute them at build time (avoid canvas in service worker)
   - Icons: shield, lock, globe, bolt, chain, eye, etc.
   - Generate colored variants by overlaying the proxy's color

3. **`background.ts`** — Update `updateBadge()`:
   - If `badgeStyle === 'dot'`: set 1-char badge with color
   - If `badgeStyle === 'icon'`: use `chrome.action.setIcon()` with precomputed icon
   - If `badgeStyle === 'text'`: current behavior

4. **`BasicSettings.svelte`** — Add badge style selector:
   - Segmented control: Text | Dot | Icon
   - If Icon: show icon picker grid

5. **Precompute icons** — Add build script to generate colored icon variants as PNG data

**Files to modify:** `settings.ts`, new `BadgeIconService.ts`, `background.ts`, `BasicSettings.svelte`
**Estimated scope:** ~200 lines + icon assets

---

### 1.7 Bypass Proxy for Current Site

**Feasibility: FULLY FEASIBLE**

- Can modify the active proxy's bypass list dynamically
- For `fixed_servers` mode: add domain to `bypassList`
- For `pac_script` / `auto_proxy` mode: add a "direct" rule for the domain
- Need current tab's URL via `chrome.tabs.query()`

**Current State:**
- Popup shows active proxy and has footer controls
- `ProxyConfig.rules.bypassList` exists for manual proxies
- `AutoProxyConfig.rules` exists for auto-proxy
- `chrome.tabs` permission already granted

**Implementation:**

1. **`Popup.svelte`** — Add "Bypass for this site" button in footer:
   - Get current tab URL via `chrome.tabs.query({ active: true, currentWindow: true })`
   - Extract hostname
   - Show confirmation with the domain name

2. **`settingsStore.ts`** — Add `bypassCurrentSite(hostname: string)` method:
   - If active proxy is `fixed_servers`: append to `rules.bypassList`
   - If active proxy is `auto_proxy`: add a priority-0 "direct" rule for the hostname
   - If active proxy is `pac_script`: not supported (show message)
   - Re-apply proxy settings after modification

3. **`settings.ts`** — Add `temporaryBypasses: string[]` field to `AppSettings`:
   - Track temporarily bypassed domains separately
   - Allow clearing all temporary bypasses

4. **`Popup.svelte`** — Show indicator when current site is bypassed

**Files to modify:** `Popup.svelte`, `settingsStore.ts`, `settings.ts`, `background.ts`
**Estimated scope:** ~150 lines

---

## Phase 2: Core Features

Medium complexity, may require new services or components.

---

### 2.1 IP Leak Test

**Feasibility: FULLY FEASIBLE**

- Fetch public IP from well-known APIs (e.g., `https://api.ipify.org?format=json`, `https://httpbin.org/ip`)
- Works from extension context (has `<all_urls>` host permission)
- Can compare IP with/without proxy to detect leaks
- Should test both IPv4 and IPv6

**Current State:**
- No IP checking functionality exists
- Extension has `<all_urls>` host permission (can fetch any URL)
- Popup has space for a footer area

**Implementation:**

1. **Create `IPLeakService.ts`**:
   ```typescript
   interface IPCheckResult {
     ip: string
     source: string  // which API responded
     timestamp: number
     proxyActive: boolean
     proxyName?: string
   }

   async checkIP(): Promise<IPCheckResult>
   async checkIPv6(): Promise<IPCheckResult | null>
   async runFullLeakTest(): Promise<LeakTestResult>
   ```
   - Use multiple fallback APIs for reliability
   - Compare results: if proxy is active but IP matches known direct IP → leak detected
   - Check WebRTC leak status too (via `chrome.privacy` API)

2. **Create `IPLeakTestModal.svelte`** (new component):
   - "Check My IP" button
   - Shows: current IP, country/ISP (from ip-api.com), proxy status
   - Traffic light indicator: green (no leak), yellow (partial), red (leak detected)
   - "Save baseline IP" button — stores direct-connection IP for future comparisons
   - WebRTC leak status row

3. **`Popup.svelte`** — Add small "IP Check" icon button in footer bar

4. **`SettingsTab.svelte`** or **`DiagnosticsTab.svelte`** — Add "Run Full Leak Test" option

**Files to create:** `IPLeakService.ts`, `IPLeakTestModal.svelte`
**Files to modify:** `Popup.svelte`, `DiagnosticsTab.svelte`
**Estimated scope:** ~300 lines

---

### 2.2 PAC Script Linting

**Feasibility: FULLY FEASIBLE**

- CodeMirror 6 already integrated with `@codemirror/lint` package installed
- Can validate PAC scripts for: syntax errors, missing `FindProxyForURL`, invalid return values
- Extension already has `CodeMirrorService.ts`

**Current State:**
- `CodeMirrorService.ts` sets up CodeMirror with JS syntax highlighting and autocompletion
- `@codemirror/lint` is in dependencies but not yet used
- `ScriptService.ts` has basic PAC validation
- PAC editor is in `PACScriptSettings.svelte`

**Implementation:**

1. **Create `PACLintService.ts`**:
   ```typescript
   interface PACLintResult {
     line: number
     column: number
     severity: 'error' | 'warning' | 'info'
     message: string
   }

   function lintPACScript(code: string): PACLintResult[]
   ```
   Rules to check:
   - **Error**: Syntax errors (try `new Function(code)`)
   - **Error**: Missing `FindProxyForURL` function
   - **Error**: `FindProxyForURL` doesn't take exactly 2 params
   - **Warning**: Return value doesn't match PAC format (`PROXY`, `DIRECT`, `SOCKS`, etc.)
   - **Warning**: Using `alert()` (log to diagnostics instead)
   - **Info**: Using deprecated functions
   - **Warning**: Regex patterns that could cause ReDoS (exponential backtracking)

2. **`CodeMirrorService.ts`** — Integrate lint extension:
   ```typescript
   import { linter, lintGutter } from '@codemirror/lint'
   // Add to extensions array
   ```

3. **`PACScriptSettings.svelte`** — Add lint toggle and error count indicator

**Files to create:** `PACLintService.ts`
**Files to modify:** `CodeMirrorService.ts`, `PACScriptSettings.svelte`
**Estimated scope:** ~200 lines

---

### 2.3 PAC Script Debugging

**Feasibility: PARTIALLY FEASIBLE (with workaround)**

- Chrome PAC `alert()` only logs to NetLog (`chrome://net-export/`), not accessible via extension API
- **Workaround**: Rewrite `alert()` calls in the PAC script to store messages in a variable, then extract them
- `chrome.proxy.onProxyError` can capture PAC errors in the service worker

**Current State:**
- `DiagnosticsService.ts` has logging infrastructure
- `PACScriptGenerator.ts` generates PAC scripts
- Background listens for proxy errors already

**Implementation:**

1. **`PACScriptGenerator.ts`** — Add debug instrumentation option:
   ```javascript
   // Inject at top of PAC script when debug mode is on:
   var __pacDebugLog = [];
   var alert = function(msg) { __pacDebugLog.push(msg); };
   ```
   - Note: This only works for inline PAC scripts (`pacScript.data`), not URL-based ones

2. **`background.ts`** — Register `chrome.proxy.onProxyError` listener:
   - Log all PAC errors to `DiagnosticsService`
   - Include the error message, line number, and URL that triggered it

3. **`settings.ts`** — Add `pacDebugMode: boolean` to `AppSettings`

4. **`DiagnosticsTab.svelte`** — Add "PAC Debug" section:
   - Toggle debug mode
   - Show PAC errors with timestamp and triggering URL
   - Link to `chrome://net-export/` for full NetLog debugging

5. **`PACScriptSettings.svelte`** — Add "Debug Mode" toggle in editor toolbar

**Files to modify:** `PACScriptGenerator.ts`, `background.ts`, `settings.ts`, `DiagnosticsTab.svelte`, `PACScriptSettings.svelte`
**Estimated scope:** ~150 lines

---

### 2.4 Proxy Config Grouping / Folders

**Feasibility: FULLY FEASIBLE**

- Pure UI/data model change
- No new Chrome APIs needed
- Storage impact: minimal (just group names + assignments)

**Current State:**
- Proxy configs are a flat array in `AppSettings.proxyConfigs`
- `ScriptList.svelte` renders configs as flat list or grid
- Search exists in options page
- Drag-and-drop exists for quick switch ordering

**Implementation:**

1. **`settings.ts`** — Add group support:
   ```typescript
   interface ProxyGroup {
     id: string
     name: string
     color?: string
     collapsed?: boolean
     order: number
   }

   // Add to ProxyConfig:
   groupId?: string

   // Add to AppSettings:
   proxyGroups: ProxyGroup[]
   ```

2. **Create `GroupManager.svelte`** — Group CRUD UI:
   - Create/rename/delete groups
   - Color picker for groups
   - Drag configs between groups

3. **Create `GroupedScriptList.svelte`** — Grouped rendering:
   - Collapsible group headers
   - "Ungrouped" section for configs without a group
   - Maintain grid/list view within groups
   - Drag-and-drop between groups

4. **`settingsStore.ts`** — Add group management methods:
   - `createGroup()`, `updateGroup()`, `deleteGroup()`
   - `moveToGroup(configId, groupId)`
   - `reorderGroups()`

5. **`ProxyConfigModal.svelte`** → `BasicSettings.svelte` — Add group selector dropdown

6. **`Popup.svelte`** — Show grouped configs with collapsible sections

**Files to create:** `GroupManager.svelte`, `GroupedScriptList.svelte`
**Files to modify:** `settings.ts`, `settingsStore.ts`, `ScriptList.svelte`, `BasicSettings.svelte`, `Popup.svelte`
**Estimated scope:** ~400 lines

---

### 2.5 Config Versioning / Undo

**Feasibility: FULLY FEASIBLE (local storage only)**

- `chrome.storage.local` has 10MB default quota (unlimited with permission)
- `chrome.storage.onChanged` provides `oldValue` and `newValue`
- Cannot use `storage.sync` for history (100KB limit)

**Current State:**
- Settings saved via `StorageService` with debounced writes
- `BackupRestore.svelte` handles full export/import
- No change tracking exists

**Implementation:**

1. **Create `VersioningService.ts`**:
   ```typescript
   interface ConfigSnapshot {
     id: string
     timestamp: number
     description: string  // auto-generated: "Added proxy 'Work'", "Modified proxy 'Home'"
     settings: AppSettings
   }

   // Store in chrome.storage.local under 'configHistory' key
   async saveSnapshot(description: string): Promise<void>
   async getHistory(): Promise<ConfigSnapshot[]>
   async restoreSnapshot(snapshotId: string): Promise<void>
   async deleteSnapshot(snapshotId: string): Promise<void>
   ```
   - Keep last 50 snapshots (configurable)
   - Auto-cleanup snapshots older than 30 days
   - Each snapshot stores a deep copy of `AppSettings`
   - Size management: calculate per-snapshot size, warn if approaching limits

2. **`settingsStore.ts`** — Call `VersioningService.saveSnapshot()` on meaningful changes:
   - Proxy created/updated/deleted
   - Settings changed
   - Backup restored
   - Skip snapshots for trivial changes (view mode, theme)

3. **Create `VersionHistoryModal.svelte`**:
   - Timeline view of changes
   - Each entry: timestamp, description, diff summary
   - "Restore" button per entry
   - "Compare" to see what changed
   - "Clear History" button

4. **`SettingsTab.svelte`** — Add "Version History" button in Data Management section

5. **Add undo shortcut** — `Ctrl+Z` in options page triggers last snapshot restore (with confirmation)

**Files to create:** `VersioningService.ts`, `VersionHistoryModal.svelte`
**Files to modify:** `settingsStore.ts`, `SettingsTab.svelte`, `Options.svelte`
**Estimated scope:** ~350 lines

---

### 2.6 Shareable Config Links

**Feasibility: FULLY FEASIBLE (with size caveats)**

- Base64-encode a proxy config → generate a shareable string
- Use URL-safe base64 to create links
- Compression (e.g., `CompressionStream` API) can reduce size
- Size limit: browser URL bars typically support ~2000 chars; use a custom scheme instead

**Current State:**
- `BackupRestore.svelte` exports full settings as JSON
- Proxy configs are serializable JSON objects

**Implementation:**

1. **Create `SharingService.ts`**:
   ```typescript
   async encodeConfig(config: ProxyConfig): Promise<string>   // → base64 string
   async decodeConfig(encoded: string): Promise<ProxyConfig>  // → config object
   generateShareLink(encoded: string): string                 // → pacify://import/...
   ```
   - Strip unnecessary fields (id, isActive) before encoding
   - Use `CompressionStream('gzip')` for compression
   - Add version header for forward compatibility
   - Validate decoded config structure

2. **`ScriptItem.svelte`** — Add "Share" option in context menu:
   - Generates encoded string
   - Copy to clipboard button
   - Show QR code (optional, using a small QR library)

3. **`Options.svelte`** — Handle `?import=<encoded>` URL parameter:
   - Decode and validate the config
   - Show preview modal before importing
   - Auto-open when extension detects the URL param

4. **Create `ImportPreviewModal.svelte`** — Shows config details before importing

**Files to create:** `SharingService.ts`, `ImportPreviewModal.svelte`
**Files to modify:** `ScriptItem.svelte`, `Options.svelte`
**Estimated scope:** ~250 lines

---

### 2.7 Sync with External Config Sources

**Feasibility: FULLY FEASIBLE**

- Similar to existing PAC URL auto-refresh feature
- Fetch JSON/YAML from URL, parse into `ProxyConfig` objects
- Already have `chrome.alarms` for periodic refresh

**Current State:**
- PAC scripts already support URL-based auto-refresh with configurable intervals
- `background.ts` has alarm handling for PAC refresh
- `SettingsReader` / `SettingsWriter` handle config persistence

**Implementation:**

1. **`settings.ts`** — Add external sync config:
   ```typescript
   interface ExternalSyncConfig {
     url: string
     format: 'json' | 'yaml' | 'pac'
     updateInterval: number  // minutes
     lastFetched?: number
     lastError?: string
     autoMerge: boolean  // auto-merge or require confirmation
     configMapping?: Record<string, string>  // field mapping for custom formats
   }

   // Add to AppSettings:
   externalSync?: ExternalSyncConfig
   ```

2. **Create `ExternalSyncService.ts`**:
   - Fetch and parse remote configs
   - JSON format: expect array of proxy config objects
   - Merge logic: match by name, update existing, add new, optionally remove deleted
   - Conflict resolution: remote wins / local wins / ask user

3. **`background.ts`** — Add alarm for external sync refresh:
   - Reuse alarm pattern from PAC refresh
   - On alarm: fetch, parse, merge, notify user of changes

4. **Create `ExternalSyncModal.svelte`** — Configuration UI:
   - URL input with test button
   - Format selector
   - Update interval picker
   - Merge strategy selector
   - Last sync status display

5. **`SettingsTab.svelte`** — Add "External Sync" section in Data Management

**Files to create:** `ExternalSyncService.ts`, `ExternalSyncModal.svelte`
**Files to modify:** `settings.ts`, `background.ts`, `SettingsTab.svelte`
**Estimated scope:** ~400 lines

---

## Phase 3: Advanced Features

Higher complexity, may require significant new infrastructure.

---

### 3.1 Import from Other Extensions

**Feasibility: FULLY FEASIBLE (SwitchyOmega); PARTIAL (FoxyProxy)**

- **SwitchyOmega**: Exports `.bak` files (JSON or base64-encoded JSON). Format is undocumented but reverse-engineered. Profile types: `FixedProfile`, `PacProfile`, `SwitchProfile`, `RuleListProfile`. Keys prefixed with `+` for profiles, `-` for settings.
- **FoxyProxy**: Exports as JSON. Format is simpler but also undocumented.
- Import requires mapping their data models to PACify's `ProxyConfig` interface.

**Current State:**
- `BackupRestore.svelte` handles PACify's own JSON backup format
- File picker and JSON parsing already exist

**Implementation:**

1. **Create `ImportService.ts`** with format-specific parsers:

   ```typescript
   interface ImportResult {
     configs: ProxyConfig[]
     warnings: string[]     // partial imports, unsupported features
     source: 'switchyomega' | 'foxyproxy' | 'pacify'
   }

   function detectFormat(data: string): 'switchyomega' | 'foxyproxy' | 'pacify' | 'unknown'
   function importSwitchyOmega(data: object): ImportResult
   function importFoxyProxy(data: object): ImportResult
   ```

2. **SwitchyOmega parser** (`parsers/SwitchyOmegaParser.ts`):
   - Detect base64 encoding, decode if needed
   - Map profile types:
     - `FixedProfile` → `fixed_servers` mode
     - `PacProfile` → `pac_script` mode
     - `SwitchProfile` → `auto_proxy` mode (map rules to Auto-Proxy rules)
     - `RuleListProfile` → `auto_proxy` mode (parse AutoProxy rule format)
   - Map condition types:
     - `HostWildcardCondition` → wildcard match
     - `UrlRegexCondition` → regex match
     - `BypassCondition` → bypass list entry
   - Map proxy schemes: `socks5` → `socks5`, etc.
   - Import colors and profile names

3. **FoxyProxy parser** (`parsers/FoxyProxyParser.ts`):
   - Simpler flat structure
   - Map proxy type, host, port, patterns

4. **Create `ImportModal.svelte`**:
   - File picker (accepts `.bak`, `.json`)
   - Auto-detect format with preview
   - Show list of configs to import with checkboxes
   - Show warnings for unsupported features
   - "Import Selected" button

5. **`BackupRestore.svelte`** — Add "Import from Other Extensions" button alongside existing restore

**Files to create:** `ImportService.ts`, `parsers/SwitchyOmegaParser.ts`, `parsers/FoxyProxyParser.ts`, `ImportModal.svelte`
**Files to modify:** `BackupRestore.svelte`
**Estimated scope:** ~600 lines

---

### 3.2 Proxy Profiles with Schedules

**Feasibility: FULLY FEASIBLE**

- `chrome.alarms` API supports recurring alarms (already used for PAC refresh)
- Service worker can switch proxies on alarm trigger
- Need to handle timezone-aware scheduling
- Alarms are throttled to 1/minute minimum in MV3

**Current State:**
- `chrome.alarms` already used for PAC script auto-refresh
- Background has `handleAlarm()` dispatcher
- Proxy switching logic exists in `setProxySettings()` / `clearProxySettings()`

**Implementation:**

1. **`settings.ts`** — Add schedule types:
   ```typescript
   interface ProxySchedule {
     id: string
     proxyId: string           // which proxy to activate
     enabled: boolean
     type: 'daily' | 'weekly' | 'custom'
     // Daily: same time every day
     startTime: string         // "09:00" (24h format)
     endTime: string           // "17:00"
     // Weekly: specific days
     days?: number[]           // 0=Sun, 1=Mon, ..., 6=Sat
     // What to do outside schedule
     fallbackAction: 'direct' | 'previous' | 'specific'
     fallbackProxyId?: string
     timezone: string          // IANA timezone (e.g., "America/New_York")
   }

   // Add to AppSettings:
   schedules: ProxySchedule[]
   schedulingEnabled: boolean
   ```

2. **Create `ScheduleService.ts`**:
   - Calculate next alarm time based on schedule + timezone
   - Register/clear Chrome alarms for each schedule
   - Handle schedule overlap resolution (last-defined wins, or priority)
   - `evaluateSchedules()` — check all schedules, determine which proxy should be active now

3. **`background.ts`** — Extend alarm handler:
   - New alarm type: `schedule:{scheduleId}`
   - On trigger: evaluate schedule, switch proxy if needed
   - On browser startup: evaluate all schedules immediately
   - Re-register alarms after browser restart

4. **Create `ScheduleEditor.svelte`**:
   - Time range picker (start/end)
   - Day-of-week checkboxes
   - Proxy selector dropdown
   - Fallback action selector
   - Timezone selector
   - Enable/disable toggle per schedule
   - Visual timeline showing scheduled blocks

5. **Create `SchedulesTab.svelte`** — New tab in Options page:
   - List of schedules
   - Add/edit/delete schedules
   - Global enable/disable toggle
   - Current schedule status indicator

6. **`Options.svelte`** — Add "Schedules" tab (4th tab)

**Files to create:** `ScheduleService.ts`, `ScheduleEditor.svelte`, `SchedulesTab.svelte`
**Files to modify:** `settings.ts`, `background.ts`, `Options.svelte`
**Estimated scope:** ~600 lines

---

### 3.3 Proxy Usage Logging / Traffic Stats

**Feasibility: PARTIALLY FEASIBLE**

- `chrome.webRequest.onCompleted` can count requests per proxy config
- `Content-Length` header gives approximate response size (not exact wire bytes)
- **Major caveat**: Service worker lifecycle — it can terminate, losing in-memory counters
- Must persist to storage frequently (batch writes every 30 seconds or N requests)
- `webRequest` permission required + `webRequestAuthRequired` for response headers
- Observational (non-blocking) webRequest is fine in MV3

**Current State:**
- No `webRequest` usage in codebase
- No traffic tracking
- `DiagnosticsService` has logging but not metrics

**Implementation:**

1. **`manifest.json`** — Add `"webRequest"` permission

2. **`settings.ts`** — Add stats types:
   ```typescript
   interface ProxyStats {
     proxyId: string
     date: string           // "2024-01-15" — daily buckets
     requestCount: number
     byteEstimate: number   // from Content-Length
     errorCount: number
     domains: Record<string, number>  // top domains by request count
   }

   // Add to AppSettings:
   trafficStatsEnabled: boolean
   ```

3. **Create `TrafficStatsService.ts`**:
   - Register `chrome.webRequest.onCompleted` listener (non-blocking)
   - Batch stats in memory, flush to `storage.local` every 30 seconds
   - Daily aggregation buckets
   - Top-N domains tracking (keep top 50 per day)
   - Auto-cleanup: remove stats older than 30 days
   - Methods: `getStats(proxyId, dateRange)`, `clearStats()`, `exportStats()`

4. **`background.ts`** — Initialize `TrafficStatsService` on startup:
   - Start/stop tracking based on `trafficStatsEnabled` setting
   - Flush stats before service worker terminates (listen to `beforeunload` or use periodic flush)

5. **Create `TrafficStatsTab.svelte`** or section in DiagnosticsTab:
   - Per-proxy request counts and estimated bytes
   - Daily/weekly bar charts (simple CSS-based, no charting library)
   - Top domains table
   - Date range filter
   - Export as CSV/JSON

6. **`SettingsTab.svelte`** — Add "Traffic Statistics" toggle

**Files to create:** `TrafficStatsService.ts`, `TrafficStatsTab.svelte` (or section)
**Files to modify:** `manifest.json`, `settings.ts`, `background.ts`, `SettingsTab.svelte`, `DiagnosticsTab.svelte`
**Estimated scope:** ~500 lines

---

### 3.4 Rule Hit Counter for Auto-Proxy

**Feasibility: PARTIALLY FEASIBLE (with trade-offs)**

- PAC scripts execute in an isolated sandbox — no way to communicate hit counts back to the extension
- **Workaround**: Use `chrome.webRequest.onBeforeRequest` to evaluate rules in JS (mirror the PAC logic) and count matches
- This duplicates the PAC evaluation but allows counting
- Alternative: periodically test known URLs against rules and show which ones would match

**Current State:**
- `PACScriptGenerator.ts` has `testUrl()` that evaluates a URL against rules
- Auto-Proxy rules stored in `ProxyConfig.autoProxy.rules`
- Each rule has `id`, `pattern`, `matchType`

**Implementation:**

1. **`settings.ts`** — Add hit count tracking:
   ```typescript
   // Add to AutoProxyRule:
   hitCount?: number
   lastHit?: number  // timestamp
   ```

2. **Extend `TrafficStatsService.ts`** (from 3.3) — or create `RuleHitService.ts`:
   - On each web request, if active proxy is auto-proxy mode:
     - Evaluate the URL against all auto-proxy rules (reuse `PACScriptGenerator.testUrl()` logic)
     - Increment hit counter for the matching rule
   - Batch updates to storage

3. **`AutoProxyRuleList.svelte`** — Show hit count badge on each rule:
   - Small counter next to each rule
   - "Never matched" indicator for zero-hit rules
   - "Reset counters" button

4. **Performance consideration**: Evaluating rules per-request adds overhead. Add a sampling option (evaluate every Nth request) or only count for the first 1000 requests per session.

**Files to create:** `RuleHitService.ts` (or extend `TrafficStatsService.ts`)
**Files to modify:** `settings.ts`, `AutoProxyRuleList.svelte`, `background.ts`
**Estimated scope:** ~250 lines
**Dependency:** Benefits from Traffic Stats infrastructure (3.3)

---

### 3.5 Onboarding Wizard Improvements

**Feasibility: FULLY FEASIBLE**

- Can detect system proxy via `chrome.proxy.settings.get()` with `{ incognito: false }`
- Can check `levelOfControl` to see if proxy is managed by OS/policy
- Import detected settings into a new `ProxyConfig`

**Current State:**
- `OnboardingModal.svelte` has 4 steps: Welcome, Features, Shortcuts, Get Started
- Shown on first install via `onboardingComplete` flag
- Step navigation with dots, arrows, Escape to close

**Implementation:**

1. **Create `SystemProxyDetector.ts`**:
   ```typescript
   interface DetectedProxy {
     mode: string
     details: any  // raw Chrome proxy settings
     readable: string  // human-readable description
   }

   async detectSystemProxy(): Promise<DetectedProxy | null>
   async convertToProxyConfig(detected: DetectedProxy): Promise<ProxyConfig>
   ```

2. **`OnboardingModal.svelte`** — Restructure to 5-6 steps:
   - Step 1: Welcome (existing)
   - Step 2: **System Proxy Detection** (NEW)
     - Auto-detect current proxy settings
     - Show what was found
     - "Import as config" button or "Skip"
   - Step 3: **Quick Setup** (NEW)
     - Common presets: "I use a corporate proxy", "I use a VPN", "I switch between networks"
     - Pre-configure based on selection
   - Step 4: Features overview (existing, condensed)
   - Step 5: Shortcuts (existing)
   - Step 6: Get Started (existing)

3. **Create `QuickSetupPresets.ts`** — Common proxy configuration templates:
   - Corporate: fixed proxy with bypass for internal domains
   - VPN: direct with quick-switch to SOCKS5
   - Multi-network: multiple configs with quick switch enabled

**Files to create:** `SystemProxyDetector.ts`, `QuickSetupPresets.ts`
**Files to modify:** `OnboardingModal.svelte`
**Estimated scope:** ~350 lines

---

## Phase 4: Power User Features

High complexity, significant new infrastructure or architectural considerations.

---

### 4.1 Proxy Chains

**Feasibility: NOT NATIVELY POSSIBLE — requires PAC workaround**

- Chrome's proxy API does NOT support true proxy chaining (A → B → destination)
- PAC `"PROXY a; PROXY b"` is **failover**, not chaining
- True chaining requires a local proxy daemon — outside Chrome extension scope
- **What IS possible**: Failover chains via PAC scripts (try A, fall back to B, fall back to DIRECT)
- **Alternative approach**: Present it as "Proxy Failover Chains" instead of true chaining

**Current State:**
- PAC scripts support failover syntax: `"PROXY a:8080; SOCKS5 b:1080; DIRECT"`
- `PACScriptGenerator.ts` can generate these
- Manual proxy mode supports `fallbackProxy`

**Implementation (Failover Chains):**

1. **`settings.ts`** — Add chain/failover config:
   ```typescript
   interface ProxyChain {
     id: string
     name: string
     color: string
     badgeLabel?: string
     proxies: ProxyChainEntry[]  // ordered list of proxies to try
     finalFallback: 'direct' | 'fail'  // what to do if all fail
   }

   interface ProxyChainEntry {
     type: 'existing' | 'inline'
     proxyId?: string        // reference to existing ProxyConfig
     inlineProxy?: ProxyServer
     timeout?: number        // seconds before failover (Chrome default: 30s retry)
   }

   // Add new mode to ProxyConfig:
   // mode: ... | 'chain'
   chain?: ProxyChain
   ```

2. **`PACScriptGenerator.ts`** — Add chain generation:
   ```javascript
   // Generate: "SOCKS5 proxy1:1080; PROXY proxy2:8080; DIRECT"
   function generateChainPAC(chain: ProxyChain): string
   ```

3. **Create `ProxyChainEditor.svelte`**:
   - Ordered list of proxy entries (drag-and-drop reorder)
   - Each entry: proxy selector (existing or inline) + remove button
   - "Add proxy to chain" button
   - Final fallback selector
   - Visual chain diagram (arrows between proxies)

4. **`ProxyConfigModal.svelte`** — Add "Failover Chain" as a new proxy mode

5. **`background.ts`** — Handle chain mode:
   - Generate PAC script from chain
   - Apply as `pac_script` mode internally

6. **UI labeling**: Present as "Failover Chain" to set correct expectations (not true traffic chaining)

**Files to create:** `ProxyChainEditor.svelte`
**Files to modify:** `settings.ts`, `PACScriptGenerator.ts`, `ProxyConfigModal.svelte`, `ProxyModeSelector.svelte`, `background.ts`
**Estimated scope:** ~400 lines

---

### 4.2 DNS-over-HTTPS Configuration

**Feasibility: LIMITED — Chrome extension API does not control DoH**

- `chrome.privacy.network` only has `networkPredictionEnabled` (boolean) — NO DoH control
- DoH is configured via Chrome enterprise policies (`DnsOverHttpsMode`, `DnsOverHttpsTemplates`) or `chrome://settings/security`
- Extensions CANNOT programmatically set DoH providers
- **What IS possible**:
  - Disable DNS prefetching via `networkPredictionEnabled = false`
  - Educate users about DoH configuration
  - Detect current DoH status (enterprise policy check)
  - Provide one-click link to Chrome's secure DNS settings

**Implementation (Guidance + DNS Prefetch Control):**

1. **`manifest.json`** — `"privacy"` permission (shared with WebRTC feature)

2. **`settings.ts`** — Add:
   ```typescript
   disableDNSPrefetch: boolean  // default: false
   ```

3. **`settingsStore.ts`** — Add `toggleDNSPrefetch()`:
   - `chrome.privacy.network.networkPredictionEnabled.set({ value: !enabled })`
   - Check `levelOfControl` before setting

4. **`SettingsTab.svelte`** — Add "DNS & Privacy" section:
   - Toggle: "Disable DNS Prefetching" with explanation tooltip
   - Info card: "Configure Secure DNS (DoH)" with link to `chrome://settings/security`
   - Brief explainer about DNS leaks when using proxies
   - Recommended DoH providers list (Cloudflare, Google, Quad9)

5. **`_locales/`** — Add i18n strings

**Files to modify:** `manifest.json`, `settings.ts`, `settingsStore.ts`, `SettingsTab.svelte`, locales
**Estimated scope:** ~100 lines
**Note:** Feature scope is limited by Chrome API. Be transparent in UI about what the extension can vs. cannot control.

---

### 4.3 Proxy Authentication Vault

**Feasibility: PARTIALLY FEASIBLE (MV3 limitation)**

- `chrome.webRequest.onAuthRequired` (blocking) is **deprecated in MV3** for non-enterprise extensions
- Without blocking `onAuthRequired`, extension cannot intercept 407 challenges and inject credentials
- **What IS possible**:
  - Store credentials alongside proxy configs (already partially implemented — `ProxyServer` has `username`/`password`)
  - For PAC scripts: embed credentials in proxy URL format (limited browser support)
  - Use `chrome.declarativeNetRequest` for header injection (but cannot handle 407 challenge-response)
- **Enterprise-only path**: MV3 extensions with `webRequestBlocking` permission work only via enterprise policy
- **Open Chromium issue**: [#40723650](https://issues.chromium.org/issues/40723650) — proxy auth in MV3 is an acknowledged gap

**Implementation (Credential Storage + UI):**

1. **`settings.ts`** — Formalize credential storage:
   ```typescript
   interface ProxyCredentials {
     proxyId: string
     username: string
     password: string    // stored in chrome.storage.local (not sync, for security)
     autoFill: boolean   // attempt to use when possible
   }
   ```

2. **Create `CredentialService.ts`**:
   - Store credentials in `storage.local` (separate from synced settings)
   - Encrypt credentials with a user-provided master password (optional)
   - Credential CRUD operations
   - Auto-populate `ProxyServer.username/password` when applying proxy

3. **`ProxyInput.svelte`** — Enhance authentication fields:
   - Username/password fields with show/hide toggle
   - "Save to vault" checkbox
   - Auto-fill from vault when selecting a known proxy host

4. **Create `CredentialVaultModal.svelte`**:
   - List saved credentials
   - Edit/delete credentials
   - Optional master password protection
   - Export credentials (encrypted)

5. **`SettingsTab.svelte`** — Add "Credential Vault" section

6. **Display limitation notice**: Inform users that automatic 407 handling is limited in Manifest V3 and they may still see auth prompts for some proxies

**Files to create:** `CredentialService.ts`, `CredentialVaultModal.svelte`
**Files to modify:** `settings.ts`, `ProxyInput.svelte`, `SettingsTab.svelte`
**Estimated scope:** ~350 lines

---

### 4.4 Proxy Profiles with Schedules

*Covered in Phase 3.2 above.*

---

## Shared Infrastructure

### Settings Migration System

Multiple features add new fields to `AppSettings` and `ProxyConfig`. Build a migration system early:

```typescript
// src/services/MigrationService.ts
interface Migration {
  version: number
  description: string
  migrate(settings: any): any
}

const MIGRATIONS: Migration[] = [
  {
    version: 30,  // 1.30.0
    description: 'Add WebRTC protection, DNS prefetch, traffic stats settings',
    migrate(s) {
      return {
        ...s,
        webRTCProtection: false,
        disableDNSPrefetch: false,
        trafficStatsEnabled: false,
        schedules: [],
        schedulingEnabled: false,
        proxyGroups: [],
      }
    }
  }
]
```

Run migrations on settings load in `SettingsReader.ts`.

### Extended Storage Layout

```
chrome.storage.sync (100KB limit):
  └── settings: AppSettings (proxy configs, groups, schedules, preferences)

chrome.storage.local (10MB):
  ├── configHistory: ConfigSnapshot[]     (versioning)
  ├── trafficStats: ProxyStats[]          (traffic logging)
  ├── ruleHitCounts: Record<string, number> (auto-proxy counters)
  ├── credentials: ProxyCredentials[]     (proxy auth)
  ├── diagnosticLogs: DiagnosticLogEntry[] (existing)
  └── theme, onboarding, etc.            (existing)
```

---

## Manifest Changes Summary

```json
{
  "permissions": [
    "proxy",           // existing
    "storage",         // existing
    "tabs",            // existing
    "notifications",   // existing
    "alarms",          // existing
    "privacy",         // NEW: WebRTC + DNS
    "webRequest"       // NEW: Traffic stats + Rule hits
  ],
  "host_permissions": [
    "<all_urls>"       // existing
  ],
  "commands": {        // NEW
    "quick-switch": {
      "suggested_key": { "default": "Alt+Shift+P" },
      "description": "Quick switch to next proxy"
    },
    "disable-proxy": {
      "suggested_key": { "default": "Alt+Shift+O" },
      "description": "Disable proxy"
    }
  },
  "omnibox": {         // NEW
    "keyword": "px"
  }
}
```

---

## Suggested Implementation Order

```
Week 1-2 (Phase 1 - Quick Wins):
  ├── 1.1 Keyboard Shortcut          (~50 lines)
  ├── 1.2 WebRTC Leak Protection      (~120 lines)
  ├── 1.3 Export to PAC File           (~60 lines)
  ├── 1.4 Omnibox Integration          (~80 lines)
  ├── 1.5 Notification Actions          (~80 lines)
  ├── 1.6 Badge Customization           (~200 lines)
  └── 1.7 Bypass Proxy for Current Site (~150 lines)

Week 3-4 (Phase 2 - Core Features):
  ├── Settings Migration System         (infrastructure)
  ├── 2.1 IP Leak Test                  (~300 lines)
  ├── 2.2 PAC Script Linting            (~200 lines)
  ├── 2.3 PAC Script Debugging          (~150 lines)
  ├── 2.4 Proxy Config Grouping         (~400 lines)
  └── 2.5 Config Versioning / Undo      (~350 lines)

Week 5-6 (Phase 2 continued + Phase 3):
  ├── 2.6 Shareable Config Links        (~250 lines)
  ├── 2.7 External Config Sync          (~400 lines)
  ├── 3.1 Import from Other Extensions  (~600 lines)
  └── 3.2 Proxy Schedules               (~600 lines)

Week 7-8 (Phase 3 continued + Phase 4):
  ├── 3.3 Traffic Stats / Usage Logging (~500 lines)
  ├── 3.4 Rule Hit Counter              (~250 lines)
  ├── 3.5 Onboarding Wizard             (~350 lines)
  ├── 4.1 Proxy Failover Chains         (~400 lines)
  ├── 4.2 DNS-over-HTTPS Guidance       (~100 lines)
  └── 4.3 Proxy Authentication Vault    (~350 lines)
```

---

## Feasibility Summary

| # | Feature | Feasibility | Notes |
|---|---------|-------------|-------|
| 1.1 | Keyboard Shortcut | FULL | chrome.commands, straightforward |
| 1.2 | WebRTC Leak Protection | FULL | chrome.privacy API |
| 1.3 | Export to PAC File | FULL | Reuse existing PACScriptGenerator |
| 1.4 | Omnibox Integration | FULL | chrome.omnibox API |
| 1.5 | Notification Actions | FULL | Buttons may not render on macOS |
| 1.6 | Badge Customization | PARTIAL | No emoji; precomputed icons needed |
| 1.7 | Bypass Current Site | FULL | Modify bypass list dynamically |
| 2.1 | IP Leak Test | FULL | External API calls for IP check |
| 2.2 | PAC Script Linting | FULL | CodeMirror lint extension |
| 2.3 | PAC Script Debugging | PARTIAL | alert() capture via script injection |
| 2.4 | Config Grouping | FULL | Pure data model + UI change |
| 2.5 | Config Versioning | FULL | storage.local for history |
| 2.6 | Shareable Config Links | FULL | Base64 encode/decode |
| 2.7 | External Config Sync | FULL | Similar to existing PAC URL refresh |
| 3.1 | Import from Extensions | FULL | Reverse-engineered SwitchyOmega format |
| 3.2 | Proxy Schedules | FULL | chrome.alarms + timezone handling |
| 3.3 | Traffic Stats | PARTIAL | Approximate bytes only; SW lifecycle issues |
| 3.4 | Rule Hit Counter | PARTIAL | Duplicates PAC evaluation in JS |
| 3.5 | Onboarding Wizard | FULL | Detect system proxy + presets |
| 4.1 | Proxy Chains | PARTIAL | Failover only, not true chaining |
| 4.2 | DNS-over-HTTPS | LIMITED | No API for DoH; guidance + DNS prefetch only |
| 4.3 | Proxy Auth Vault | PARTIAL | MV3 blocks onAuthRequired; storage only |

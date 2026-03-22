# Changelog

All notable changes to the Pacify Chrome Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.31.0] - 2026-03-22

### Fixed

- **Subscription Fetch Failing on Anubis-Protected Servers** ([#34](https://github.com/navbytes/pacify/issues/34))
  - Fixed "No rules found in the subscription" error when fetching lists from servers using Anubis bot protection (e.g., gfwlist on repo.or.cz)
  - Root cause: Chrome's `fetch()` sends a User-Agent with "Mozilla", which triggers Anubis's JS proof-of-work challenge that `fetch()` can't solve
  - Fix: subscription and PAC script fetches now use a non-browser User-Agent (`PACify/1.31`) that bypasses bot protection by design
  - Added specific Anubis detection with a clear error message when the workaround doesn't work
  - Added HTML response detection for other bot protection systems, firewalls, and proxy login pages

- **PAC Script Injection Vulnerability**
  - Subscription domain names and proxy strings are now escaped before interpolation into generated PAC scripts, preventing JavaScript injection via malicious subscription content
  - PAC script body extraction now correctly handles braces inside string literals and comments
  - Domain validation rejects characters that could enable injection (`"`, `'`, `\`, `<`, `` ` ``)

- **Credential Storage Security**
  - Proxy credentials are now encrypted with AES-GCM (Web Crypto API) and stored in `chrome.storage.local` instead of plaintext in `chrome.storage.sync`
  - Credentials no longer sync across devices — they stay local to the machine
  - Fixed misleading UI text that claimed credentials were already encrypted

- **Active Proxy State Race Condition**
  - `activeScriptId` and `isActive` flags are now updated atomically to prevent desync where multiple proxies appear active or none are active when one should be

- **Subscription Refresh Stale Data**
  - After updating a subscription, the already-known config is used directly instead of re-reading from storage, preventing stale data and eliminating a redundant storage read

- **Settings Save Race Condition**
  - Added a mutex to serialize concurrent `saveSettings` calls, preventing data loss when multiple saves fire in quick succession (e.g., from rapid UI changes)

- **Theme Store Memory Leak**
  - Media query change handler no longer creates a new store subscription on each system theme change event

- **Service Worker Reliability**
  - Initialization retry now uses `chrome.alarms` instead of `setTimeout`, which is unreliable in MV3 service workers (timers are lost when the worker terminates)
  - All network fetches have a 15-second timeout via `AbortSignal` to prevent the service worker from hanging on unresponsive servers

- **Dark Mode Color Contrast**
  - Improved contrast of muted text in dark mode (`dark:text-slate-400` → `dark:text-slate-300`) for WCAG AA compliance

- **Modal UX**
  - Form validation errors now auto-scroll into view
  - Modal focus lands on the close button instead of the first form input (standard accessible pattern)

### Added

- **Surge & Clash Subscription Format Support**
  - Auto-detect and parse Surge-style rules (`DOMAIN,`, `DOMAIN-SUFFIX,`)
  - Auto-detect and parse Clash-style rules (YAML payload with `'+.domain'`, `DOMAIN,`)
  - Format selector in subscription form now includes Surge/Shadowrocket and Clash/Mihomo options

- **HTTPS Warning for Subscription URLs**
  - HTTP subscription and PAC script URLs now show a yellow warning banner about MITM risk
  - Warning is non-blocking — users can still use HTTP URLs for internal networks

- **Background-Based Subscription Fetching**
  - Subscription fetches are routed through the background service worker via `chrome.runtime.sendMessage` for more reliable network access in MV3

- **Message Sender Verification**
  - Background script now verifies `sender.id` matches the extension's own ID as defense-in-depth

### Changed

- **Credential Storage Architecture**
  - New `CredentialService` using Web Crypto API for AES-GCM encryption at rest
  - Encryption key derived via PBKDF2 from extension ID, cached in `chrome.storage.session`
  - Credentials stripped from sync storage and stored encrypted in local storage only

- **Settings Performance**
  - Settings cache timeout increased from 5 seconds to 30 seconds, reducing storage reads
  - `JSON.parse(JSON.stringify())` deep clone replaced with `structuredClone()` for faster settings saves
  - Subscription metadata (title, homepage) capped at 200/500 chars to prevent storage abuse
  - Pre-compiled regex patterns in ABP parser for faster subscription parsing
  - Proxy reference lookups reduced from O(n²) to O(n) using a pre-computed reference map

- **UI Polish**
  - `hover:scale` effects replaced with `hover:shadow` to avoid layout recalculation
  - Popup width now responsive (`min-w-80 w-96 max-w-full`) instead of fixed
  - Standardized terminology: "scripts" → "proxies" across empty states and UI text
  - Loading placeholder text and popup tooltips now use i18n keys instead of hardcoded English
  - `LoadingSpinner` now has `role="status"` and `aria-label` for screen readers

### Removed

- Deprecated `NotifyService` (replaced by `NotificationService` in v1.25.0)

### i18n

- Added 20+ new keys across all 12 locales: privacy page content, quick settings, HTTPS warning, subscription formats, proxy activation toasts, loading text, tooltips
- Locale JSON files compacted to one-entry-per-line format
- Locale files excluded from Biome auto-formatting to preserve compact format

## [1.30.0] - 2026-03-15

### Added

- Support for Subscription lists like gfwlist

## [1.29.0] - 2026-01-25

### Added

- **First-Run Onboarding Flow** 🎉
  - Multi-step welcome tutorial for new users
  - Step 1: Welcome message introducing PACify
  - Step 2: Feature highlights (Multiple Profiles, Auto-Proxy Rules, PAC Script Support)
  - Step 3: Keyboard shortcuts overview
  - Step 4: Get started with "Create First Proxy" or "Explore Settings" options
  - Progress indicator and step navigation
  - Stored completion status to show only on first install
  - Full i18n support for all 12 languages

- **Keyboard Shortcuts Help Modal** ⌨️
  - Press `?` anywhere to show keyboard shortcuts
  - New keyboard icon button in options header
  - Organized into groups: General, Navigation, Proxy List
  - Platform-aware key display (⌘ on Mac, Ctrl on others)
  - Accessible modal with proper ARIA labels
  - Full i18n support for all shortcut descriptions

- **Privacy Policy Page** 🔒
  - Dedicated privacy policy page at `/privacy.html`
  - Sections: Data Collection, Data Storage, Network Requests, Permissions
  - Clear explanation that no data is collected or transmitted
  - Link added to Settings → Help & Resources section
  - Professional design matching extension theme
  - Full i18n support for privacy content

- **Enhanced Diagnostics Tab** 📊
  - System Status Panel showing:
    - Active proxy name and status
    - Total configured proxies count
    - Storage usage (used/total bytes)
    - Extension version
  - Info-level logging for successful proxy operations
  - PAC script validation connected to editor UI
  - Inline validation error display with icons
  - User-friendly Chrome API error messages

### Changed

- **Simplified Extension URLs** 🔗
  - URLs now use root-level paths for cleaner appearance
  - `popup.html` instead of `src/popup/popup.html`
  - `options.html` instead of `src/options/options.html`
  - `privacy.html` instead of `src/privacy/privacy.html`
  - Added Vite plugin to flatten HTML output during build

- **Improved Accessibility**
  - Focus management for all modals
  - Keyboard navigation with ? shortcut
  - ARIA labels on interactive elements
  - Input detection to prevent shortcuts while typing

### Fixed

- **Security & Stability**
  - Fixed ReDoS vulnerability in PAC script pattern matching (max 1000 chars)
  - Fixed memory leak in toast notification timeouts
  - Fixed memory leak in theme store media query listener
  - Added initialization retry limit with exponential backoff
  - Added comprehensive input validation for settings restore

### Technical

- **New Components**
  - `OnboardingModal.svelte` - Multi-step first-run tutorial
  - `KeyboardShortcutsModal.svelte` - Keyboard shortcuts help
  - `Privacy.svelte` - Privacy policy page

- **New Utilities**
  - `parseProxyError()` - User-friendly Chrome API error messages
  - `flattenHtmlOutput()` - Vite plugin for URL simplification

- **Browser Interface Updates**
  - `onInstalled` listener now receives installation details
  - Supports detecting fresh installs vs. updates

- **i18n Additions**
  - 60+ new localization keys across all 12 languages
  - Onboarding, keyboard shortcuts, privacy, and diagnostics strings

## [1.28.1] - 2026-01-21

### Fixed

- **Legacy Proxy Configuration Compatibility** 🔧
  - Fixed Svelte `props_invalid_value` error when editing proxy configurations created before version 1.28.0
  - Legacy configurations (created before authentication feature) now properly initialize missing `username` and `password` fields with empty strings
  - Ensures backward compatibility by merging existing proxy settings with default values on load
  - Resolves issue where the proxy configuration modal would crash when editing older manual proxy configurations

## [1.28.0] - 2026-01-20

### Added

- **Proxy Authentication Support** 🔐
  - Username and password fields for proxy server authentication
  - Collapsible authentication section in Manual Proxy configuration
    - Auto-expands when credentials are already configured
    - Password visibility toggle with eye icon
    - Responsive two-column layout for username/password fields
    - Info banner explaining credential storage (encrypted in Chrome sync storage)
  - Authentication support for Auto-Proxy inline proxy definitions
    - Username and password inputs in inline proxy configuration
    - Password visibility toggle for inline proxies
  - Lock icon badge on proxy cards indicating authentication is configured
    - Amber-colored badge automatically appears when credentials are detected
    - Supports manual proxy rules (all protocols) and Auto-Proxy inline proxies
    - Includes tooltip explaining authentication status
  - Full TypeScript interface support with optional `username` and `password` fields

- **Error Logging & Diagnostics System** 📊
  - New `DiagnosticsService` for centralized error logging
    - Three severity levels: error, warning, info
    - Storage limits: 1000 entries or 30 days (whichever comes first)
    - Read/unread tracking for new errors
    - Export logs as JSON for debugging and support
    - Auto-trim old entries based on age and count limits
  - New Diagnostics tab in Options page
    - Activity icon with badge count showing unread errors
    - Comprehensive log entry display with expandable details
    - Severity-based color coding (red/amber/blue icons)
    - Relative timestamps ("2 minutes ago", "1 hour ago")
    - Expandable log details showing:
      - Full error messages
      - Stack traces
      - URLs
      - Additional context (proxy name, ID, etc.)
    - Actions: Export logs, Clear all logs, Mark all as read
    - Empty state with positive messaging when no errors detected
  - Diagnostic logging integrated in background service
    - `PROXY_SET_FAILED` - Logs when proxy configuration fails
    - `PROXY_CLEAR_FAILED` - Logs when clearing proxy fails
    - `PAC_SCRIPT_FETCH_FAILED` - Logs HTTP errors when fetching PAC scripts
    - `PAC_SCRIPT_REFRESH_FAILED` - Logs failures during auto-refresh
    - All errors include proxy name, ID, URLs, and full stack traces

### Changed

- **ProxyServer Interface**
  - Added optional `username` and `password` fields for authentication
  - Maintains backward compatibility with existing configurations

- **User Interface**
  - Enhanced proxy cards with visual authentication indicator (lock icon)
  - Improved Options page navigation with new Diagnostics tab
  - Added badge notification system for unread diagnostic logs

### Technical

- **New Services**
  - `DiagnosticsService` - Manages diagnostic logs with storage and persistence
  - Chrome local storage integration for diagnostic log persistence

- **New Components**
  - `DiagnosticsTab.svelte` - Full diagnostic log viewer with export/clear functionality

- **Enhanced Components**
  - `ProxyInput.svelte` - Authentication section with password visibility toggle
  - `ProxySelector.svelte` - Inline proxy authentication for Auto-Proxy rules
  - `ScriptItem.svelte` - Lock icon badge detection and display

- **TypeScript Enhancements**
  - New `DiagnosticLogEntry` interface with severity, type, message, and metadata
  - Updated `ProxyServer` interface with authentication fields

- **Background Service Integration**
  - Error logging at critical failure points
  - Full context capture (proxy details, URLs, stack traces)
  - Automatic log trimming based on age and count

### Security

- **Credential Storage**
  - Proxy credentials stored in Chrome storage
  - Clear UI messaging about credential storage
  - _Note: v1.31.0 upgraded this to AES-GCM encryption in local-only storage_

## [1.27.0] - 2026-01-18

### Added

- **View Mode Functionality**
  - Introduced new `ViewMode` type to manage layout preferences (grid/list)
  - Added `ViewModeSwitcher` component for toggling between grid and list views
  - Updated proxy configuration display to support both grid and list layouts
  - Added view mode persistence in settings
  - Localized view mode labels and descriptions in 12 languages

- **Settings Enhancements**
  - Added "Show Quick Settings" toggle to control Quick Switch section visibility
  - Improved settings UI organization and layout

## [1.25.0] - 2026-01-09

### Added

- **Unified Notification System**
  - Introduced `NotificationService` for Chrome system notifications and in-app toasts
  - User preference toggle for system notifications in Settings
  - Intelligent notification routing based on context (foreground/background)
  - Support for success, error, warning, and info notification types
  - Persist notification preferences in Chrome storage
  - Added Bell icon to icon exports

- **Settings & Preferences**
  - New `Settings` interface for user preferences separate from `AppSettings`
  - Added `getPreferences` and `savePreferences` methods to `StorageService`

- **Documentation & Planning**
  - Added `CLAUDE.md` for Bun development preferences
  - Added `FEASIBILITY_STUDY_AUTOMATIC_MODE.md` for automatic mode feature planning

### Fixed

- **PAC Script Editor**
  - Fixed editor initialization to properly display fetched PAC scripts
  - Migrated from `onMount` to Svelte 5 `$effect` for reactive editor updates
  - Made editor read-only when using URL-based PAC scripts
  - Improved editor content synchronization when PAC URL is refreshed

- **Proxy Configuration Display**
  - Fixed bug where proxy configs in Quick Switch section were excluded from "All Proxy Configs" section
  - All proxy configurations now properly display regardless of Quick Switch status

- **Test Suite**
  - Fixed test hanging issue caused by Chrome API mock timing
  - Moved Chrome API mock setup to top-level (before module imports)
  - Added comprehensive mocks for notifications and tabs APIs
  - Fixed `NotificationService.error` mocking in error handling tests
  - 113 unit tests now pass successfully (previously timed out)

- **Type Safety**
  - Fixed 70 TypeScript errors from tailwind-variants migration
  - Replaced inferred `VariantProps` types with explicit union types
  - Fixed SearchBar import from type-only to value import
  - All type checking now passes with 0 errors

### Changed

- **Development Tooling - Biome Migration**
  - Migrated from ESLint + Prettier to Biome v2.3.11
  - Removed 141 packages (ESLint, Prettier, class-variance-authority, and related plugins)
  - Configured Biome with experimental Svelte support
  - Updated lint-staged to use Biome commands
  - 10x faster linting and formatting with Rust-based tooling

- **Component Styling Library**
  - Migrated from `class-variance-authority` (CVA) to `tailwind-variants`
  - Updated all variant definitions to use `tv()` API with config objects
  - Converted all `cn()` usage within variants to plain strings
  - Removed dependencies: `clsx`, `tailwind-merge`

- **Icon Optimization**
  - Changed lucide-svelte imports from barrel exports to direct paths
  - 10x faster dev server reload times
  - Improved tree-shaking for smaller production bundles

- **Code Quality**
  - Removed unused `MonacoService.optimized.ts` and `monaco-completions.ts`
  - Cleaned up code comments and improved error handling
  - Updated `CONTRIBUTING.md` and `DEVELOPMENT.md`

### Technical

- **Build System**
  - Configured Biome with Tailwind CSS support and custom rules for Svelte
  - Excluded `app.css` from Biome (Tailwind-specific syntax)
  - Updated package scripts for lint, format, and check commands

- **Test Infrastructure**
  - Enhanced test setup with comprehensive Chrome API mocks
  - Fixed singleton instantiation timing issues
  - Added support for notifications, tabs, storage, and proxy APIs in tests

### Performance

- **Development Server**: 10x faster hot reload with optimized icon imports
- **Linting**: Significantly faster with Rust-based Biome (vs. Node-based ESLint)
- **Bundle Size**: Reduced dependencies from 141 removed packages

## [1.24.0] - 2026-01-08

### Added

- **PAC Script Auto-Update**
  - Configurable auto-update intervals for URL-based PAC scripts (15 min to 24 hours)
  - Manual "Refresh now" button to immediately fetch latest PAC script from URL
  - "Last fetched" timestamp display showing when script was last updated
  - Background service using Chrome alarms for automatic periodic refreshes
  - Smart refresh logic that skips updates if triggered too soon
  - Full internationalization support for all 12 supported languages

### Fixed

- **PAC Script URL Preservation**
  - Fixed bug where PAC script URL was deleted when editing existing configurations
  - URL and mandatory flag now properly loaded from saved configurations

### Changed

- **Chrome Permissions**
  - Added `alarms` permission for background auto-refresh functionality

### Technical

- Enhanced `ProxyConfig` interface with `updateInterval` and `lastFetched` fields
- Implemented alarm-based background refresh system in service worker
- Added automatic alarm setup/cleanup when scripts are created, updated, or deleted
- Active PAC scripts are automatically re-applied after background refresh

## [1.23.0] - 2025-12-16

### Changed

- **Consistent UX**
  - Refactored css classes
  - Improve accessibility
  - Add logging service
  - Improved theming
  - Improve keyboard shortcuts

### Fixed

- Scroll issue in modal

## [1.22.0] - 2025-11-13

### Changed

- **Tab Consolidation**
  - Moved Help & Resources section from About tab to Settings tab
  - Reduced navigation from 3 tabs to 2 tabs for cleaner interface

### Removed

- **About Tab and Unused Components**
  - Removed About tab from navigation entirely
  - Deleted unused analytics/diagnostics components:
    - `AboutTab.svelte` - Entire About tab component
    - `StatsCard.svelte` - Statistics display component
    - `AppHeader.svelte` - App header with version info
    - `StorageCard.svelte` - Storage usage display
  - Removed `getStorageStats()` method from StorageService
  - Cleaned up unused diagnostics and telemetry code

## [1.21.0] - 2025-11-13

### Added

- **Auto-reload Toggle Setting**
  - New option to disable automatic page reload when switching proxies
  - Toggle available in Settings tab under Proxy Behavior section
  - Defaults to enabled for backward compatibility
  - Full i18n support for all 12 locales

### Fixed

- **Manual Proxy Configuration Save Error**
  - Fixed DataCloneError when saving manual proxy configurations
  - Replaced structuredClone with JSON.parse/stringify for better compatibility
  - Added null safety checks in proxy configuration components

### Changed

- **Settings UI Layout**
  - Proxy Behavior cards now display side-by-side on larger screens
  - Improved responsive grid layout for better space utilization

## [1.20.0] - 2025-10-24

### Added

- **Modern Navigation System**
  - Button group navigation style replacing underline tabs (iOS/macOS-inspired segmented control)
  - Inline toggle switches in Quick Switch Configs for faster proxy switching

### Changed

- **Optimized Popup Layout**
  - Reduced height from 480px to 400px for more compact display
  - Moved OFF button to footer with status indicator
  - Eliminated footer height flickering with consistent sizing

- **Enhanced Proxy Cards**
  - Three-section layout: Header, Content, Footer
  - Dedicated footer for action buttons in Options view
  - Added text labels to Edit and Delete buttons
  - Single-line description with truncation for cleaner cards
  - Refined shadows, borders, and hover effects

- **Improved Options Page**
  - Navigation moved to header alongside title
  - Better visual hierarchy and spacing
  - Enhanced card styling with reduced border radius

### Fixed

- QuickSwitch property now properly preserved when editing proxy configurations
- Automatic tab reload when proxy settings change to ensure changes take effect immediately

### Technical

- Cleaned up unnecessary event propagation code
- Simplified component event handling
- Improved accessibility with conditional role/tabindex attributes
- Better code maintainability with reduced complexity

## [1.10.0] - 2025-10-12

### Fixed

- **[CRITICAL] Fixed Issue #9: Extension doesn't switch profiles after idle time**
  - Implemented message queueing system to handle service worker wake-up race conditions
  - Fixed cache synchronization issues between background script and popup
  - Added response validation to message sending with proper error propagation

### Added

- **UX Enhancements**
  - ACTIVE badge on enabled proxies for instant identification
  - Tooltip system with contextual help across the interface
  - Keyboard shortcuts: Ctrl+N (Cmd+N on Mac) to add proxy, Escape to close modals
  - Enhanced drag-and-drop with ghost animations and drop zone highlighting
  - Color-coded section headers with icons (Zap, Cable, Database)

- **Components & Infrastructure**
  - New UI components: `ConfirmDialog`, `EmptyState`, `ProgressBar`, `StatsCard`, `Toast`, `Tooltip`
  - Tab navigation system with accessible ARIA implementation
  - Storage diagnostic tools with color-coded usage indicators
  - Proxy store and toast notification system

### Changed

- **UI/UX Improvements**
  - Toggle switches: Green for ON, gray for OFF with increased size (48px) for better touch targets
  - Active proxy cards now have green glow effect and scale animation
  - Improved visual hierarchy with larger Total Proxies stat card
  - Enhanced drag-and-drop feedback with opacity and scale effects

- **Technical Upgrades**
  - Migrated to Tailwind CSS 4 with PostCSS
  - Updated to Svelte 5 with runes API
  - Added Playwright for E2E testing and Vitest for unit testing
  - Configured ESLint 9 with flat config and Husky for git hooks

### Improved

- **Accessibility**
  - WCAG 2.1 Level AA compliance with focus-visible states
  - 44x44px minimum touch targets for all interactive elements
  - Full keyboard navigation support with visible focus indicators

- **Performance**
  - GPU-accelerated animations using CSS transforms (60fps)
  - Reduced storage reads on popup open
  - Optimized Monaco editor with lazy loading
  - Centralized cache invalidation

### Documentation

- Overhauled README.md with comprehensive feature documentation
- Added guides: `CONTRIBUTING.md`, `DEVELOPMENT.md`, `QUICK_START.md`, `QUICK_REFERENCE.md`
- Created detailed bug tracking docs for Issue #9
- Added PAC script templates and manual proxy setup guides

## [1.9.1] - 2025-09-13

### Added

- Setting to disable any active proxy when browser starts
- Added missing localisations

## [1.8.0] - 2025-05-27

### Added

- Auto release action

### Fixed

- Fixed bug with quick settings

## [1.6.0] - 2025-02-27

### Added

- localization for several languages

## [1.5.0] - 2025-02-27

### Fixed

- Fix bug with editing manual proxy config
- Removed un necessary permission from manifest

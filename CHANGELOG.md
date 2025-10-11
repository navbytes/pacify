# Changelog

All notable changes to the Pacify Chrome Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.9.2] - 2025-10-11

### Fixed

- **[CRITICAL] Fixed Issue #9: Extension doesn't switch profiles on first interaction after idle time**
  - Implemented message queueing system to handle service worker wake-up race conditions
  - Messages arriving during initialization are now queued and processed after setup completes
  - Added `isInitialized` flag and `messageQueue` to prevent dropped messages
  - Split message handling into public (`handleRuntimeMessage`) and internal (`handleRuntimeMessageInternal`) functions
  - Moved message listener registration before async operations to ensure early capture
- **Consolidated duplicate cache implementations**
  - Unified `SettingsReader.settingsCache` and `StorageService.settingsCache` into single source of truth
  - Removed local cache from `SettingsReader`, delegated to `StorageService`
  - Fixed cache synchronization issues between background script and popup
- **Added response validation to message sending**
  - `ChromeService.sendMessage()` now validates response and propagates errors to UI
  - Background script failures are properly surfaced instead of silently failing
- **Removed duplicate store initialization**
  - Eliminated redundant `settingsStore.init()` calls in `ScriptList.svelte`
  - Reduced unnecessary storage reads and race conditions during popup initialization

### Added

- Comprehensive logging throughout service worker lifecycle for debugging
- Message queue processing with detailed logging for visibility
- Error context in all error handlers for better troubleshooting
- Enhanced test coverage with new E2E and unit tests
- New UI components: `ConfirmDialog`, `EmptyState`, `ProgressBar`, `StatsCard`, `Toast`, `Text`
- Tab navigation component system (`Tabs/`, `TabList`, `Tab`, `TabPanel`)
- Storage diagnostic tools and progress indicators
- Proxy store and toast notification system

### Changed

- **Completely overhauled README.md with comprehensive feature documentation**
  - Added detailed feature sections with examples and use cases
  - Expanded technical architecture documentation
  - Added step-by-step usage guides for all proxy modes
  - Included configuration tables and testing instructions
  - Enhanced contributing guidelines and development setup
  - Added badges and professional formatting
- **Upgraded dependencies and build tooling**
  - Migrated to Tailwind CSS 4 with PostCSS
  - Updated to Svelte 5 with runes API
  - Added Playwright for E2E testing
  - Added Vitest for unit testing
  - Configured ESLint 9 with flat config
  - Added Husky for git hooks and lint-staged
- **Updated localization files across all supported languages**
  - Added new translation keys for UI components
  - Enhanced i18n service with better error handling
- **Improved code quality and linting configuration**
  - Switched from `tailwind.config.js` to PostCSS 4 config
  - Updated Prettier configuration for better formatting
  - Enhanced `.gitignore` and `.prettierignore` patterns

### Documentation

- Added comprehensive proxy configuration documentation
- Added PAC script template descriptions (Empty, Basic, Advanced, Pro)
- Added manual proxy setup guide with all scheme types
- Added backup/restore workflow documentation
- Added testing documentation for unit and E2E tests
- Added development guidelines and best practices
- Created `ISSUE_9_ANALYSIS.md` and `ISSUE_9_FIX_SUMMARY.md` for bug tracking
- Added `CONTRIBUTING.md`, `DEVELOPMENT.md`, `QUICK_START.md`, `QUICK_REFERENCE.md`

### Performance

- Reduced storage reads on popup open from 2 to 1 (eliminated duplicate initialization)
- Centralized cache invalidation for consistency
- Debounced settings saves to reduce unnecessary storage writes
- Optimized Monaco editor initialization with lazy loading

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

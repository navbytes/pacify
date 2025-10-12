# Changelog

All notable changes to the Pacify Chrome Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

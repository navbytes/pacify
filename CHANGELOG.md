# Changelog

All notable changes to the Pacify Chrome Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.22.0] - 2024-11-13

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

## [1.21.0] - 2024-11-13

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

# PACify - Advanced Proxy Configuration Manager for Chrome

**PACify** is a powerful, modern Chrome extension for managing all types of proxy configurations. Built with Svelte 5 and TypeScript, it provides a professional-grade interface for creating, editing, and switching between different proxy configurations with ease.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue.svg)](https://chrome.google.com/webstore)

## ✨ Key Features

### 🆕 What's New (Recent Updates)

**v1.26.0+ - Auto-Proxy Mode:** 🌟
- **Automatic URL-based routing** - the most requested feature!
- Visual rule editor with pattern matching
- Support for domain, keyword, and wildcard patterns
- Inline proxy definitions or reference existing proxies
- Real-time pattern tester
- Similar to Proxy SwitchyOmega's Auto Switch mode

**Other Recent Highlights:**
- View Modes: Grid and List layouts for proxy configurations
- Unified Notifications: Chrome system notifications + in-app toasts
- PAC Script Auto-Update: Configurable intervals (15min - 24hrs)
- Modern Navigation: iOS/macOS-inspired button group tabs
- Auto-Reload Toggle: Control browser refresh on proxy switch

*See [CHANGELOG.md](CHANGELOG.md) for complete version history*

### 🔄 Quick Switch Mode

- **One-Click Proxy Switching**: Click the extension icon to cycle through enabled proxy configurations
- **Drag-and-Drop Management**: Easily organize which proxies are in the quick switch rotation
- **Visual Feedback**: Color-coded badges show active proxy at a glance
- **Smart Toggle**: Enable/disable quick switch mode from the options page

### 🤖 Auto-Proxy (Automatic URL-Based Routing)

**Intelligent automatic proxy switching** based on URL patterns - no manual switching needed!

**Key Features:**
- **Pattern-Based Rules**: Define URL patterns that automatically route to specific proxies
- **Multiple Match Types**:
  - Domain matching (`*.example.com`, `example.com`)
  - Keyword matching (contains text)
  - Wildcard patterns for flexible routing
- **Flexible Routing Options**:
  - Route to existing proxy configurations
  - Define inline proxy settings per-rule
  - Direct connection (no proxy)
  - Blackhole (block requests)
- **Smart Fallback**: Configure default routing for URLs that don't match any rule
- **Rule Management**:
  - Enable/disable individual rules
  - Drag-and-drop priority ordering
  - Rule descriptions for documentation
- **Pattern Tester**: Test URLs against your rules to preview routing behavior
- **Visual Rule Editor**: Intuitive interface with color-coded rule cards

**Common Use Cases:**
- **Work vs Personal**: Route `*.company.com` through corporate proxy, everything else direct
- **Geographic Routing**: Send `*.netflix.com` to US proxy, `*.bbc.co.uk` to UK proxy
- **Service Isolation**: Different social media platforms through different proxies
- **Development**: Route `*.local` and `192.168.*` directly, external sites through proxy

**Technical Implementation:**
- Powered by PAC (Proxy Auto-Configuration) script generation
- Real-time rule compilation and validation
- Optimized pattern matching for performance
- Supports complex rule sets with hundreds of patterns

### 🎯 Comprehensive Proxy Support

**All Chrome Proxy Modes + Auto-Proxy:**

- **Auto-Proxy Mode**: 🆕 Automatic URL-based routing with visual rule editor (see section above)
- **System Proxy**: Inherit proxy settings from your operating system
- **Direct Connection**: Bypass all proxies for direct internet access
- **Auto-detect (WPAD)**: Automatically discover proxy settings using Web Proxy Auto-Discovery Protocol
- **PAC Script**: Create and run custom Proxy Auto-Config scripts with full JavaScript support
- **Manual Configuration**: Set up individual proxy servers for different protocols

### 📝 Professional PAC Script Editor

Powered by CodeMirror 6 (modern, lightweight code editor):

- **Syntax Highlighting**: Full JavaScript syntax highlighting for PAC scripts
- **IntelliSense**: Smart autocompletion for PAC functions (`FindProxyForURL`, `isInNet`, `dnsResolve`, etc.)
- **Performance Optimized**: 87% smaller bundle size with faster initialization
- **Multiple Templates**: Choose from 4 built-in templates:
  - **Empty**: Start from scratch
  - **Basic**: Simple proxy routing with internal domain bypass
  - **Advanced**: Complex routing with subnet detection and URL pattern matching
  - **Pro**: Enterprise-grade template with failover chains, time-based routing, geo-location handling, and security policies
- **Theme Support**: Automatic dark/light mode switching based on system preferences
- **Modern Architecture**: Built with CodeMirror 6's extensible plugin system
- **URL-Based PAC Scripts**: Load PAC scripts from external URLs
- **Auto-Update**: Configurable auto-update intervals (15 min to 24 hours) for URL-based scripts
- **Manual Refresh**: "Refresh now" button to immediately fetch latest PAC script
- **Last Fetched Timestamp**: Shows when script was last updated

### ⚙️ Manual Proxy Configuration

- **Per-Protocol Proxies**: Configure separate proxies for:
  - HTTP
  - HTTPS (Secure)
  - FTP
  - SOCKS (SOCKS4/SOCKS5)
- **Shared Proxy Mode**: Use a single proxy for all protocols
- **Fallback Proxy**: Define backup proxy for failover scenarios
- **Bypass Rules**: Set up domain/IP bypass list (one per line)
- **Multiple Proxy Schemes**: Support for HTTP, HTTPS, QUIC, SOCKS4, and SOCKS5

### 🎨 User Interface & Experience

**Modern Navigation & Layout:**

- **Button Group Navigation**: iOS/macOS-inspired segmented control for tab switching
- **View Mode Toggle**: Switch between grid and list layouts for proxy configurations
- **Show Quick Settings**: Toggle visibility of Quick Switch section
- **Responsive Design**: Optimized layouts for different screen sizes
- **Enhanced Proxy Cards**: Three-section layout (Header, Content, Footer) with refined shadows and borders

**Visual Feedback & Identification:**

- **ACTIVE Badge**: Prominent green badge with ShieldCheck icon on enabled proxies for instant identification
- **Color-Coded Proxies**: Assign colors to proxies for quick visual identification (8 color options)
- **Badge Labels**: Customizable 1-4 character labels for proxy identification
- **Real-Time Status**: Connection status banner shows active proxy
- **Micro-Animations**: Subtle scale effects on cards (hover, active states)

**Interaction Enhancements:**

- **Tooltips**: Context-sensitive help tooltips throughout the interface
- **Keyboard Shortcuts**:
  - `Ctrl+N` / `Cmd+N` (Mac: `Cmd+N`) - Add new proxy configuration
  - `Escape` - Close modal dialogs
  - Clear conflict handling to prevent shortcut interference
- **Drag-and-Drop**:
  - Custom styled drag ghost with proxy color and shadow
  - Drop zone highlighting with blue border and background tint
  - Source item visual feedback (fade, scale, blue ring)
- **Inline Toggle Switches**: Quick proxy switching directly from configuration cards

**Design System:**

- **Modern UI**: Clean, intuitive interface built with Tailwind CSS 4
- **Dark Mode Support**: Automatic dark theme based on system preferences
- **Visual Hierarchy**: Color-coded section headers with icons (Zap, Cable, Database)
- **WCAG Compliance**:
  - Level AA: Keyboard navigation with focus-visible states
  - Level AAA: 44x44px minimum touch targets
  - Proper ARIA labels and roles
  - Screen reader friendly

### 💾 Data Management

- **Backup & Restore**: Export/import all configurations as JSON
- **Cloud Sync**: Settings sync across Chrome browsers via Chrome Sync Storage
- **Storage Diagnostics**: Monitor storage usage with visual progress bars
- **Import Validation**: Automatic validation when restoring from backup
- **Cache Management**: Intelligent caching with invalidation support

### 🔔 Notifications & Feedback

- **Unified Notification System**: Chrome system notifications and in-app toast messages
- **Intelligent Routing**: Automatic selection of notification type based on context (foreground/background)
- **User Preferences**: Toggle system notifications on/off from Settings
- **Multiple Types**: Success, error, warning, and info notifications
- **Persistent Preferences**: Notification settings sync across devices
- **In-App Toasts**: Non-intrusive toast notifications with auto-dismiss

### 🚀 Startup & Performance

- **Startup Behavior Control**: Choose to disable proxy on browser launch
- **Auto-Reload Toggle**: Enable/disable automatic page reload when switching proxies
- **Smart Initialization**: Message queuing system prevents race conditions during startup
- **Debounced Saves**: Optimized storage writes reduce unnecessary operations
- **Mutex Locking**: Prevents concurrent proxy changes
- **Conditional Tab Reload**: Intelligently reload tabs when proxy changes (skips special Chrome pages)

### 🔒 Privacy & Security

- **Local-Only Storage**: All data stored in Chrome's local/sync storage
- **No External Requests**: Extension doesn't transmit data to external servers
- **No Tracking**: Zero analytics or user tracking
- **Secure Script Execution**: PAC scripts run in isolated environment
- **Manifest V3**: Built with latest Chrome extension security standards

### 🌍 Internationalization

- **Multi-Language Support**: Full i18n framework with locale-based messages
- **12 Languages**: 100% i18n compliance with proper translations for all supported locales
- **Dynamic Loading**: Messages loaded automatically based on browser locale
- **Comprehensive Coverage**: All UI elements, tooltips, and messages fully translated

### 📊 Dashboard & Statistics

- **Quick Stats**: View total proxies, quick switch count, active proxy, and last used
- **Storage Metrics**: Real-time sync and local storage usage with visual indicators
- **Proxy Status**: At-a-glance view of all proxy configurations
- **Activity Tracking**: Track which proxies are used most

## 🏗️ Technical Architecture

### Technology Stack

- **Frontend**: Svelte 5 (with latest runes API)
- **Language**: TypeScript 5.7+ (strict mode)
- **Build Tool**: Vite 7 with code splitting
- **Styling**: Tailwind CSS 4 with PostCSS, tailwind-variants for component styling
- **Code Editor**: CodeMirror 6 (lightweight, modern)
- **Icons**: Lucide Svelte (tree-shaken with direct imports)
- **Testing**: Bun Test + Playwright
- **Code Quality**: Biome (Rust-based linting & formatting), Husky (git hooks)
- **Runtime**: Bun (10x faster than Node.js)

### Project Structure

```text
pacify/
├── src/
│   ├── background/          # Manifest V3 service worker
│   │   └── background.ts    # Message handling, proxy management
│   ├── popup/               # Extension popup UI
│   │   ├── Popup.svelte     # Quick proxy switcher
│   │   └── popup.html
│   ├── options/             # Options page (full settings)
│   │   ├── Options.svelte   # Tabbed interface with drag-and-drop
│   │   └── options.html
│   ├── components/          # Reusable Svelte components
│   │   ├── ProxyConfig/     # Configuration modal & forms
│   │   ├── DragDrop/        # Drag-and-drop system
│   │   ├── Tabs/            # Tab navigation
│   │   └── common/          # Shared UI primitives
│   ├── services/            # Business logic layer
│   │   ├── chrome/          # Chrome API abstractions
│   │   ├── i18n/            # Internationalization
│   │   ├── CodeMirrorService.ts # CodeMirror editor integration
│   │   ├── StorageService.ts # Settings persistence
│   │   ├── ScriptService.ts  # PAC script validation
│   │   ├── NotifyService.ts  # Notification system (toasts + Chrome notifications)
│   │   └── LoggerService.ts  # Centralized logging
│   ├── stores/              # Svelte stores (state management)
│   │   ├── settingsStore.ts # Central app state
│   │   ├── proxyStore.ts
│   │   └── toastStore.ts
│   ├── interfaces/          # TypeScript type definitions
│   ├── constants/           # App constants & templates
│   └── utils/               # Utility functions
├── tests/
│   ├── e2e/                 # Playwright E2E tests
│   ├── unit/                # Vitest unit tests
│   └── integration/         # Integration tests
├── _locales/                # i18n message files
│   └── en/messages.json
└── icons/                   # Extension icons
```

### Chrome Extension Architecture

- **Manifest Version**: 3 (latest)
- **Service Worker**: Event-driven background script with message queue and alarm-based auto-refresh
- **Popup**: Lightweight proxy switcher (384px width, 400px height)
- **Options Page**: Full-featured settings with modern button group navigation
- **Permissions**: `proxy`, `storage`, `alarms`, `notifications`
- **Background Tasks**: Automatic PAC script updates using Chrome alarms API

## 🚀 Getting Started

### Installation from Source

1. **Clone the repository:**

   ```bash
   git clone https://github.com/navbytes/pacify.git
   cd pacify
   ```

2. **Install dependencies:**

   ```bash
   bun install
   # or: npm install / pnpm install / yarn install
   ```

3. **Build the extension:**

   ```bash
   # Production build
   bun run build

   # Development build with watch mode
   bun run dev:extension
   ```

4. **Load in Chrome:**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (top-right toggle)
   - Click "Load unpacked"
   - Select the `dist/` directory (or `dev/` for development builds)

### Development Scripts

```bash
# Development server (for component development)
bun run dev

# Build extension in watch mode
bun run dev:extension

# Production build
bun run build

# Run unit tests
bun run test

# Run E2E tests
bun run test:e2e

# Lint code
bun run lint

# Format code
bun run format

# Type checking
bun run check
```

## 💻 Usage Guide

### Creating Your First Proxy

1. Click the **PACify** icon in Chrome's toolbar
2. Click **"Settings"** (gear icon) to open the options page
3. Click **"Add New Script"** button
4. Fill in basic information:
   - **Name**: Give your proxy a descriptive name
   - **Color**: Choose a color for visual identification
5. Select **Proxy Mode**:
   - **System**: Use OS proxy settings
   - **Direct**: No proxy (direct connection)
   - **Auto-detect**: WPAD auto-discovery
   - **PAC Script**: Write custom routing logic
   - **Manual**: Configure specific proxy servers
6. Click **"Save"** to create the configuration

### Using Quick Switch

1. Open **Options** → **Proxy Configs** tab
2. Enable **"Quick Switch Mode"** toggle
3. **Drag** proxy configurations to the "Quick Switch Configs" section
4. Click the **extension icon** to cycle through enabled proxies
5. Badge shows active proxy name (first 3 letters)

### Setting Up Auto-Proxy (Automatic Routing)

1. Click **"Add Auto-Proxy"** button (orange button with branch icon)
2. Configure **Basic Settings**:
   - **Name**: Descriptive name (e.g., "Work Router")
   - **Color**: Visual identifier
   - **Badge Label**: 1-4 character label (optional)
3. **Add Routing Rules**:
   - Click **"Add Rule"** to create a new routing rule
   - **Pattern**: URL pattern to match (e.g., `*.company.com`, `github.com`, `*.local`)
   - **Match Type**: Choose domain, keyword, or wildcard matching
   - **Route To**: Select destination (existing proxy, inline proxy, direct, or blackhole)
   - **Description**: Optional note for the rule
   - Enable/disable rules with toggle switch
4. **Configure Fallback**:
   - Set default routing for URLs that don't match any rule
   - Options: direct, existing proxy, or inline proxy
5. **Test Your Rules**:
   - Use the Pattern Tester to verify routing
   - Enter test URLs to see which rule/proxy they match
6. **Reorder Rules** (optional):
   - Drag rules to change priority
   - Rules are evaluated top-to-bottom (first match wins)
7. Click **"Save"** to activate

**Example Configuration:**
- Rule 1: `*.company.com` → Corporate Proxy
- Rule 2: `*.github.com` → Direct Connection
- Rule 3: `netflix.com` → US Proxy
- Fallback: Direct Connection

### Writing PAC Scripts

1. Create a new proxy configuration
2. Select **"PAC Script"** mode
3. Choose a template:
   - **Basic**: For simple internal/external routing
   - **Advanced**: For subnet detection and pattern matching
   - **Pro**: For enterprise scenarios with failover
4. Edit the script in CodeMirror Editor:
   - Intelligent autocompletion for PAC functions
   - Available PAC functions: `isInNet`, `dnsResolve`, `shExpMatch`, etc.
   - Automatic theme switching (dark/light mode)
   - Test with different URLs before saving
5. Save and activate the proxy

### Manual Proxy Setup

1. Select **"Manual Configuration"** mode
2. Choose between:
   - **Shared Proxy**: Same proxy for all protocols
   - **Per-Protocol**: Different proxies for HTTP, HTTPS, FTP
3. Enter proxy details:
   - **Scheme**: http, https, socks4, socks5, quic
   - **Host**: Proxy server address
   - **Port**: Proxy server port
4. Add bypass rules (optional):
   - Enter domains/IPs to bypass proxy (one per line)
   - Example: `*.local`, `192.168.*.*`, `localhost`

### Backup & Restore

**To Backup:**

1. Go to **Options** → **Settings** tab
2. Click **"Backup Settings"**
3. JSON file downloads with all configurations

**To Restore:**

1. Go to **Options** → **Settings** tab
2. Click **"Restore Settings"**
3. Select your backup JSON file
4. All configurations are restored and validated

## 📋 Chrome Permissions

PACify requires minimal permissions:

- **`proxy`**: To manage Chrome's proxy settings
- **`storage`**: To save configurations locally and sync across devices
- **`alarms`**: For background auto-refresh of URL-based PAC scripts
- **`notifications`**: For system notifications when enabled in settings

**No permissions** for network access, browsing history, or tabs data beyond what's necessary for core functionality.

## 🔧 Configuration Options

### App Settings

| Setting                    | Description                                    | Default |
| -------------------------- | ---------------------------------------------- | ------- |
| Quick Switch Mode          | Enable one-click proxy cycling                 | `false` |
| Disable Proxy on Startup   | Clear proxy when browser starts                | `false` |
| Auto-Reload on Switch      | Automatically reload tabs when changing proxies| `true`  |
| System Notifications       | Enable Chrome system notifications             | `true`  |
| Show Quick Settings        | Show/hide Quick Switch section in UI           | `true`  |
| View Mode                  | Display proxy configs in grid or list layout   | `grid`  |

### Proxy Configuration Fields

| Field        | Type     | Description                                |
| ------------ | -------- | ------------------------------------------ |
| Name         | Text     | Proxy configuration name (required)        |
| Color        | Choice   | Visual color identifier (8 options)        |
| Mode         | Dropdown | Proxy type (system/direct/auto/PAC/manual) |
| Quick Switch | Toggle   | Include in quick switch rotation           |
| Active       | Auto     | Currently active proxy (one at a time)     |

### PAC Script Fields

| Field           | Description                                                        |
| --------------- | ------------------------------------------------------------------ |
| Script Data     | JavaScript PAC script content (inline mode)                        |
| Script URL      | External PAC script URL (alternative to inline)                    |
| Update Interval | Auto-update frequency (15min - 24hrs) for URL-based scripts        |
| Last Fetched    | Timestamp showing when URL-based script was last refreshed         |
| Mandatory       | Fail closed if PAC script fails                                    |

### Manual Proxy Fields

| Field       | Description                                    |
| ----------- | ---------------------------------------------- |
| Scheme      | Proxy protocol (http/https/socks4/socks5/quic) |
| Host        | Proxy server hostname or IP                    |
| Port        | Proxy server port number                       |
| Bypass List | Domains/IPs to bypass proxy                    |

## 🧪 Testing

**Test Suite Status:** 113 unit tests passing with comprehensive Chrome API mocks

### Unit Tests

```bash
# Run all unit tests
bun run test

# Run with UI
bun run test:ui

# Run with coverage
bun run test:coverage
```

**Recent Improvements:**
- Fixed test hanging issues with Chrome API mock timing
- Comprehensive mocks for notifications, tabs, storage, and proxy APIs
- Enhanced test infrastructure with proper singleton handling

### E2E Tests

```bash
# Run all E2E tests
bun run test:e2e

# Run with UI
bun run test:e2e:ui

# Run smoke tests only
bun run test:e2e:smoke
```

**Test Automation:**
- Playwright-based E2E testing with data-testid attributes
- Improved test reliability with proper element selectors
- Smoke tests for critical user flows

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow TypeScript strict mode with zero type errors
- Use Svelte 5 runes API (avoid legacy stores in components)
- Use Biome for linting and formatting (10x faster than ESLint/Prettier)
- Write tests for new features (unit tests with Bun, E2E with Playwright)
- Run `bun run lint` and `bun run format` before committing
- Use `tailwind-variants` for component styling (replaced CVA)
- Import Lucide icons directly (not from barrel exports) for better tree-shaking
- Update documentation for significant changes

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🛡️ Security & Privacy

- **Local Storage Only**: All configurations stored in Chrome's local/sync storage
- **No External Servers**: Extension operates entirely offline
- **No Analytics**: Zero telemetry or usage tracking
- **No Third-Party Services**: No external dependencies at runtime
- **Open Source**: Full source code available for audit

For more details, see our [Privacy Policy](PRIVACY_POLICY.md).

## 💬 Support & Feedback

- **Issues**: [GitHub Issues](https://github.com/navbytes/pacify/issues)
- **Discussions**: [GitHub Discussions](https://github.com/navbytes/pacify/discussions)
- **Feature Requests**: Open an issue with the "enhancement" label

## 🌟 Acknowledgments

Built with these amazing open-source projects:

- [Svelte](https://svelte.dev/) - Reactive UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [CodeMirror 6](https://codemirror.net/) - Modern, lightweight code editor
- [Vite](https://vitejs.dev/) - Next-generation build tool
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [tailwind-variants](https://www.tailwind-variants.org/) - Component styling library
- [Lucide Icons](https://lucide.dev/) - Beautiful icon set
- [Bun](https://bun.sh/) - Fast JavaScript runtime and package manager
- [Biome](https://biomejs.dev/) - Rust-based linting and formatting
- [Playwright](https://playwright.dev/) - Reliable E2E testing

Special thanks to all contributors and the open-source community! 🙏

---

**Made with ❤️ by the PACify team**

# PACify - Advanced Proxy Configuration Manager for Chrome

**PACify** is a powerful, modern Chrome extension for managing all types of proxy configurations. Built with Svelte 5 and TypeScript, it provides a professional-grade interface for creating, editing, and switching between different proxy configurations with ease.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue.svg)](https://chrome.google.com/webstore)

## ✨ Key Features

### 🔄 Quick Switch Mode

- **One-Click Proxy Switching**: Click the extension icon to cycle through enabled proxy configurations
- **Drag-and-Drop Management**: Easily organize which proxies are in the quick switch rotation
- **Visual Feedback**: Color-coded badges show active proxy at a glance
- **Smart Toggle**: Enable/disable quick switch mode from the options page

### 🎯 Comprehensive Proxy Support

**All Chrome Proxy Modes:**

- **System Proxy**: Inherit proxy settings from your operating system
- **Direct Connection**: Bypass all proxies for direct internet access
- **Auto-detect (WPAD)**: Automatically discover proxy settings using Web Proxy Auto-Discovery Protocol
- **PAC Script**: Create and run custom Proxy Auto-Config scripts with full JavaScript support
- **Manual Configuration**: Set up individual proxy servers for different protocols

### 📝 Professional PAC Script Editor

Powered by Monaco Editor (the same editor as VS Code):

- **Syntax Highlighting**: Full JavaScript syntax highlighting for PAC scripts
- **IntelliSense**: Smart autocompletion for PAC functions (`FindProxyForURL`, `isInNet`, `dnsResolve`, etc.)
- **Error Detection**: Real-time validation and error checking
- **Multiple Templates**: Choose from 4 built-in templates:
  - **Empty**: Start from scratch
  - **Basic**: Simple proxy routing with internal domain bypass
  - **Advanced**: Complex routing with subnet detection and URL pattern matching
  - **Pro**: Enterprise-grade template with failover chains, time-based routing, geo-location handling, and security policies
- **Full-Screen Editing**: Maximize editor for comfortable script development

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

**Enhanced UX (v1.10.0):**

- **ACTIVE Badge**: Prominent green badge with ShieldCheck icon on enabled proxies for instant identification
- **Tooltips**: Context-sensitive help tooltips on Quick Switch Mode, Disable on Startup, and keyboard shortcuts
- **Keyboard Shortcuts**:
  - `Ctrl+N` / `Cmd+N` - Add new proxy configuration
  - `Escape` - Close modal dialogs
- **Drag-and-Drop Animations**:
  - Custom styled drag ghost with proxy color and shadow
  - Drop zone highlighting with blue border and background tint
  - Source item visual feedback (fade, scale, blue ring)
- **Visual Hierarchy**:
  - Color-coded section headers with icons (Zap, Cable, Database)
  - Larger Total Proxies stat card for emphasis
  - Green/Gray color coding on stats (active vs none)
- **Micro-Animations**: Subtle scale effects on cards (hover, active states)
- **Modern Design**: Clean, intuitive interface built with Tailwind CSS
- **Dark Mode Support**: Automatic dark theme based on system preferences
- **Color-Coded Proxies**: Assign colors to proxies for quick visual identification (8 color options)
- **Real-Time Status**: Connection status banner shows active proxy
- **Responsive Layout**: Optimized for different screen sizes
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

### 🚀 Startup & Performance

- **Startup Behavior Control**: Choose to disable proxy on browser launch
- **Smart Initialization**: Message queuing system prevents race conditions during startup
- **Debounced Saves**: Optimized storage writes reduce unnecessary operations
- **Mutex Locking**: Prevents concurrent proxy changes
- **Active Tab Reload**: Automatically reload tabs when proxy changes (skips special Chrome pages)

### 🔒 Privacy & Security

- **Local-Only Storage**: All data stored in Chrome's local/sync storage
- **No External Requests**: Extension doesn't transmit data to external servers
- **No Tracking**: Zero analytics or user tracking
- **Secure Script Execution**: PAC scripts run in isolated environment
- **Manifest V3**: Built with latest Chrome extension security standards

### 🌍 Internationalization

- **Multi-Language Support**: i18n framework with locale-based messages
- **Currently Available**: English (more languages can be added)
- **Dynamic Loading**: Messages loaded based on browser locale

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
- **Styling**: Tailwind CSS 4 with PostCSS
- **Code Editor**: Monaco Editor 0.54+
- **Icons**: Lucide Svelte
- **Testing**: Vitest + Playwright
- **Code Quality**: ESLint, Prettier, Husky

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
│   │   ├── MonacoService.ts # Monaco editor integration
│   │   ├── StorageService.ts # Settings persistence
│   │   └── ScriptService.ts  # PAC script validation
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
- **Service Worker**: Event-driven background script with message queue
- **Popup**: Lightweight proxy switcher (384px width)
- **Options Page**: Full-featured settings with tabbed interface
- **Permissions**: `proxy`, `storage` only

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

### Writing PAC Scripts

1. Create a new proxy configuration
2. Select **"PAC Script"** mode
3. Choose a template:
   - **Basic**: For simple internal/external routing
   - **Advanced**: For subnet detection and pattern matching
   - **Pro**: For enterprise scenarios with failover
4. Edit the script in Monaco Editor:
   - Use **Ctrl+Space** for autocompletion
   - Available PAC functions: `isInNet`, `dnsResolve`, `shExpMatch`, etc.
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

**No additional permissions** for network access, browsing history, or tabs data.

## 🔧 Configuration Options

### App Settings

| Setting                  | Description                     | Default |
| ------------------------ | ------------------------------- | ------- |
| Quick Switch Mode        | Enable one-click proxy cycling  | `false` |
| Disable Proxy on Startup | Clear proxy when browser starts | `false` |

### Proxy Configuration Fields

| Field        | Type     | Description                                |
| ------------ | -------- | ------------------------------------------ |
| Name         | Text     | Proxy configuration name (required)        |
| Color        | Choice   | Visual color identifier (8 options)        |
| Mode         | Dropdown | Proxy type (system/direct/auto/PAC/manual) |
| Quick Switch | Toggle   | Include in quick switch rotation           |
| Active       | Auto     | Currently active proxy (one at a time)     |

### PAC Script Fields

| Field       | Description                                     |
| ----------- | ----------------------------------------------- |
| Script Data | JavaScript PAC script content                   |
| Script URL  | External PAC script URL (alternative to inline) |
| Mandatory   | Fail closed if PAC script fails                 |

### Manual Proxy Fields

| Field       | Description                                    |
| ----------- | ---------------------------------------------- |
| Scheme      | Proxy protocol (http/https/socks4/socks5/quic) |
| Host        | Proxy server hostname or IP                    |
| Port        | Proxy server port number                       |
| Bypass List | Domains/IPs to bypass proxy                    |

## 🧪 Testing

### Unit Tests

```bash
# Run all unit tests
bun run test

# Run with UI
bun run test:ui

# Run with coverage
bun run test:coverage
```

### E2E Tests

```bash
# Run all E2E tests
bun run test:e2e

# Run with UI
bun run test:e2e:ui

# Run smoke tests only
bun run test:e2e:smoke
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Use Svelte 5 runes (avoid legacy stores in components)
- Write tests for new features
- Run `bun run lint` and `bun run format` before committing
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
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - VS Code's editor
- [Vite](https://vitejs.dev/) - Next-generation build tool
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Lucide Icons](https://lucide.dev/) - Beautiful icon set
- [Vitest](https://vitest.dev/) - Blazing fast unit testing
- [Playwright](https://playwright.dev/) - Reliable E2E testing

Special thanks to all contributors and the open-source community! 🙏

---

**Made with ❤️ by the PACify team**

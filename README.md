# PACify - Comprehensive Proxy Configuration Manager for Chrome

`PACify` is a powerful Chrome extension designed to manage all types of proxy configurations supported by Chrome. It provides a user-friendly interface for creating, editing, and switching between different proxy configurations, including PAC scripts, manual proxy settings, and system configurations.

## 🚀 Features

### Proxy Configuration Support

- **PAC Script Management**: Create and edit PAC scripts with advanced syntax highlighting and autocompletion
- **Manual Proxy Configuration**: Set up individual proxy servers for different protocols (HTTP, HTTPS, FTP)
- **System Proxy Integration**: Use system proxy settings seamlessly
- **Auto-detect Mode**: Support for WPAD (Web Proxy Auto-Discovery) protocol
- **Direct Connection**: Option for direct internet access without proxy

### User Interface

- **Advanced Script Editor**: Built with Monaco Editor, featuring:
  - Syntax highlighting for PAC scripts
  - Intelligent code completion
  - Error detection and validation
  - Multiple script templates (Empty, Basic, Pro, Advanced)
- **Quick Switch Mode**: Toggle between enabled proxy configurations with a single click
- **Visual Management**: Color-coded proxy configurations for easy identification
- **Drag-and-Drop Interface**: Easily organize and manage quick switch configurations

### Configuration Options

- **Per-Protocol Proxy Settings**: Configure different proxies for HTTP, HTTPS, and FTP
- **Bypass Rules**: Set up proxy bypass rules for specific domains
- **Shared Proxy Option**: Use the same proxy server for all protocols
- **SOCKS Proxy Support**: Configure SOCKS4/SOCKS5 proxy servers
- **Startup Behavior Control**: Setting to disable any active proxy when browser starts

### Data Management

- **Import/Export Settings**: Backup and restore your proxy configurations
- **Local Storage**: All configurations stored securely in Chrome's sync storage
- **Real-time Validation**: Immediate feedback on proxy configuration validity

## Project Structure

The repository follows a modular architecture:

```text
src/
├── background/     # Background service worker
├── components/     # Reusable UI components (Svelte)
├── constants/      # Application constants and templates
├── interfaces/     # TypeScript type definitions
├── options/        # Options page implementation
├── popup/          # Extension popup interface
├── services/       # Core business logic
└── stores/         # State management (Svelte stores)
```

## 🛠️ Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/navbytes/pacify.git
   cd pacify
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Build the project (or run in dev mode):

   ```bash
   bun run build # build the project
   bun run dev:extension # dev mode
   ```

4. Load in Chrome:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/` directory

## 💻 Usage

### Basic Configuration

1. Click the PACify icon in Chrome's toolbar
2. Select "Add New Script" to create a configuration
3. Choose your preferred proxy mode:
   - System
   - Direct
   - Auto-detect
   - PAC Script
   - Manual Configuration

### Quick Switch Setup

1. Open the extension options
2. Enable "Quick Switch Mode"
3. Drag desired configurations to the Quick Switch section
4. Click the extension icon to cycle through enabled configurations

### Extension Settings

Access advanced settings through the Options page:

1. **Quick Switch Mode**: Enable browser action click cycling between configurations
2. **Disable Proxy on Startup**: When enabled, ensures the extension starts in "OFF" mode after browser restart, automatically disabling any previously active proxy configuration

### PAC Script Development

- Use the built-in Monaco Editor for script creation
- Choose from predefined templates
- Access helper functions like `isInNet`, `dnsResolve`, etc.
- Real-time syntax validation and error checking

## 📄 Documentation

### Chrome Permissions

The extension requires the following permissions:

- `proxy`: To manage proxy settings through PAC scripts.
- `storage`: To store PAC scripts and user preferences.

### Supported Proxy Modes

- `system`: Use system's proxy settings
- `direct`: Direct connection without proxy
- `auto_detect`: Auto-detect proxy settings
- `pac_script`: Use PAC script configuration
- `fixed_servers`: Manual proxy configuration

### Required Permissions

- `proxy`: Manage Chrome's proxy settings
- `storage`: Store configurations

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request with detailed description

## 📜 License

This project is licensed under the [MIT License](LICENSE).

## 🛡️ Security and Privacy

- All PAC script configurations and user preferences are stored locally using Chrome’s storage.sync API.
- The extension does not collect or transmit user data externally.
- For more details, please review our [Privacy Policy](PRIVACY_POLICY.md).

## 💬 Feedback

Have a suggestion, feedback, or bug to report? [Open an issue](https://github.com/navbytes/pacify/issues) or start a [discussion](https://github.com/navbytes/pacify/discussions).

## 🌟 Acknowledgments

- Built with [Svelte](https://svelte.dev/) and [TypeScript](https://www.typescriptlang.org/)
- Uses [Monaco Editor](https://microsoft.github.io/monaco-editor/) for script editing
- Thanks to the open-source community

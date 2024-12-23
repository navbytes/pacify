# PACify - PAC Script Management Chrome Extension

`PACify` is a browser extension designed to manage `PAC` (Proxy Auto-Configuration) scripts efficiently. It provides tools for creating, editing, and switching between PAC scripts. This extension is built using modern web technologies, such as Svelte and TypeScript, to ensure a clean and responsive user interface.

## 🚀 Features

- **Script Editor**: Easily create and edit PAC scripts with live validation and syntax templates.
- **Quick Switch Mode**: Toggle between PAC scripts with a single click.
- **Import/Export Settings**: Backup and restore your scripts and settings effortlessly.
- **Customizable Settings**: Set script colors, enable quick switch, and manage script activation seamlessly.

## Project Structure

The repository is organized as follows:

- `background/`: Handles background operations and browser action events.
- `components/`: Reusable UI components built with Svelte.
- `constants/`: Application constants, including templates and default settings.
- `icons/`: SVG icons used throughout the application.
- `interfaces/`: TypeScript interfaces for data structures.
- `options/`: Contains files for the options page.
- `popup/`: Code for the browser popup interface.
- `services/`: Application logic for managing settings and Chrome API interactions.
- `stores/`: Svelte stores for state management.
- `styles/`: CSS files for styling.

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

3. Build the project:

   ```bash
   bun run build
   ```

4. Load the extension into Chrome:
   - Open `chrome://extensions`.
   - Enable "Developer mode".
   - Click "Load unpacked" and select the `dist/` directory.

## 💻 Usage

- Add new PAC scripts via the options page.
- Use the browser action (popup) to toggle between quick-switch enabled scripts.
- Import/export settings from the options page for easy backup and restore.

## 📄 Documentation

Supported Permissions

The extension requires the following permissions:

- `proxy`: To manage proxy settings through PAC scripts.
- `storage`: To store PAC scripts and user preferences.
- `webRequest` and `webRequestAuthProvider`: For testing and resolving proxy requests.

## ⌨️ Development

To run the extension in development mode:

```bash
bun run dev
```

This will start a development server and watch for file changes.

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

1. Fork the repository.
2. Create a feature branch.
3. Submit a pull request with a detailed description of your changes.

## 📜 License

This project is licensed under the [MIT License](LICENSE).

## 🛡️ Security and Privacy

- All PAC script configurations and user preferences are stored locally using Chrome’s storage.sync API.
- The extension does not collect or transmit user data externally.
- For more details, please review our [Privacy Policy](PRIVACY_POLICY.md).

## 💬 Feedback

Have a suggestion, feedback, or bug to report? [Open an issue](https://github.com/navbytes/pacify/issues) or start a [discussion](https://github.com/navbytes/pacify/discussions).

## 🌟 Acknowledgments

- Built with [Svelte](https://svelte.dev/) and [TypeScript](https://www.typescriptlang.org/).
- Special thanks to the open-source community for their valuable libraries and tools that made this project possible.

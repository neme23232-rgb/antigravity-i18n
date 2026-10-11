# Antigravity Multi-Language Localization Mod 🌐

> Full multi-language localization mod and integrated native language switcher for **Google Antigravity 2.0** desktop application.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform: Windows | macOS | Linux](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-brightgreen.svg)]()
[![Languages](https://img.shields.io/badge/Languages-EN%20%7C%20UK%20%7C%20RU%20%7C%20DE%20%7C%20FR%20%7C%20ES%20%7C%20ZH-orange.svg)]()

---

## ✨ Features

- **🌐 Pixel-Perfect In-App Language Switcher:** Seamlessly integrated directly above the Settings button in the sidebar, matching the native Radix UI dark theme design.
- **🔄 Instant Language Switching & Persistence:** Switches language on the fly and saves your preference across app restarts and reloads (stored in `localStorage` and Electron native storage).
- **🛡️ Comprehensive UI Translation (880+ strings):**
  - **Sidebar & Menus:** New conversation, history, projects, automations, display options.
  - **Panels & Tabs:** Terminal, Browser subagent, Changes overview, Files changed, Console, Artifacts.
  - **Settings & Permissions:** Security profiles (Default, Full machine, Turbo mode, Custom), terminal commands auto-execution, sandbox restrictions, network & file access policies, Model Context Protocol (MCP).
  - **Keyboard Shortcuts:** Full categories (Recommended, Navigation, Conversation, Layout Controls) and keybinding action descriptions.
  - **Customizations & Skills:** Marketplace, Installed plugins, Hooks, and full descriptions for all 9 built-in Google Antigravity skills.
  - **Context Menus & Actions:** Native Electron and DOM context menus (Copy, Edit, Fork, Split view, Archive, Delete).
- **⚡ Safe Word-Boundary Matching Engine:**
  - Employs regex word-boundary isolation `(?<!\w)...\b` to prevent broken substring replacements (e.g. avoiding issues like *“Edit-ed”* or *“Model-s”*).
  - Smart handling of compound sentences with inline elements (links, code badges, dynamic workspace names).
- **📦 1-Click Installation & Rollback:** Safe automated backup of the original `app.asar` before installation, with single-click restoration anytime.

---

## 🌍 Supported Languages

| Code | Language | Native Name | Status |
| :---: | :---: | :---: | :---: |
| `en` | English | English | Default (Native) |
| `uk` | Ukrainian | Українська | ✅ 100% Complete |
| `ru` | Russian | Русский | ✅ 100% Complete |
| `de` | German | Deutsch | 🔄 Basic |
| `fr` | French | Français | 🔄 Basic |
| `es` | Spanish | Español | 🔄 Basic |
| `zh` | Chinese | 中文 | 🔄 Basic |

---

## 🚀 Quick Start / Installation

### Prerequisites
- [Google Antigravity](https://antigravity.google) 2.0 installed.
- [Node.js](https://nodejs.org) (v18 or higher recommended).

### Windows
1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/antigravity-i18n.git
   cd antigravity-i18n
   ```
2. **Install dependencies and build the mod:**
   ```bash
   npm install
   npm run build
   ```
   *(Or simply run `build.bat`)*
3. **Install into Antigravity:**
   - Close **Antigravity** if it is currently running.
   - Run `install.bat` (or `npm run install-mod`).
4. **Launch Antigravity:**
   - Click the new **Language / Мова / Язык** button right above Settings in the left sidebar to select your desired language.

---

## ↩️ Uninstallation (Rollback)

To revert Antigravity to its original unmodified state at any time:
1. Close Antigravity.
2. Run `uninstall.bat` (or `npm run uninstall-mod`).

This immediately restores the clean backup (`app.asar.backup`) created during the initial installation.

---

## 🛠️ How It Works

1. **Clean Extraction & Injection:**
   - The build tool packages the client localization script into `dist/preload.js`.
   - `webFrame.executeJavaScript` executes the isolated localization client in the renderer process.
2. **Dynamic UI Observation:**
   - An efficient `MutationObserver` translates DOM text nodes, placeholders, tooltips, and attributes (`aria-label`, `title`) as content dynamically streams in.
3. **Native Context Menu Interceptor:**
   - Wraps `window.electronNative.showContextMenu` to localize OS-level context menus before they are passed to the Electron main process.

---

## 🤝 Contributing / Adding a New Language

Contributions are welcome! To add or improve a language:

1. Look in the [`locales/`](locales/) folder (e.g. `locales/de.js`, `locales/es.js`).
2. Add translation pairs in the format:
   ```javascript
   module.exports = {
     "New Conversation": "Neuer Dialog",
     "Settings": "Einstellungen",
     ...
   };
   ```
3. Rebuild with `npm run build` and test.
4. Submit a Pull Request!

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).

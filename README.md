<div align="center">
  <img src="icon.png" width="96" height="96" alt="AGLanguage Logo">
  <h1>AGLanguage</h1>
  <p><strong>Seamless multi-language interface translation and native in-app switcher for Google Antigravity 2.0.</strong></p>
  <p>
    <img alt="Windows 10/11" src="https://img.shields.io/badge/Windows-10%20%7C%2011-8b5f68">
    <img alt="Antigravity v2.23.1+" src="https://img.shields.io/badge/Antigravity-v2.23.1%2B-5a6b8c">
    <img alt="Localization" src="https://img.shields.io/badge/localization-7%20languages-8b7355">
    <img alt="License MIT" src="https://img.shields.io/badge/license-MIT-7b9b83">
    <img alt="Telemetry" src="https://img.shields.io/badge/telemetry-none-7b9b83">
  </p>
  <p>
    <strong>English</strong> • <a href="README_ru.md">Русский</a>
  </p>
</div>

## Overview

**AGLanguage** is an open-source localization mod and integrated native language switcher for the [Google Antigravity](https://antigravity.google) 2.0 desktop application. It translates the application's interface (sidebar, menus, settings, permissions presets, onboarding screens, tooltips, dialogs, and native context menus) into Russian, Ukrainian, German, French, Spanish, and Chinese, and adds a pixel-perfect language switcher button directly above Settings in the sidebar.

All operations execute 100% locally on your machine. The mod does not collect any data, make external network requests, or modify model logic.

## Quick Start

Installation is completely automated and takes just one click:

1. Download or clone this repository.
2. Close Google Antigravity if it is currently running.
3. Run **`install.bat`** (or execute `node install.js` in your terminal).
4. The installer automatically backs up your original `app.asar` to `app.asar.backup` and applies the mod.
5. Launch Google Antigravity — click the new **Language / Мова / Язык** button directly above Settings in the left sidebar to select your preferred language.

> [!TIP]
> You can revert to the clean official version at any time with a single click: simply run **`uninstall.bat`** — it instantly restores your original `app.asar`.

## Features

- **Pixel-Perfect Integrated Language Switcher**: Matches Antigravity's native Radix UI dark theme design seamlessly;
- **Instant Language Switching & State Persistence**: Switches languages on the fly without losing context, saved across reboots and window reloads (`localStorage` & `nativeStorage`);
- **Comprehensive UI Translation (979+ phrases in RU/UK, 198–218 in DE/FR/ES/ZH)**:
  - Sidebar navigation, conversation history, projects, and automations;
  - Onboarding, license selection, and Google Cloud project configuration (v2.23.1);
  - Permissions preset selector (Default, Full machine, Turbo mode) and terminal approval policies;
  - Full-screen media viewer, video playback controls, 2x playback speed, and .zip / folder attachments (v2.23.0);
  - Documents section, whitespace change toggles in diffs, and collapsible Scratch Files;
  - Subagents panels, approval requests, and live execution status badges;
  - Keyboard shortcut categories, command descriptions, and hotkey actions;
  - Customizations marketplace, installed plugins, lifecycle hooks, and built-in skill descriptions;
  - Native Electron and DOM context menus (Copy, Split view, Export as PDF, Revert conversation);
- **Safe Word-Boundary Matching Engine**: Employs regex isolation `(?<!\w)...\b` to prevent broken substring replacements and protects against dollar-sign (`$`) replacement corruption;
- **Dynamic Real-Time Observation (`MutationObserver`)**: Continuously translates dynamically streamed responses, placeholders, `aria-label`, `title`, and tooltip attributes;
- **Fail-Safe Installation & Rollback**: Automatic verified backups before patching with zero file lock conflicts.

## Supported Languages

| Code | Language | Native Name | Status | Coverage |
| :---: | :---: | :---: | :---: | :---: |
| `ru` | Russian | Русский | ✅ Complete | 979 phrases |
| `uk` | Ukrainian | Українська | ✅ Complete | 979 phrases |
| `en` | English | English | 🌐 Native | Default |
| `de` | German | Deutsch | 🔄 Expanded | 208 phrases |
| `fr` | French | Français | 🔄 Expanded | 198 phrases |
| `es` | Spanish | Español | 🔄 Expanded | 218 phrases |
| `zh` | Chinese | 中文 | 🔄 Expanded | 208 phrases |

## How It Works

1. **Clean Runtime Injection**:
   The installer injects the lightweight client `translator_client.js` into `dist/preload.js` within `app.asar`, ensuring isolated execution inside the window context.
2. **Dynamic DOM Translation**:
   An efficient `MutationObserver` translates DOM text nodes and attribute tooltips in real time as the model streams content and views render.
3. **Native Context Menu Interceptor**:
   Intercepts `electronNative.showContextMenu` so that OS-level menus and context actions display in your selected language.

## Testing

The project includes an automated test suite:

```bash
# Run via batch script
test.bat

# Or run via npm
npm test
```

The test suite validates:
1. **Translation Engine Unit Tests (`test_pipeline.js`)** — exact matches, regex word-boundary isolation, symbol safety, and latest changelog additions.
2. **Locale Files Integrity Tests (`test_locales.js`)** — syntax validation, non-empty values, and phrase counts across all 6 language files.
3. **Live UI Integration Test (`test_live.js`)** — automated detection of running Antigravity instances via Chrome DevTools Protocol (CDP) to verify DOM switcher rendering.

## Rollback (Uninstallation)

To return Antigravity to its original, unmodified state:
1. Run **`uninstall.bat`** (or `node uninstall.js`).
2. The original clean `app.asar.backup` is restored immediately.

## Important Notes

- The mod performs client-side UI translation. It does not alter your project code, compiler logs, or terminal command inputs.
- A clean backup (`app.asar.backup`) is always preserved before any modification.
- Fully tested and compatible with **Google Antigravity v2.23.1+**. If Google updates the app, simply re-run `install.bat`.

## Privacy & Security

All translations occur entirely offline on your local machine. No prompts, tokens, source code, or personal data ever leave your computer.

## License

This project is open-source and released under the [MIT License](LICENSE).

const fs = require('fs');
const path = require('path');
const asar = require('asar');

// Resolve standard Antigravity installation paths across platforms
function getAppResourcesDir() {
  if (process.platform === 'win32') {
    return path.join(process.env.LOCALAPPDATA || '', 'Programs', 'antigravity', 'resources');
  } else if (process.platform === 'darwin') {
    return '/Applications/Antigravity.app/Contents/Resources';
  } else {
    return '/opt/Antigravity/resources';
  }
}

const RESOURCES_DIR = getAppResourcesDir();
const TARGET_ASAR = path.join(RESOURCES_DIR, 'app.asar');
const BACKUP_ASAR = path.join(RESOURCES_DIR, 'app.asar.backup');
const CLEAN_EXTRACT = path.join(__dirname, 'extracted_clean');
const TEMP_BUILD = path.join(__dirname, 'temp_build');
const OUTPUT_ASAR = path.join(__dirname, 'app.asar.patched');

// Load all supported locales
const ALL_LOCALES = {
  en: {},
  uk: require('./locales/uk.js'),
  ru: require('./locales/ru.js'),
  de: require('./locales/de.js'),
  fr: require('./locales/fr.js'),
  es: require('./locales/es.js'),
  zh: require('./locales/zh.js')
};

const CLIENT_JS = fs.readFileSync(path.join(__dirname, 'translator_client.js'), 'utf8')
  .replace('__ALL_LOCALES__', JSON.stringify(ALL_LOCALES));

async function main() {
  console.log('\n======================================================');
  console.log('   Antigravity Multi-Language Localization Mod Builder');
  console.log('======================================================\n');

  // 1. Prepare base source directory
  if (fs.existsSync(TEMP_BUILD)) {
    fs.rmSync(TEMP_BUILD, { recursive: true, force: true });
  }

  if (fs.existsSync(CLEAN_EXTRACT)) {
    console.log('[1/4] Copying clean extracted app bundle...');
    fs.cpSync(CLEAN_EXTRACT, TEMP_BUILD, { recursive: true });
  } else {
    console.log('[1/4] Clean template not found, extracting from app.asar...');
    const sourceAsar = fs.existsSync(BACKUP_ASAR) ? BACKUP_ASAR : TARGET_ASAR;
    if (!fs.existsSync(sourceAsar)) {
      throw new Error(`Cannot find app.asar in ${RESOURCES_DIR}. Please ensure Antigravity is installed.`);
    }
    console.log(`      Extracting from ${sourceAsar}...`);
    asar.extractAll(sourceAsar, TEMP_BUILD);
  }

  // 2. Inject localization engine into preload.js
  console.log('[2/4] Injecting native localization engine and switcher...');
  const preloadPath = path.join(TEMP_BUILD, 'dist', 'preload.js');
  if (!fs.existsSync(preloadPath)) {
    throw new Error(`Could not find preload.js at ${preloadPath}`);
  }

  let preloadCode = fs.readFileSync(preloadPath, 'utf8');
  const injection = `
// --- Antigravity Multi-Language & Switcher Mod ---
try {
  const { webFrame } = require('electron');
  const __switcherScript = ${JSON.stringify(CLIENT_JS)};
  webFrame.executeJavaScript(__switcherScript);
} catch (e) {
  console.error('[Antigravity Mod] Failed to inject language switcher:', e);
}
// --- Antigravity Multi-Language & Switcher Mod End ---
`;

  preloadCode += injection;
  fs.writeFileSync(preloadPath, preloadCode, 'utf8');

  // 3. Package into patched app.asar
  console.log('[3/4] Packaging app.asar.patched...');
  if (fs.existsSync(OUTPUT_ASAR)) {
    fs.unlinkSync(OUTPUT_ASAR);
  }

  await asar.createPackageWithOptions(
    TEMP_BUILD,
    OUTPUT_ASAR,
    { unpack: '{*.node,**/node_modules/chrome-devtools-mcp/**}' }
  );

  // 4. Cleanup
  console.log('[4/4] Cleaning up temporary build artifacts...');
  fs.rmSync(TEMP_BUILD, { recursive: true, force: true });

  console.log('\n[SUCCESS] Built successfully: app.asar.patched');
  console.log('You can now run "install.bat" (or "npm run install-mod") to apply the mod!\n');
}

main().catch(err => {
  console.error('\n[BUILD FAILED]:', err.message);
  process.exit(1);
});

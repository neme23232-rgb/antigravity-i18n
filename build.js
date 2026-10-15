const fs = require('fs');
const path = require('path');
const asar = require('asar');

// Resolve standard Antigravity installation paths across platforms
function getAppResourcesDir() {
  if (process.env.ANTIGRAVITY_RESOURCES && fs.existsSync(process.env.ANTIGRAVITY_RESOURCES)) {
    return process.env.ANTIGRAVITY_RESOURCES;
  }
  let candidates = [];
  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || '';
    const programFiles = process.env.PROGRAMFILES || 'C:\\Program Files';
    const programFilesX86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';
    candidates = [
      path.join(localAppData, 'Programs', 'Antigravity', 'resources'),
      path.join(localAppData, 'Programs', 'antigravity', 'resources'),
      path.join(localAppData, 'Antigravity', 'resources'),
      path.join(localAppData, 'antigravity', 'resources'),
      path.join(programFiles, 'Antigravity', 'resources'),
      path.join(programFiles, 'Google Antigravity', 'resources'),
      path.join(programFilesX86, 'Antigravity', 'resources')
    ];
  } else if (process.platform === 'darwin') {
    candidates = [
      '/Applications/Antigravity.app/Contents/Resources',
      path.join(process.env.HOME || '', 'Applications/Antigravity.app/Contents/Resources')
    ];
  } else {
    candidates = [
      '/opt/Antigravity/resources',
      '/usr/lib/antigravity/resources'
    ];
  }
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0];
}

const RESOURCES_DIR = getAppResourcesDir();
const TARGET_ASAR = path.join(RESOURCES_DIR, 'app.asar');
const BACKUP_ASAR = path.join(RESOURCES_DIR, 'app.asar.backup');
const CLEAN_EXTRACT = path.join(__dirname, 'extracted_clean');
const TEMP_BUILD = path.join(__dirname, 'temp_build');
const OUTPUT_ASAR = path.join(__dirname, 'app.asar.patched');

function loadAllLocales() {
  const localeFiles = ['uk', 'ru', 'de', 'fr', 'es', 'zh'];
  const locales = { en: {} };
  for (const lang of localeFiles) {
    const locPath = path.join(__dirname, 'locales', `${lang}.js`);
    delete require.cache[require.resolve(locPath)];
    locales[lang] = require(locPath);
  }
  return locales;
}

function getClientScript() {
  const allLocales = loadAllLocales();
  const rawClient = fs.readFileSync(path.join(__dirname, 'translator_client.js'), 'utf8');
  return rawClient.replace('__ALL_LOCALES__', JSON.stringify(allLocales));
}

async function buildMod() {
  console.log('\n======================================================');
  console.log('   Antigravity Multi-Language Localization Mod Builder');
  console.log('======================================================\n');
  const CLIENT_JS = getClientScript();

  // 1. Prepare base source directory
  if (fs.existsSync(TEMP_BUILD)) {
    fs.rmSync(TEMP_BUILD, { recursive: true, force: true });
  }

  // Determine the best clean source to extract from:
  // Prefer the user's installed Antigravity app.asar to always match the exact version!
  let sourceAsar = null;
  if (fs.existsSync(TARGET_ASAR)) {
    try {
      const preloadCode = asar.extractFile(TARGET_ASAR, 'dist/preload.js').toString();
      if (!preloadCode.includes('Antigravity Multi-Language')) {
        sourceAsar = TARGET_ASAR;
      }
    } catch (e) {}
  }

  if (!sourceAsar && fs.existsSync(BACKUP_ASAR)) {
    try {
      const backupPreload = asar.extractFile(BACKUP_ASAR, 'dist/preload.js').toString();
      if (!backupPreload.includes('Antigravity Multi-Language')) {
        sourceAsar = BACKUP_ASAR;
      }
    } catch (e) {}
  }

  if (sourceAsar) {
    console.log(`[1/4] Extracting app bundle from installed Antigravity (${sourceAsar})...`);
    asar.extractAll(sourceAsar, TEMP_BUILD);

    // Keep clean local template updated
    try {
      if (fs.existsSync(CLEAN_EXTRACT)) {
        fs.rmSync(CLEAN_EXTRACT, { recursive: true, force: true });
      }
      fs.cpSync(TEMP_BUILD, CLEAN_EXTRACT, { recursive: true });
    } catch (e) {}
  } else if (fs.existsSync(CLEAN_EXTRACT)) {
    console.log('[1/4] Copying app bundle from clean template...');
    fs.cpSync(CLEAN_EXTRACT, TEMP_BUILD, { recursive: true });
  } else {
    throw new Error(`Cannot find app.asar in ${RESOURCES_DIR} or clean local template. Please ensure Google Antigravity is installed.`);
  }

  // Display version
  let appVersion = '2.0';
  const pkgPath = path.join(TEMP_BUILD, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.version) appVersion = pkg.version;
    } catch (e) {}
  }
  console.log(`      Target version: Antigravity v${appVersion}`);

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

  console.log('\n[SUCCESS] Successfully built: app.asar.patched (for v' + appVersion + ')');
  console.log('Run "install.bat" (or "npm run install-mod") to apply the mod!\n');
  return OUTPUT_ASAR;
}

if (require.main === module) {
  buildMod().catch(err => {
    console.error('\n[BUILD FAILED]:', err.message);
    process.exit(1);
  });
}

module.exports = { buildMod, getAppResourcesDir };

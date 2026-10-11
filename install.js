const fs = require('fs');
const path = require('path');

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
const PATCHED_ASAR = path.join(__dirname, 'app.asar.patched');

console.log('\n======================================================');
console.log('       Antigravity Localization Mod Installer');
console.log('======================================================\n');

if (!fs.existsSync(PATCHED_ASAR)) {
  console.error('[ERROR] app.asar.patched not found!');
  console.log('Please run "npm run build" or "build.bat" first to build the package.');
  process.exit(1);
}

if (!fs.existsSync(TARGET_ASAR)) {
  console.error(`[ERROR] Antigravity not found at: ${TARGET_ASAR}`);
  console.log('Please verify your Antigravity installation path.');
  process.exit(1);
}

// Create backup of original app.asar if not already present
if (!fs.existsSync(BACKUP_ASAR)) {
  console.log('[1/2] Creating backup: app.asar.backup...');
  try {
    fs.copyFileSync(TARGET_ASAR, BACKUP_ASAR);
    console.log('      Backup created successfully.');
  } catch (err) {
    console.error('[ERROR] Failed to create backup:', err.message);
    process.exit(1);
  }
} else {
  console.log('[1/2] Original backup already exists (app.asar.backup).');
}

// Replace target with patched asar
console.log('[2/2] Installing patched app.asar...');
try {
  fs.copyFileSync(PATCHED_ASAR, TARGET_ASAR);
  console.log('\n[SUCCESS] Mod installed successfully!');
  console.log('A native Language Switcher button will now appear directly above Settings in the sidebar.');
  console.log('Enjoy Google Antigravity in your language!\n');
} catch (err) {
  console.error('\n[ATTENTION] The app.asar file is currently in use by Antigravity.');
  console.log('Please close Antigravity completely and run "install.bat" again.\n');
  process.exit(1);
}

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getAsarModule() {
  try {
    return require('asar');
  } catch (e) {
    return require('./node_modules/asar');
  }
}

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
const TARGET_UNPACKED = path.join(RESOURCES_DIR, 'app.asar.unpacked');
const BACKUP_UNPACKED = path.join(RESOURCES_DIR, 'app.asar.unpacked.backup');

const PATCHED_ASAR = path.join(__dirname, 'app.asar.patched');
const PATCHED_UNPACKED = path.join(__dirname, 'app.asar.patched.unpacked');

function closeRunningAntigravity() {
  if (process.platform === 'win32') {
    try {
      const tasklist = execSync('tasklist /FI "IMAGENAME eq Antigravity.exe" /NH', { encoding: 'utf8' });
      if (tasklist.toLowerCase().includes('antigravity.exe')) {
        console.log('[*] Antigravity is currently running. Closing gracefully to allow installation...');
        try {
          execSync('taskkill /F /T /IM Antigravity.exe 2>nul');
        } catch (e) {}

        // Poll for up to 5 seconds to ensure all processes release file locks
        for (let i = 0; i < 10; i++) {
          const check = execSync('tasklist /FI "IMAGENAME eq Antigravity.exe" /NH', { encoding: 'utf8' });
          if (!check.toLowerCase().includes('antigravity.exe')) {
            break;
          }
          const start = Date.now();
          while (Date.now() - start < 500) {}
        }
      }
    } catch (e) {}
  }
}

function copyWithRetry(src, dest, retries = 5, delayMs = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      fs.copyFileSync(src, dest);
      return;
    } catch (err) {
      if (i === retries - 1) throw err;
      const start = Date.now();
      while (Date.now() - start < delayMs) {}
    }
  }
}

async function main() {
  console.log('\n======================================================');
  console.log('       Antigravity Localization Mod Installer');
  console.log('======================================================\n');

  if (!fs.existsSync(TARGET_ASAR)) {
    console.error(`[ERROR] Antigravity not found at: ${TARGET_ASAR}`);
    console.log('Please verify your Google Antigravity installation path.');
    process.exit(1);
  }

  const asar = getAsarModule();

  // Check if we need to build or rebuild app.asar.patched
  let needRebuild = !fs.existsSync(PATCHED_ASAR);

  if (!needRebuild) {
    try {
      const patchedPkg = JSON.parse(asar.extractFile(PATCHED_ASAR, 'package.json'));
      const targetPkg = JSON.parse(asar.extractFile(TARGET_ASAR, 'package.json'));
      if (targetPkg.version && patchedPkg.version !== targetPkg.version) {
        console.log(`[*] Version update detected (Antigravity v${targetPkg.version} vs mod v${patchedPkg.version}).`);
        needRebuild = true;
      }
    } catch (e) {
      needRebuild = true;
    }
  }

  // Check if translation files were modified more recently than the patched package
  if (!needRebuild && fs.existsSync(PATCHED_ASAR)) {
    const patchedMtime = fs.statSync(PATCHED_ASAR).mtimeMs;
    const sources = [
      path.join(__dirname, 'translator_client.js'),
      path.join(__dirname, 'build.js')
    ];
    const localesDir = path.join(__dirname, 'locales');
    if (fs.existsSync(localesDir)) {
      for (const f of fs.readdirSync(localesDir)) {
        sources.push(path.join(localesDir, f));
      }
    }
    for (const src of sources) {
      if (fs.existsSync(src) && fs.statSync(src).mtimeMs > patchedMtime) {
        console.log(`[*] Source file ${path.basename(src)} was updated. Rebuilding mod package...`);
        needRebuild = true;
        break;
      }
    }
  }

  if (needRebuild) {
    console.log('[*] Building fresh mod package...');
    try {
      const { buildMod } = require('./build.js');
      await buildMod();
    } catch (err) {
      console.error('[ERROR] Failed to build mod automatically:', err.message);
      process.exit(1);
    }
  }

  // Ensure Antigravity is closed before modifying resources
  closeRunningAntigravity();

  // 1. Create or refresh clean backup
  if (!fs.existsSync(BACKUP_ASAR)) {
    console.log('[1/2] Creating clean backup: app.asar.backup...');
    try {
      copyWithRetry(TARGET_ASAR, BACKUP_ASAR);
      console.log('      app.asar backup created successfully.');
      if (fs.existsSync(TARGET_UNPACKED) && !fs.existsSync(BACKUP_UNPACKED)) {
        fs.cpSync(TARGET_UNPACKED, BACKUP_UNPACKED, { recursive: true });
        console.log('      app.asar.unpacked backup created successfully.');
      }
    } catch (err) {
      console.error('[ERROR] Failed to create backup:', err.message);
      process.exit(1);
    }
  } else {
    // Check if TARGET_ASAR is a new official Google update compared to existing backup
    try {
      const targetPreload = asar.extractFile(TARGET_ASAR, 'dist/preload.js').toString();
      if (!targetPreload.includes('Antigravity Multi-Language')) {
        console.log('[1/2] Fresh official update detected in app.asar. Updating clean backup...');
        copyWithRetry(TARGET_ASAR, BACKUP_ASAR);
        if (fs.existsSync(TARGET_UNPACKED)) {
          if (fs.existsSync(BACKUP_UNPACKED)) fs.rmSync(BACKUP_UNPACKED, { recursive: true, force: true });
          fs.cpSync(TARGET_UNPACKED, BACKUP_UNPACKED, { recursive: true });
        }
        console.log('      Backup updated to latest official version.');
      } else {
        console.log('[1/2] Clean backup already in place (app.asar.backup).');
      }
    } catch (e) {
      console.log('[1/2] Backup already exists.');
    }
  }

  // 2. Install patched asar
  console.log('[2/2] Installing patched app.asar into Antigravity...');
  try {
    copyWithRetry(PATCHED_ASAR, TARGET_ASAR);
    if (fs.existsSync(PATCHED_UNPACKED)) {
      if (fs.existsSync(TARGET_UNPACKED)) {
        fs.cpSync(PATCHED_UNPACKED, TARGET_UNPACKED, { recursive: true, force: true });
      }
    }
    console.log('\n======================================================');
    console.log(' [SUCCESS] Antigravity Language Mod Installed!');
    console.log('======================================================');
    console.log('A new Language Switcher button is now integrated directly');
    console.log('above Settings in the left sidebar.');
    console.log('You can now open Google Antigravity and enjoy the app in your language!\n');
  } catch (err) {
    console.error('\n[ATTENTION] The app.asar file could not be overwritten: ' + err.message);
    console.log('Please ensure Antigravity is completely closed and run "install.bat" again.\n');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('\n[INSTALLATION FAILED]:', err.message);
  process.exit(1);
});

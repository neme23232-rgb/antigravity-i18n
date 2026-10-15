const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

function closeRunningAntigravity() {
  if (process.platform === 'win32') {
    try {
      const tasklist = execSync('tasklist /FI "IMAGENAME eq Antigravity.exe" /NH', { encoding: 'utf8' });
      if (tasklist.toLowerCase().includes('antigravity.exe')) {
        console.log('[*] Antigravity is currently running. Closing to restore backup...');
        try {
          execSync('taskkill /F /T /IM Antigravity.exe 2>nul');
        } catch (e) {}

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

console.log('\n======================================================');
console.log('       Antigravity Localization Mod Uninstaller');
console.log('======================================================\n');

if (!fs.existsSync(BACKUP_ASAR)) {
  console.error('[ERROR] Backup file app.asar.backup not found!');
  console.log(`Expected location: ${BACKUP_ASAR}`);
  console.log('Cannot restore original state without a backup.');
  process.exit(1);
}

closeRunningAntigravity();

try {
  copyWithRetry(BACKUP_ASAR, TARGET_ASAR);
  if (fs.existsSync(BACKUP_UNPACKED)) {
    if (fs.existsSync(TARGET_UNPACKED)) fs.rmSync(TARGET_UNPACKED, { recursive: true, force: true });
    fs.cpSync(BACKUP_UNPACKED, TARGET_UNPACKED, { recursive: true });
  }
  console.log('[SUCCESS] Original clean app.asar restored successfully!');
  console.log('Google Antigravity has been reverted to its default state.\n');
} catch (err) {
  console.error('\n[ATTENTION] The app.asar file could not be restored: ' + err.message);
  console.log('Please close Antigravity completely and run "uninstall.bat" again.\n');
  process.exit(1);
}

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

console.log('\n======================================================');
console.log('       Antigravity Localization Mod Uninstaller');
console.log('======================================================\n');

if (!fs.existsSync(BACKUP_ASAR)) {
  console.error('[ERROR] Backup file app.asar.backup not found!');
  console.log(`Expected location: ${BACKUP_ASAR}`);
  process.exit(1);
}

try {
  fs.copyFileSync(BACKUP_ASAR, TARGET_ASAR);
  console.log('[SUCCESS] Original app.asar restored successfully!');
  console.log('Antigravity has been reverted to its default state.\n');
} catch (err) {
  console.error('\n[ATTENTION] The app.asar file is currently in use by Antigravity.');
  console.log('Please close Antigravity completely and run "uninstall.bat" again.\n');
  process.exit(1);
}

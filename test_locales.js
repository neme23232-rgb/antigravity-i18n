const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('\n======================================================');
console.log('   Antigravity i18n Locales Coverage & Integrity Test');
console.log('======================================================\n');

const localesDir = path.join(__dirname, 'locales');
const localeFiles = ['uk', 'ru', 'de', 'fr', 'es', 'zh'];

let errors = 0;
const stats = [];

for (const lang of localeFiles) {
  const filePath = path.join(localesDir, `${lang}.js`);
  try {
    assert(fs.existsSync(filePath), `File does not exist: ${filePath}`);
    const dict = require(filePath);
    assert(typeof dict === 'object' && dict !== null, `${lang}.js did not export an object`);

    const keys = Object.keys(dict);
    assert(keys.length > 50, `${lang}.js has too few translations (${keys.length})`);

    let emptyValues = 0;
    for (const [k, v] of Object.entries(dict)) {
      if (!v || typeof v !== 'string' || !v.trim()) {
        emptyValues++;
      }
    }
    assert.strictEqual(emptyValues, 0, `${lang}.js contains ${emptyValues} empty translation values`);

    stats.push({
      lang: lang.toUpperCase(),
      file: `${lang}.js`,
      phrases: keys.length,
      status: 'OK'
    });
    console.log(` [PASS] ${lang.toUpperCase()} (${lang}.js): ${keys.length} phrases verified.`);
  } catch (err) {
    console.error(` [FAIL] ${lang.toUpperCase()}: ${err.message}`);
    errors++;
  }
}

console.log('\n------------------------------------------------------');
console.table(stats);
console.log('------------------------------------------------------\n');

if (errors > 0) {
  process.exit(1);
}

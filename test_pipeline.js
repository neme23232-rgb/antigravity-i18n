const assert = require('assert');
const path = require('path');

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildSafeRegex(k) {
  const startsWithWord = /^\w/.test(k);
  const endsWithWord = /\w$/.test(k);
  const prefix = startsWithWord ? '(?<![a-zA-Z0-9_])' : '';
  const suffix = endsWithWord ? '(?![a-zA-Z0-9_])' : '';
  return new RegExp(prefix + escapeRegExp(k) + suffix, 'g');
}

function createTranslator(dict) {
  const sortedKeys = Object.keys(dict).sort((a, b) => b.length - a.length);

  return function getTranslation(str) {
    if (!str) return null;
    const trimmed = str.trim();
    if (!trimmed) return null;

    if (dict[trimmed]) {
      return str.replace(trimmed, () => dict[trimmed]);
    }

    let result = str;
    let modified = false;

    for (let i = 0; i < sortedKeys.length; i++) {
      const k = sortedKeys[i];
      if (k.length >= 2 && result.includes(k)) {
        const regex = buildSafeRegex(k);
        const replaced = result.replace(regex, () => dict[k]);
        if (replaced !== result) {
          result = replaced;
          modified = true;
        }
      }
    }

    return modified ? result : null;
  };
}

const ruDict = require('./locales/ru.js');
const ukDict = require('./locales/uk.js');

const translateRu = createTranslator(ruDict);
const translateUk = createTranslator(ukDict);

console.log('\n======================================================');
console.log('   Antigravity i18n Translation Engine Unit Tests');
console.log('======================================================\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(` [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(` [FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

// 1. Exact matches
test('Exact match for New Conversation', () => {
  assert.strictEqual(translateRu('New Conversation'), 'Новый диалог');
  assert.strictEqual(translateUk('New Conversation'), 'Нова розмова');
});

test('Exact match for Settings', () => {
  assert.strictEqual(translateRu('Settings'), 'Настройки');
  assert.strictEqual(translateUk('Settings'), 'Налаштування');
});

// 2. Word boundary safety (prevent substring replacements)
test('Word boundary isolation: Edit vs Edited vs Edits', () => {
  assert.strictEqual(translateRu('Edit'), 'Правка');
  assert.strictEqual(translateRu('Edited'), 'Отредактировано');
  assert.strictEqual(translateRu('Edits'), 'Правки');
  assert.strictEqual(translateRu('1 Edit and 2 Edits'), '1 Правка and 2 Правки');
});

// 3. Changelog v2.23.1 additions (License picker & onboarding fix)
test('License picker and onboarding (v2.23.1)', () => {
  assert.strictEqual(translateRu('License picker'), 'Выбор лицензии');
  assert.strictEqual(translateRu('license picker'), 'выбор лицензии');
  assert.strictEqual(translateRu('License selection'), 'Выбор лицензии');
  assert.strictEqual(translateRu('Choose a license'), 'Выберите лицензию');
  assert.strictEqual(translateRu('Select License'), 'Выбрать лицензию');
  assert.strictEqual(translateRu('Available licenses'), 'Доступные лицензии');
  assert.strictEqual(translateRu('Loading licenses...'), 'Загрузка лицензий...');
  assert.strictEqual(translateRu('Other License'), 'Другая лицензия');
  assert.strictEqual(translateRu('Enter Google Cloud Project Details'), 'Введите данные проекта Google Cloud');
  assert.strictEqual(translateRu('Google Cloud Project ID'), 'Идентификатор проекта Google Cloud');
  assert.strictEqual(translateRu('Sign in with a different account'), 'Войти с другим аккаунтом');
  assert.strictEqual(translateRu('Send now'), 'Отправить сейчас');
  assert.strictEqual(translateRu('Attach folder'), 'Прикрепить папку');
  assert.strictEqual(translateUk('License picker'), 'Вибір ліцензії');
  assert.strictEqual(translateUk('Choose a license'), 'Виберіть ліцензію');
  assert.strictEqual(translateUk('Select License'), 'Вибрати ліцензію');
  assert.strictEqual(translateUk('Send now'), 'Надіслати зараз');
});

// 4. Changelog v2.23.0 additions
test('Permissions preset and picker (v2.23.0)', () => {
  assert.strictEqual(translateRu('Permissions picker'), 'Выбор разрешений');
  assert.strictEqual(translateRu('Permissions preset'), 'Пресет разрешений');
  assert.strictEqual(translateRu('Use Global Settings'), 'Использовать глобальные настройки');
  assert.strictEqual(translateRu('Full machine'), 'Полный доступ к системе');
  assert.strictEqual(translateRu('Turbo mode'), 'Турбо-режим');
});

test('Full-screen media viewer and video speed (v2.23.0)', () => {
  assert.strictEqual(translateRu('Full-screen viewer'), 'Полноэкранный просмотр');
  assert.strictEqual(translateRu('Save Video'), 'Сохранить видео');
  assert.strictEqual(translateRu('Hold Space for 2x speed'), 'Удерживайте Пробел для скорости 2x');
  assert.strictEqual(translateRu('2x speed'), 'Скорость 2x');
});

test('Zip and folder attachments (v2.23.0)', () => {
  assert.strictEqual(translateRu('Attach .zip archive'), 'Прикрепить архив .zip');
  assert.strictEqual(translateRu('Attach .zip'), 'Прикрепить .zip');
  assert.strictEqual(translateRu('Add folder'), 'Добавить папку');
});

test('MCP server actions (v2.23.0)', () => {
  assert.strictEqual(translateRu('Fix with Agent'), 'Исправить с помощью Агента');
  assert.strictEqual(translateRu('Restart MCP server'), 'Перезапустить MCP-сервер');
  assert.strictEqual(translateRu('Restart'), 'Перезапустить');
});

test('Subagents status and approval (v2.23.0)', () => {
  assert.strictEqual(translateRu('Open subagent'), 'Открыть субагента');
  assert.strictEqual(translateRu('Needs attention'), 'Требует внимания');
  assert.strictEqual(translateRu('Waiting for approval'), 'Ожидает подтверждения');
});

// 4. Changelog v2.21 - v2.22 additions
test('Automations and tasks (v2.21)', () => {
  assert.strictEqual(translateRu('Automations'), 'Автоматизации');
  assert.strictEqual(translateRu('Run Now'), 'Запустить сейчас');
  assert.strictEqual(translateRu('Create with Prompt'), 'Создать через промпт');
});

test('Documents section and whitespace diffs (v2.13)', () => {
  assert.strictEqual(translateRu('Documents'), 'Документы');
  assert.strictEqual(translateRu('Hide Whitespace Changes'), 'Скрыть изменения пробелов');
  assert.strictEqual(translateRu('Scratch Files'), 'Временные файлы');
});

// 5. Context menus and shortcuts
test('Context menus and shortcuts', () => {
  assert.strictEqual(translateRu('Show in File Explorer'), 'Показать в Проводнике');
  assert.strictEqual(translateRu('Reveal in Finder'), 'Показать в Finder');
  assert.strictEqual(translateRu('Toggle Between Light/Dark Themes'), 'Переключить светлую/тёмную тему');
  assert.strictEqual(translateRu('Export as PDF'), 'Экспорт в PDF');
  assert.strictEqual(translateRu('Revert only the conversation'), 'Откатить только диалог');
});

// 6. Dollar-sign safety
test('Dollar-sign replacement safety ($1, $&)', () => {
  const customDict = { 'Price': 'Цена: $100' };
  const customTrans = createTranslator(customDict);
  assert.strictEqual(customTrans('Price'), 'Цена: $100');
});

console.log('\n------------------------------------------------------');
console.log(`Results: ${passed} passed, ${failed} failed.`);
console.log('------------------------------------------------------\n');

if (failed > 0) {
  process.exit(1);
}

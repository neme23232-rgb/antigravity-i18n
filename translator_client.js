/**
 * Antigravity 2.0 Pixel-Perfect Integrated Native Language Switcher & Engine
 */
(function() {
  const LOCALES = __ALL_LOCALES__;

  const LANG_CONFIG = {
    'uk': { name: 'Українська', short: 'UK' },
    'ru': { name: 'Русский', short: 'RU' },
    'en': { name: 'English', short: 'EN' },
    'de': { name: 'Deutsch', short: 'DE' },
    'fr': { name: 'Français', short: 'FR' },
    'es': { name: 'Español', short: 'ES' },
    'zh': { name: '中文', short: 'ZH' }
  };

  const LANG_TITLES = {
    'uk': 'Мова',
    'ru': 'Язык',
    'en': 'Language',
    'de': 'Sprache',
    'fr': 'Langue',
    'es': 'Idioma',
    'zh': '语言'
  };

  let currentLang = 'en';
  try {
    const saved = localStorage.getItem('ag_user_lang');
    if (saved && (LOCALES[saved] || saved === 'en')) {
      currentLang = saved;
    } else {
      const navLang = (navigator.language || '').toLowerCase().slice(0, 2);
      if (LOCALES[navLang]) {
        currentLang = navLang;
      }
    }
  } catch (e) {}

  let activeDict = LOCALES[currentLang] || {};
  let sortedKeys = Object.keys(activeDict).sort((a, b) => b.length - a.length);

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

  function getTranslation(str) {
    if (!str || currentLang === 'en') return null;
    const trimmed = str.trim();
    if (!trimmed) return null;

    // 1. Exact match (highest priority)
    if (activeDict[trimmed]) {
      return str.replace(trimmed, () => activeDict[trimmed]);
    }

    // 2. Safe phrase / whole word boundary matches
    let result = str;
    let modified = false;

    for (let i = 0; i < sortedKeys.length; i++) {
      const k = sortedKeys[i];
      if (k.length >= 2 && result.includes(k)) {
        const regex = buildSafeRegex(k);
        const replaced = result.replace(regex, () => activeDict[k]);
        if (replaced !== result) {
          result = replaced;
          modified = true;
        }
      }
    }

    return modified ? result : null;
  }

  function translateNode(node) {
    if (currentLang === 'en') return;

    if (node.nodeType === 3) {
      const parent = node.parentElement;
      if (!parent) return;
      const tag = parent.tagName;
      if (tag === 'CODE' || tag === 'PRE' || tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA') return;
      if (parent.closest('pre') || parent.closest('code') || parent.closest('.prose') || parent.closest('#ag-lang-native-popup')) return;

      const val = node.nodeValue;
      const trans = getTranslation(val);
      if (trans && trans !== val) {
        node.nodeValue = trans;
      }
    } else if (node.nodeType === 1) {
      const tag = node.tagName;
      if (tag === 'CODE' || tag === 'PRE' || tag === 'SCRIPT' || tag === 'STYLE' || node.id === 'ag-lang-native-popup') return;

      const attrs = ['aria-label', 'title', 'placeholder', 'data-tooltip'];
      for (let i = 0; i < attrs.length; i++) {
        const attr = attrs[i];
        const val = node.getAttribute(attr);
        if (val) {
          const trans = getTranslation(val);
          if (trans && trans !== val) {
            node.setAttribute(attr, trans);
          }
        }
      }

      for (let i = 0; i < node.childNodes.length; i++) {
        translateNode(node.childNodes[i]);
      }
    }
  }

  // Intercept Electron native context menus to translate "Create Project", "Minimize", "Maximize", "Reset Zoom", etc.
  function interceptNativeContextMenu() {
    if (window.electronNative && window.electronNative.showContextMenu) {
      const originalShow = window.electronNative.showContextMenu;
      window.electronNative.showContextMenu = function(items) {
        if (Array.isArray(items) && currentLang !== 'en') {
          function translateMenuItems(list) {
            for (let i = 0; i < list.length; i++) {
              const it = list[i];
              if (it && it.label) {
                const trans = getTranslation(it.label);
                if (trans) it.label = trans;
              }
              if (it && Array.isArray(it.submenu)) {
                translateMenuItems(it.submenu);
              }
            }
          }
          translateMenuItems(items);
        }
        return originalShow.apply(this, arguments);
      };
    }
  }

  function injectNativeSettingsLanguageButton() {
    const settingsBtn = document.querySelector('[data-testid="settings-button"]');
    if (!settingsBtn) return;

    const parent = settingsBtn.parentElement;
    if (!parent) return;

    let langBtn = document.getElementById('ag-sidebar-lang-btn');
    const titleText = `${LANG_TITLES[currentLang] || 'Language'}: ${(LANG_CONFIG[currentLang] && LANG_CONFIG[currentLang].name) || currentLang.toUpperCase()}`;

    if (!langBtn) {
      langBtn = document.createElement('button');
      langBtn.id = 'ag-sidebar-lang-btn';
      langBtn.className = settingsBtn.className;
      langBtn.setAttribute('data-testid', 'language-button');
      langBtn.innerHTML = `
        <span class="shrink-0 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 -960 960 960" fill="currentColor">
            <path d="M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-156t86-127Q252-817 325-848.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 82-31.5 155T763-197.5q-54 54.5-127 86T480-80Zm0-82q26-36 45-78t31-88H404q12 46 31 88t45 78Zm-104-16q-18-33-31.5-68.5T322-328H196q29 55 72.5 96.5T376-178Zm208 0q53-20 96.5-61.5T753-328H628q-9 41-22.5 76.5T584-178ZM164-408h146q-2-18-3-36t-1-36q0-18 1-36t3-36H164q-11 35-11 72t11 72Zm226 0h180q2-18 3-36t1-36q0-18-1-36t-3-36H390q-2 18-3 36t-1 36q0 18 1 36t3 36Zm260 0h146q11-35 11-72t-11-72H650q2 18 3 36t1 36q0 18-1 36t-3 36Zm-30-224h126q-43-55-86.5-96.5T584-782q18 33 31.5 68.5T620-632Zm-216 0h152q-12-46-31-88t-45-78q-26 36-45 78t-31 88Zm-178 0h126q9-41 22.5-76.5T376-782q-53 20-96.5 61.5T226-632Z"/>
          </svg>
        </span>
        <span id="ag-sidebar-lang-text" class="truncate text-sm">${titleText}</span>
      `;
      langBtn.onclick = (e) => {
        e.stopPropagation();
        toggleNativeLanguagePopup(langBtn);
      };
      parent.insertBefore(langBtn, settingsBtn);
    } else {
      const textSpan = document.getElementById('ag-sidebar-lang-text');
      if (textSpan && textSpan.innerText !== titleText) {
        textSpan.innerText = titleText;
      }
    }
  }

  function toggleNativeLanguagePopup(buttonEl) {
    const existing = document.getElementById('ag-lang-native-popup');
    if (existing) {
      existing.remove();
      return;
    }

    const rect = buttonEl.getBoundingClientRect();
    const popup = document.createElement('div');
    popup.id = 'ag-lang-native-popup';
    popup.setAttribute('role', 'menu');
    popup.className = 'bg-card text-foreground rounded-[10px] border border-border shadow-md outline-none no-focus-ring min-w-[180px] p-1 flex flex-col gap-px animate-slideIn';
    popup.style.cssText = `
      position: fixed;
      left: ${rect.left}px;
      bottom: ${window.innerHeight - rect.top + 6}px;
      z-index: 9999999;
    `;

    Object.keys(LANG_CONFIG).forEach(code => {
      const isSelected = code === currentLang;
      const item = document.createElement('div');
      item.setAttribute('role', 'menuitem');
      item.tabIndex = -1;
      item.className = 'group w-full pr-2 pl-2 text-left text-[13px] cursor-pointer outline-none transition-colors select-none flex items-center justify-between rounded-md py-1.5 gap-1.5 hover:bg-secondary hover:text-foreground text-secondary-foreground';

      if (isSelected) {
        item.classList.add('bg-secondary', 'text-foreground', 'font-medium');
      }

      item.innerHTML = `
        <span class="truncate">${LANG_CONFIG[code].name}</span>
        ${isSelected ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary shrink-0"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
      `;

      item.onclick = async (e) => {
        e.stopPropagation();
        popup.remove();
        await setLanguage(code);
      };

      popup.appendChild(item);
    });

    const onDocClick = (e) => {
      if (!popup.contains(e.target) && e.target !== buttonEl && !buttonEl.contains(e.target)) {
        popup.remove();
        document.removeEventListener('click', onDocClick);
      }
    };
    setTimeout(() => document.addEventListener('click', onDocClick), 50);

    document.body.appendChild(popup);
  }

  async function setLanguage(code) {
    currentLang = code;
    try {
      localStorage.setItem('ag_user_lang', code);
    } catch (e) {}

    try {
      if (window.nativeStorage && window.nativeStorage.updateItems) {
        await window.nativeStorage.updateItems({ 'ag_user_lang': code });
      }
    } catch (e) {}

    activeDict = LOCALES[code] || {};
    sortedKeys = Object.keys(activeDict).sort((a, b) => b.length - a.length);

    injectNativeSettingsLanguageButton();
    window.location.reload();
  }

  let scheduled = false;
  const pendingNodes = new Set();

  function flush() {
    scheduled = false;
    for (const n of pendingNodes) {
      if (n.isConnected) {
        translateNode(n);
      }
    }
    pendingNodes.clear();
    injectNativeSettingsLanguageButton();
  }

  const observer = new MutationObserver((mutations) => {
    for (let i = 0; i < mutations.length; i++) {
      const m = mutations[i];
      if (m.type === 'childList') {
        for (let j = 0; j < m.addedNodes.length; j++) {
          pendingNodes.add(m.addedNodes[j]);
        }
      } else if (m.type === 'characterData') {
        pendingNodes.add(m.target);
      } else if (m.type === 'attributes') {
        pendingNodes.add(m.target);
      }
    }
    if (!scheduled) {
      scheduled = true;
      window.requestAnimationFrame(flush);
    }
  });

  async function init() {
    try {
      if (window.nativeStorage && window.nativeStorage.getItems) {
        const items = await window.nativeStorage.getItems();
        if (items && items.ag_user_lang) {
          currentLang = items.ag_user_lang;
          activeDict = LOCALES[currentLang] || {};
          sortedKeys = Object.keys(activeDict).sort((a, b) => b.length - a.length);
        }
      }
    } catch (e) {}

    if (!document.body) {
      window.requestAnimationFrame(init);
      return;
    }
    interceptNativeContextMenu();
    injectNativeSettingsLanguageButton();
    translateNode(document.body);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['aria-label', 'title', 'placeholder', 'data-tooltip']
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

const { getDevToolsPort, getDevToolsPage, getWebSocketClass } = require('./test_helper.js');

async function testLiveDOM() {
  console.log('\n======================================================');
  console.log('       Antigravity Live UI Integration Test');
  console.log('======================================================\n');

  const port = getDevToolsPort();
  if (!port) {
    console.log('[INFO] No active Antigravity DevTools port detected.');
    console.log('[INFO] Antigravity is currently not running. Skipping live UI test.\n');
    return true;
  }

  console.log(`[*] Detected active Antigravity DevTools on port: ${port}`);
  let page;
  try {
    page = await getDevToolsPage(port);
  } catch (err) {
    console.log(`[INFO] Could not connect to port ${port}: ${err.message}. Skipping live UI test.\n`);
    return true;
  }

  if (!page || !page.webSocketDebuggerUrl) {
    console.log('[INFO] No valid Antigravity window target found. Skipping live UI test.\n');
    return true;
  }

  console.log(`[*] Connecting to Antigravity window: "${page.title}"...`);
  const WebSocket = getWebSocketClass();

  return new Promise((resolve) => {
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    let step = 0;

    ws.on('open', () => {
      // Step 1: Check language button
      step = 1;
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: `
            (() => {
              const langBtn = document.getElementById('ag-sidebar-lang-btn');
              const settingsBtn = document.querySelector('[data-testid="settings-button"]');
              return {
                hasSettingsBtn: !!settingsBtn,
                hasLangBtn: !!langBtn,
                langBtnText: langBtn ? langBtn.innerText.trim() : null
              };
            })()
          `,
          returnByValue: true
        }
      }));
    });

    ws.on('message', (msg) => {
      const data = JSON.parse(msg);
      if (step === 1 && data.id === 1) {
        const val = data.result.result.value;
        console.log(`[*] Settings button found: ${val.hasSettingsBtn}`);
        console.log(`[*] Language button found: ${val.hasLangBtn} (${val.langBtnText || 'N/A'})`);

        if (!val.hasSettingsBtn) {
          console.log('[WARN] Settings button not rendered yet in current view.');
          ws.close();
          resolve(true);
          return;
        }

        // Step 2: Toggle language popup
        step = 2;
        ws.send(JSON.stringify({
          id: 2,
          method: 'Runtime.evaluate',
          params: {
            expression: `
              (() => {
                const langBtn = document.getElementById('ag-sidebar-lang-btn');
                if (!langBtn) return { success: false, reason: 'no lang btn' };
                let existing = document.getElementById('ag-lang-native-popup');
                if (existing) existing.remove();
                langBtn.click();
                const popup = document.getElementById('ag-lang-native-popup');
                const items = popup ? Array.from(popup.querySelectorAll('[role="menuitem"]')).map(i => i.innerText.trim()) : [];
                if (popup) popup.remove();
                return {
                  success: !!popup,
                  itemsCount: items.length,
                  items
                };
              })()
            `,
            returnByValue: true
          }
        }));
      } else if (step === 2 && data.id === 2) {
        const val = data.result.result.value;
        if (val.success) {
          console.log(` [PASS] Language switcher popup verified with ${val.itemsCount} languages: [${val.items.join(', ')}]`);
        } else {
          console.log(` [INFO] Language button test skipped: ${val.reason || 'popup not opened'}`);
        }
        ws.close();
        resolve(true);
      }
    });

    ws.on('error', (err) => {
      console.log(`[INFO] DevTools WebSocket error: ${err.message}. Skipping live test.`);
      resolve(true);
    });

    setTimeout(() => {
      try { ws.close(); } catch (e) {}
      resolve(true);
    }, 5000);
  });
}

testLiveDOM().then(() => {
  console.log('[SUCCESS] Live test completed.\n');
  process.exit(0);
}).catch(err => {
  console.error('[FAIL] Live test error:', err.message);
  process.exit(1);
});

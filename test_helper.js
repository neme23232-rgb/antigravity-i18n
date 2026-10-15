const fs = require('fs');
const path = require('path');
const http = require('http');

function getDevToolsPort() {
  const candidates = [];
  if (process.platform === 'win32') {
    if (process.env.APPDATA) candidates.push(path.join(process.env.APPDATA, 'Antigravity', 'DevToolsActivePort'));
    if (process.env.LOCALAPPDATA) candidates.push(path.join(process.env.LOCALAPPDATA, 'Antigravity', 'DevToolsActivePort'));
  } else if (process.platform === 'darwin') {
    if (process.env.HOME) candidates.push(path.join(process.env.HOME, 'Library', 'Application Support', 'Antigravity', 'DevToolsActivePort'));
  } else {
    if (process.env.HOME) candidates.push(path.join(process.env.HOME, '.config', 'Antigravity', 'DevToolsActivePort'));
  }

  for (const c of candidates) {
    if (fs.existsSync(c)) {
      try {
        const lines = fs.readFileSync(c, 'utf8').trim().split(/\r?\n/);
        const port = parseInt(lines[0], 10);
        if (port && !isNaN(port)) return port;
      } catch (e) {}
    }
  }
  return null;
}

function getDevToolsPage(port) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://127.0.0.1:${port}/json`, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const list = JSON.parse(body);
          const page = list.find(p => p.url && !p.url.startsWith('data:') && p.type === 'page') ||
                       list.find(p => p.type === 'page' || (p.title && p.title.includes('Antigravity')));
          if (page && page.webSocketDebuggerUrl) {
            resolve(page);
          } else {
            resolve(list[0] || null);
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(3000, () => {
      req.destroy();
      reject(new Error('Connection timed out'));
    });
  });
}

function getWebSocketClass() {
  try {
    return require('ws');
  } catch (e) {
    return require('./node_modules/ws');
  }
}

module.exports = {
  getDevToolsPort,
  getDevToolsPage,
  getWebSocketClass
};

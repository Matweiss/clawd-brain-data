import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// The customer sandbox is a real route in tests: the page and its API run
// through the same handler production uses, with a test secret.
const require = createRequire(import.meta.url);
process.env.SCENARIO_SECRET = process.env.SCENARIO_SECRET || 'playwright-secret-that-is-long-enough-for-aes-256';
// The link registry runs in memory here so the dashboard can be exercised.
process.env.SANDBOX_STORE = process.env.SANDBOX_STORE || 'memory';
process.env.SANDBOX_ADMIN_KEY = process.env.SANDBOX_ADMIN_KEY || 'playwright-dashboard-key';
const playHandler = require('../api/play.js');
const linksHandler = require('../api/links.js');
const dealHandler = require('../api/deal.js');

function shim(req, res, body, query) {
  const out = {
    setHeader: (k, v) => res.setHeader(k, v),
    status: (n) => { res.statusCode = n; return out; },
    json: (b) => { res.setHeader('content-type', 'application/json; charset=utf-8'); res.end(JSON.stringify(b)); return out; },
    end: (b) => { res.end(b); return out; },
  };
  return { req: { method: req.method, headers: req.headers, query, body }, res: out };
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PW_PORT || 8766);
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8'
};

http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`), urlPath = url.pathname;
  if (urlPath === '/play' || urlPath === '/api/play' || urlPath === '/links' || urlPath === '/api/links' || urlPath === '/api/deal') {
    const handler = urlPath.endsWith('links') ? linksHandler : urlPath === '/api/deal' ? dealHandler : playHandler;
    let raw = '';
    req.on('data', (c) => { raw += c; });
    req.on('end', () => {
      let body = {};
      try { body = raw ? JSON.parse(raw) : {}; } catch { body = {}; }
      const query = Object.fromEntries(url.searchParams.entries());
      const s = shim(req, res, body, query);
      Promise.resolve(handler(s.req, s.res)).catch((e) => { res.statusCode = 500; res.end(String(e)); });
    });
    return;
  }
  const relative = urlPath === '/' ? 'api/app.html' : urlPath.replace(/^\//, '');
  const filePath = path.resolve(root, relative);
  if (!filePath.startsWith(root + path.sep) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  res.writeHead(200, { 'content-type': contentTypes[path.extname(filePath)] || 'application/octet-stream' });
  if (relative === 'api/app.html') {
    // Mirror api/index.js so the footer stamp renders in tests too.
    res.end(fs.readFileSync(filePath, 'utf8').replace('__BUILD_SHA__', 'local').replace('__BUILD_DATE__', new Date().toISOString().slice(0, 10)));
    return;
  }
  fs.createReadStream(filePath).pipe(res);
}).listen(port, '127.0.0.1');

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const COOKIE = 'lucra_roi_auth';
const DAY = 60 * 60 * 24;

function secret() {
  return process.env.ROI_AUTH_SECRET || process.env.ROI_PASSWORD || 'dev-secret-change-me';
}
function password() {
  return process.env.ROI_PASSWORD || '';
}
function sign(value) {
  return crypto.createHmac('sha256', secret()).update(value).digest('hex');
}
function token() {
  const payload = JSON.stringify({ ok: true, exp: Math.floor(Date.now() / 1000) + DAY * 14 });
  const b64 = Buffer.from(payload).toString('base64url');
  return `${b64}.${sign(b64)}`;
}
function parseCookies(req) {
  return Object.fromEntries(String(req.headers.cookie || '').split(';').map(v => v.trim()).filter(Boolean).map(v => {
    const i = v.indexOf('=');
    return [decodeURIComponent(v.slice(0, i)), decodeURIComponent(v.slice(i + 1))];
  }));
}
function authed(req) {
  if (!password()) return true;
  const raw = parseCookies(req)[COOKIE];
  if (!raw || !raw.includes('.')) return false;
  const [b64, sig] = raw.split('.');
  if (sig !== sign(b64)) return false;
  try {
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString());
    return payload.ok && payload.exp > Math.floor(Date.now() / 1000);
  } catch { return false; }
}
function loginHtml(error = '') {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Lucra ROI Login</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0d0d0f;color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif}.box{width:min(420px,calc(100vw - 40px));background:#181820;border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:28px;box-shadow:0 24px 80px rgba(0,0,0,.35)}h1{margin:0 0 6px;font-size:24px}.sub{color:#a1a1aa;font-size:13px;margin-bottom:18px}input{width:100%;box-sizing:border-box;background:#0d0d0f;color:#fff;border:1px solid rgba(255,255,255,.14);border-radius:10px;padding:12px 14px;font-size:16px}button{width:100%;margin-top:12px;border:0;border-radius:10px;padding:12px 14px;background:#9DFF93;color:#0a0a0b;font-weight:700;cursor:pointer}.err{color:#fb7185;font-size:13px;margin-bottom:10px}</style></head><body><form class="box" method="post"><h1>Lucra ROI Calculator</h1><div class="sub">Enter the password to continue.</div>${error ? `<div class="err">${error}</div>` : ''}<input name="password" type="password" autocomplete="current-password" autofocus><button type="submit">Unlock</button></form></body></html>`;
}
module.exports = async function handler(req, res) {
  if (req.method === 'POST') {
    let body = '';
    for await (const chunk of req) body += chunk;
    const submitted = new URLSearchParams(body).get('password') || '';
    if (password() && submitted === password()) {
      res.setHeader('Set-Cookie', `${COOKIE}=${encodeURIComponent(token())}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${DAY * 14}`);
      res.statusCode = 303;
      res.setHeader('Location', '/');
      res.end();
      return;
    }
    res.statusCode = 401;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(loginHtml('Wrong password.'));
    return;
  }
  if (!authed(req)) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(loginHtml());
    return;
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8'));
};

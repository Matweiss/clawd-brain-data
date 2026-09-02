// The site password, enforced inside each function rather than only at the
// edge: the calculator, its APIs and the links dashboard ask for HTTP Basic
// credentials (SITE_USER, default "lucra", and SITE_PASSWORD). The customer
// sandbox (/play, /api/play compute) and the public scenario page are the
// only surfaces that do not: they have their own gates, a signed link and a
// passcode.
//
// Fail closed: with no SITE_PASSWORD configured, guarded routes answer 503.
// SITE_AUTH=off switches the check off for the dev server and tests only.

const { timingSafeEqual } = require('node:crypto');

function safeEqual(a, b) {
  const x = Buffer.from(String(a), 'utf8'), y = Buffer.from(String(b), 'utf8');
  return x.length === y.length && timingSafeEqual(x, y);
}

function disabled() { return process.env.SITE_AUTH === 'off'; }
function configured() { return !!process.env.SITE_PASSWORD; }

/* Parse a Basic header into { user, pass }, or null. */
function credentialsFrom(req) {
  const header = (req.headers && (req.headers.authorization || req.headers.Authorization)) || '';
  if (!/^Basic /i.test(header)) return null;
  let decoded = '';
  try { decoded = Buffer.from(header.slice(6).trim(), 'base64').toString('utf8'); } catch { return null; }
  const sep = decoded.indexOf(':');
  if (sep < 0) return null;
  return { user: decoded.slice(0, sep), pass: decoded.slice(sep + 1) };
}

function siteAuthOk(req) {
  if (disabled()) return true;
  if (!configured()) return false;
  const c = credentialsFrom(req);
  if (!c) return false;
  // Evaluate both so a wrong user costs the same as a wrong password.
  const okUser = safeEqual(c.user, process.env.SITE_USER || 'lucra');
  const okPass = safeEqual(c.pass, process.env.SITE_PASSWORD);
  return okUser && okPass;
}

/* Answer the request if it is not allowed in; return true when it is. */
function requireSiteAuth(req, res, opts) {
  const html = !!(opts && opts.html);
  if (disabled()) return true;
  res.setHeader('Cache-Control', 'no-store');
  if (!configured()) {
    if (html) { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.status(503).end('<!doctype html><title>Unavailable</title><p>Access password not configured.</p>'); }
    else res.status(503).json({ error: 'Access password not configured' });
    return false;
  }
  if (siteAuthOk(req)) return true;
  res.setHeader('WWW-Authenticate', 'Basic realm="Lucra ROI Calculator", charset="UTF-8"');
  if (html) { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.status(401).end('<!doctype html><title>Sign in</title><p>Authentication required.</p>'); }
  else res.status(401).json({ error: 'Authentication required' });
  return false;
}

module.exports = { requireSiteAuth, siteAuthOk, configured, disabled, credentialsFrom };

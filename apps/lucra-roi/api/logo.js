// Server-side logo fetch/proxy for brand images.
// Accepts either ?url=https://... for a direct image URL, or ?domain=example.com
// for resilient brand lookup. Returns a normalized image response so the browser
// can draw it to canvas without CORS/hotlinking failures.

const MAX_BYTES = 2 * 1024 * 1024;
const dns = require('dns').promises;
const net = require('net');
const MAX_REDIRECTS = 3;

// P0-5: Explicit origin allowlist instead of CORS wildcard.
const ALLOWED_ORIGINS = [
  'https://lucra-roi-calculator.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:8765',
  'http://127.0.0.1:8765',
];

function corsOrigin(req) {
  const origin = (req.headers && req.headers.origin) || '';
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  return '';
}

function setCorsHeaders(req, res) {
  const origin = corsOrigin(req);
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
}

function cleanDomain(v = '') {
  v = String(v || '').trim();
  if (!v) return '';
  try {
    if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
    return new URL(v).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return String(v).replace(/^https?:\/\//i, '').split('/')[0].replace(/^www\./i, '').toLowerCase();
  }
}
function safeUrl(v) {
  try {
    const u = new URL(String(v || '').trim());
    if (!['http:', 'https:'].includes(u.protocol)) return null;
    const host = u.hostname.toLowerCase();
    if (isBlockedHostname(host)) return null;
    return u.toString();
  } catch { return null; }
}

function isPrivateIp(address) {
  const ip = String(address || '').toLowerCase();
  if (net.isIPv4(ip)) {
    const p = ip.split('.').map(Number);
    return p[0] === 10 || p[0] === 127 || p[0] === 0 || (p[0] === 169 && p[1] === 254) ||
      (p[0] === 172 && p[1] >= 16 && p[1] <= 31) || (p[0] === 192 && p[1] === 168) ||
      (p[0] === 100 && p[1] >= 64 && p[1] <= 127) || p[0] >= 224;
  }
  if (net.isIPv6(ip)) {
    if (ip.startsWith('::ffff:')) return isPrivateIp(ip.slice(7));
    return ip === '::1' || ip === '::' || ip.startsWith('fc') || ip.startsWith('fd') ||
      ip.startsWith('fe8') || ip.startsWith('fe9') || ip.startsWith('fea') || ip.startsWith('feb') ||
      ip.startsWith('2001:db8:');
  }
  return true;
}

function isBlockedHostname(host) {
  host = String(host || '').replace(/^\[|\]$/g, '').toLowerCase();
  return !host || host === 'localhost' || host === 'metadata.google.internal' || host === '169.254.169.254' ||
    host.endsWith('.local') || host.endsWith('.internal') || (net.isIP(host) && isPrivateIp(host));
}

async function assertPublicUrl(value) {
  const u = new URL(value);
  if (!['http:', 'https:'].includes(u.protocol) || isBlockedHostname(u.hostname)) throw new Error('blocked destination');
  const addresses = await dns.lookup(u.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some((x) => isPrivateIp(x.address))) throw new Error('destination is not public');
  return u;
}

async function readLimitedBody(response) {
  if (!response.body || typeof response.body.getReader !== 'function') {
    const buf = Buffer.from(await response.arrayBuffer());
    if (buf.length > MAX_BYTES) throw new Error('too large');
    return buf;
  }
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    total += part.value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      throw new Error('too large');
    }
    chunks.push(Buffer.from(part.value));
  }
  return Buffer.concat(chunks);
}

async function fetchImage(url) {
  let current = await assertPublicUrl(url);
  let r;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    r = await fetch(current.toString(), {
    redirect: 'manual',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; LucraLogoBot/1.0)',
      'Accept': 'image/avif,image/webp,image/svg+xml,image/png,image/jpeg,image/*;q=0.8,*/*;q=0.5',
      'Referer': 'https://www.google.com/',
    },
    });
    if (![301, 302, 303, 307, 308].includes(r.status)) break;
    if (hop === MAX_REDIRECTS) throw new Error('too many redirects');
    const location = r.headers.get('location');
    if (!location) throw new Error('redirect missing location');
    current = await assertPublicUrl(new URL(location, current).toString());
  }
  if (!r.ok) throw new Error('fetch ' + r.status);
  const type = (r.headers.get('content-type') || '').split(';')[0].toLowerCase();
  if (!type.startsWith('image/')) throw new Error('not image: ' + type);
  const len = Number(r.headers.get('content-length') || 0);
  if (len > MAX_BYTES) throw new Error('too large');
  const buf = await readLimitedBody(r);
  return { buf, type };
}

module.exports = async (req, res) => {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  // Reject cross-origin requests from disallowed origins.
  // Same-origin requests omit the Origin header — those are allowed.
  const reqOrigin = (req.headers && req.headers.origin) || '';
  if (reqOrigin && !ALLOWED_ORIGINS.includes(reqOrigin)) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  const q = req.query || {};
  const direct = safeUrl(q.url);
  const domain = cleanDomain(q.domain || q.website || '');
  const candidates = [];
  if (direct) candidates.push(direct);
  if (domain) {
    candidates.push('https://img.logo.dev/' + encodeURIComponent(domain) + '?token=pk_X-1ZO13ERtW1t98760WLVA&retina=true');
    candidates.push('https://logo.clearbit.com/' + encodeURIComponent(domain) + '?size=256');
    candidates.push('https://www.google.com/s2/favicons?sz=256&domain=' + encodeURIComponent(domain));
    candidates.push('https://' + domain + '/favicon.ico');
  }
  if (!candidates.length) return res.status(400).json({ error: 'Provide url or domain' });

  const errors = [];
  for (const u of candidates) {
    try {
      const { buf, type } = await fetchImage(u);
      res.setHeader('Content-Type', type);
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
      res.setHeader('X-Lucra-Logo-Source', u.replace(/[\r\n]/g, ''));
      return res.status(200).send(buf);
    } catch (e) {
      errors.push(u + ': ' + ((e && e.message) || e));
    }
  }
  return res.status(404).json({ error: 'No logo found', tried: errors.slice(0, 4) });
};

module.exports._test = { isPrivateIp, isBlockedHostname };

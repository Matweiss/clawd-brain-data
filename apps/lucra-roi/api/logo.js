// Server-side logo fetch/proxy for brand images.
// Accepts either ?url=https://... for a direct image URL, or ?domain=example.com
// for resilient brand lookup. Returns a normalized image response so the browser
// can draw it to canvas without CORS/hotlinking failures.

const MAX_BYTES = 2 * 1024 * 1024;

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
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host.endsWith('.local')) return null;
    return u.toString();
  } catch { return null; }
}
async function fetchImage(url) {
  const r = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; LucraLogoBot/1.0)',
      'Accept': 'image/avif,image/webp,image/svg+xml,image/png,image/jpeg,image/*;q=0.8,*/*;q=0.5',
      'Referer': 'https://www.google.com/',
    },
  });
  if (!r.ok) throw new Error('fetch ' + r.status);
  const type = (r.headers.get('content-type') || '').split(';')[0].toLowerCase();
  if (!type.startsWith('image/')) throw new Error('not image: ' + type);
  const len = Number(r.headers.get('content-length') || 0);
  if (len > MAX_BYTES) throw new Error('too large');
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length > MAX_BYTES) throw new Error('too large');
  return { buf, type };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

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

// Shareable deal links for the Revenue Model tab.
//
// POST { deal }  -> { ok, url, expiresInDays }   an opaque, expiring link that
//                                                 restores the deal into the calculator
// GET  ?deal=tok -> { ok, deal }                 the state behind a link
//
// The token is the same AES-256-GCM scenario token the customer page uses, so
// nothing about the deal is readable from the URL. Links expire after 14 days:
// a stale link stops working rather than opening an old configuration as if it
// were current. Everything here sits behind the site's authentication, so a
// link only opens for someone who can already open the calculator.

const { createScenarioToken, parseScenarioToken } = require('../lib/scenario-token');
const { requireSiteAuth } = require('../lib/site-auth');

const TTL_DAYS = 14;
const MAX_BODY_BYTES = 48 * 1024;

function allowedOrigin(req) {
  const origin = (req.headers && req.headers.origin) || '';
  const host = (req.headers && (req.headers['x-forwarded-host'] || req.headers.host)) || '';
  if (!origin) return true;
  try { return new URL(origin).host === host; } catch { return false; }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!requireSiteAuth(req, res)) return;
  if (!process.env.SCENARIO_SECRET) return res.status(503).json({ error: 'Deal links are not configured' });

  if (req.method === 'GET') {
    try {
      const parsed = parseScenarioToken(req.query && req.query.deal, process.env.SCENARIO_SECRET);
      if (!parsed.data || parsed.data.kind !== 'revenue-model') return res.status(400).json({ error: 'Not a deal link' });
      return res.status(200).json({ ok: true, deal: parsed.data });
    } catch (error) {
      return res.status(400).json({ error: String(error && error.message || error) });
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'GET or POST only' });
  if (!allowedOrigin(req)) return res.status(403).json({ error: 'Origin not allowed' });
  const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) return res.status(413).json({ error: 'Deal is too large to share' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const deal = body.deal;
    if (!deal || typeof deal !== 'object' || Array.isArray(deal) || !deal.tp) return res.status(400).json({ error: 'Deal payload required' });
    const payload = { kind: 'revenue-model', tp: deal.tp, mg: deal.mg || {}, savedAt: new Date().toISOString() };
    const token = createScenarioToken(payload, process.env.SCENARIO_SECRET, { ttlSeconds: TTL_DAYS * 24 * 60 * 60 });
    const proto = (req.headers && req.headers['x-forwarded-proto']) || 'https';
    const host = (req.headers && (req.headers['x-forwarded-host'] || req.headers.host));
    return res.status(200).json({ ok: true, url: `${proto}://${host}/?deal=${encodeURIComponent(token)}`, expiresInDays: TTL_DAYS });
  } catch (error) {
    return res.status(400).json({ error: String(error && error.message || error) });
  }
};

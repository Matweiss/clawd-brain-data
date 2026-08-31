const { createScenarioToken } = require('../lib/scenario-token');

const MAX_BODY_BYTES = 48 * 1024;

function allowedOrigin(req) {
  const origin = (req.headers && req.headers.origin) || '';
  const host = (req.headers && (req.headers['x-forwarded-host'] || req.headers.host)) || '';
  if (!origin) return true;
  try { return new URL(origin).host === host; } catch { return false; }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!allowedOrigin(req)) return res.status(403).json({ error: 'Origin not allowed' });
  const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) return res.status(413).json({ error: 'Scenario is too large' });
  if (!process.env.SCENARIO_SECRET) return res.status(503).json({ error: 'Secure scenario sharing is not configured' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const scenario = body.scenario;
    if (!scenario || typeof scenario !== 'object' || Array.isArray(scenario)) return res.status(400).json({ error: 'Scenario payload required' });
    const token = createScenarioToken(scenario, process.env.SCENARIO_SECRET, { ttlSeconds: body.ttlSeconds });
    const proto = (req.headers && req.headers['x-forwarded-proto']) || 'https';
    const host = (req.headers && (req.headers['x-forwarded-host'] || req.headers.host));
    return res.status(200).json({ ok: true, url: `${proto}://${host}/public?scenario=${encodeURIComponent(token)}`, expiresInDays: 7 });
  } catch (error) {
    return res.status(400).json({ error: String(error && error.message || error) });
  }
};

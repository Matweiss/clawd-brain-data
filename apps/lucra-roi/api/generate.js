// Agreement generator (serverless) — shared by all proposal tabs.
// Copies a tokenized template Doc, fills the tokens, exports PDF + DOCX,
// drops the filled Doc in the Drive folder, returns the editable link + files.
//
// Body: { template: 'trackman'|'core'|'minigames', tokens: {"<literal token>": "<value>", ...}, clientName }
// Templates are allowlisted server-side so the public endpoint can't be pointed at arbitrary docs.
//
// Auth: mat.weiss@lucrasports.com OAuth (refresh token) — env vars in Vercel:
//   GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN / AGREEMENT_FOLDER_ID

const ALLOWED_TEMPLATES = {
  trackman: '1bq7dy1Feb2VHZo7TvQJGYoWVrRh2_ViXCI1gvU__nJ4',
  // Gamification Core/Mini Games use Mat's current tokenized agreement template.
  core: '1MAWYiinRZ_bLCrGcfEzU8wxJbzenDe4KmI_DiNhJo_I',
  minigames: '1MAWYiinRZ_bLCrGcfEzU8wxJbzenDe4KmI_DiNhJo_I',
};
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

async function getAccessToken(env) {
  const body = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    refresh_token: env.GOOGLE_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  });
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body });
  const j = await r.json();
  if (!j.access_token) throw new Error('Token exchange failed: ' + JSON.stringify(j));
  return j.access_token;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const env = process.env;
  for (const k of ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN', 'AGREEMENT_FOLDER_ID']) {
    if (!env[k]) return res.status(500).json({ error: 'Missing env: ' + k });
  }

  try {
    const d = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const templateId = ALLOWED_TEMPLATES[d.template];
    if (!templateId) return res.status(400).json({ error: 'Unknown template: ' + d.template });
    const tokens = d.tokens && typeof d.tokens === 'object' ? d.tokens : {};
    if (!Object.keys(tokens).length) return res.status(400).json({ error: 'No tokens provided' });
    const clientName = (d.clientName || 'Client').toString();

    const token = await getAccessToken(env);
    const H = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };

    // 1. Copy template into the output folder
    const name = 'Lucra Agreement — ' + clientName + ' — ' + new Date().toISOString().slice(0, 10);
    const copy = await (await fetch(
      `https://www.googleapis.com/drive/v3/files/${templateId}/copy?fields=id,webViewLink`,
      { method: 'POST', headers: H, body: JSON.stringify({ name, parents: [env.AGREEMENT_FOLDER_ID] }) }
    )).json();
    if (!copy.id) throw new Error('Copy failed: ' + JSON.stringify(copy));
    const docId = copy.id;

    // 2. Fill tokens (each key is the literal token string in the doc)
    const requests = Object.keys(tokens).map((k) => ({
      replaceAllText: { containsText: { text: k, matchCase: true }, replaceText: String(tokens[k] == null ? '' : tokens[k]) },
    }));
    const bu = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: 'POST', headers: H, body: JSON.stringify({ requests }),
    });
    if (!bu.ok) throw new Error('Fill failed: ' + (await bu.text()).slice(0, 200));

    // 3. Export PDF + DOCX
    async function exportAs(mime) {
      const r = await fetch(`https://www.googleapis.com/drive/v3/files/${docId}/export?mimeType=${encodeURIComponent(mime)}`,
        { headers: { Authorization: 'Bearer ' + token } });
      if (!r.ok) throw new Error('Export failed (' + mime + '): ' + r.status);
      return Buffer.from(await r.arrayBuffer()).toString('base64');
    }
    const [pdf, docx] = await Promise.all([exportAs('application/pdf'), exportAs(DOCX_MIME)]);

    return res.status(200).json({ ok: true, name, docUrl: copy.webViewLink, docId, pdf, docx });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};

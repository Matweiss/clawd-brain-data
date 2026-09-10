// Agreement generator (serverless) — shared by all proposal tabs.
// Copies a tokenized template Doc, fills the tokens, exports PDF + DOCX,
// drops the filled Doc in the Drive folder, returns the viewer link + files.
//
// Body: { template: 'trackman'|'core'|'minigames'|'recapture', tokens: {"<literal token>": "<value>", ...}, clientName }
// Templates are allowlisted server-side so the public endpoint can't be pointed at arbitrary docs.
//
// Auth: mat.weiss@lucrasports.com OAuth (refresh token) — env vars in Vercel:
//   GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN / AGREEMENT_FOLDER_ID
const { requireSiteAuth } = require('../lib/site-auth');

const ALLOWED_TEMPLATES = {
  trackman: '1bq7dy1Feb2VHZo7TvQJGYoWVrRh2_ViXCI1gvU__nJ4',
  // Gamification Core/Mini Games use Mat's current tokenized agreement template.
  core: '1MAWYiinRZ_bLCrGcfEzU8wxJbzenDe4KmI_DiNhJo_I',
  minigames: '1MAWYiinRZ_bLCrGcfEzU8wxJbzenDe4KmI_DiNhJo_I',
  recapture: '1JT6tqitfhffRSSHRXW-VQy0HBejlSsooieKKWhm74ZA',
};
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const MAX_BODY_BYTES = 64 * 1024; // 64KB

// Strict per-template token-key allowlists.
// Only these exact keys are accepted — anything else returns 400 with no Google API call.
// Trackman uses bracket tokens from TMagreement(); core/minigames use {{...}} from GMgenerate().
const ALLOWED_TOKEN_KEYS = {
  trackman: new Set([
    '[CLIENT NAME]', '[EFFECTIVE DATE]', '[PACKAGE NAME]', '[LIST PRICE AMOUNT]',
    '[MONTHLY PER BAY FEE]', '[NUMBER OF BAYS]', '[TOTAL MONTHLY FEE]',
    '[IMPLEMENTATION FEE AMOUNT]', '[CLIENT REVENUE SHARE %]', '[LUCRA REVENUE SHARE %]',
    '[LICENSE TERM YEARS]', '[GO-LIVE DATE]', '[CLIENT SIGNATURE NAME]',
    '[CHK_A]', '[CHK_B]', '[CHK_C]', '[CHK_D]', '[CHK_E]', '[CHK_IMPL]',
  ]),
  core: new Set([
    '{{CLIENT_NAME}}', '{{EFFECTIVE_DATE}}', '{{LICENSE_FEE}}', '{{DISCOUNT_PERCENTAGE}}',
    '{{AMOUNT_DUE}}', '{{CLIENT_REVENUE_SHARE}}', '{{LUCRA_REVENUE_SHARE}}',
    '{{LICENSE_TERM}}', '{{KICKOFF_DATE}}', '{{DELIVERY_DATE}}', '{{TARGET_DELIVERY_DATE}}',
    '{{DELIVERY_COST_REDUCTION_PERCENTAGE}}',
    '{{CHK_A}}', '{{CHK_B}}', '{{CHK_C}}', '{{CHK_D}}', '{{CHK_E}}', '{{CHK_F}}',
    '{{CHK_G}}', '{{CHK_H}}', '{{CHK_I}}',
    '{{A_monthly}}', '{{B_monthly}}', '{{C_monthly}}', '{{D_monthly_}}',
    '{{E_monthly}}', '{{F_monthly}}',
    '{{strat_imp_price}}', '{{growth_imp_price}}', '{{launch_imp_price}}',
    '{{Implementation_name}}', '{{NOTES}}',
  ]),
  recapture: new Set([
    '{{CLIENT_LEGAL_NAME}}', '{{EFFECTIVE_DATE}}',
    '{{CHK_A}}', '{{A_MONTHLY}}', '{{CHK_B}}', '{{B_MONTHLY}}',
    '{{CHK_C}}', '{{C_MONTHLY}}', '{{CHK_D}}', '{{D_MONTHLY}}',
    '{{CHK_E}}', '{{E_MONTHLY}}', '{{CHK_F}}', '{{F_MONTHLY}}',
    '{{CHK_G}}', '{{STRATEGIC_FEE}}', '{{CHK_H}}', '{{GROWTH_FEE}}',
    '{{CHK_I}}', '{{LAUNCH_FEE}}',
    '{{YEAR_1_LICENSE_FEE}}', '{{IMPLEMENTATION_PACKAGE}}', '{{YEAR_1_NOTES}}', '{{YEAR_1_MINIMUM_DUE}}',
    '{{YEAR_2_LICENSE_FEE}}', '{{YEAR_2_NOTES}}', '{{YEAR_2_MINIMUM_DUE}}',
    '{{YEAR_3_LICENSE_FEE}}', '{{YEAR_3_NOTES}}', '{{YEAR_3_MINIMUM_DUE}}',
    '{{LICENSE_TERM}}', '{{DELIVERY_DATE}}', '{{TOTAL_LICENSE_COMMITMENT}}',
    '{{CLIENT_RECAP_PCT}}', '{{LUCRA_RECAP_PCT}}', '{{LICENSE_PCT}}',
    '{{CLIENT_POST_PCT}}', '{{LUCRA_POST_PCT}}', '{{RENEWAL_ESCALATOR_PCT}}',
    '{{KICKOFF_DATE}}', '{{GTM_DOLLARS}}',
  ]),
};
// minigames shares the same template & token set as core.
ALLOWED_TOKEN_KEYS.minigames = ALLOWED_TOKEN_KEYS.core;

// Defense-in-depth: in-memory rate limiter (per serverless instance).
// On Vercel each cold-start gets a fresh Map, so this only limits burst
// abuse within a single warm instance. It is NOT enforceable across
// distributed instances and does NOT fully resolve P0-7.
// Production enforcement requires a Vercel Firewall rate-limit rule
// configured externally before go-live.
const RATE_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_GENERATE = 10; // max requests per window per IP
const _rateMap = new Map();

function checkRateLimit(req) {
  const ip = (req.headers && (req.headers['x-forwarded-for'] || req.headers['x-real-ip'])) || 'unknown';
  const key = ip.split(',')[0].trim();
  const now = Date.now();
  let entry = _rateMap.get(key);
  if (!entry || now - entry.start > RATE_WINDOW_MS) {
    entry = { start: now, count: 0 };
    _rateMap.set(key, entry);
  }
  entry.count++;
  // Evict old entries to prevent memory leak in long-lived instances
  if (_rateMap.size > 1000) {
    for (const [k, v] of _rateMap) {
      if (now - v.start > RATE_WINDOW_MS) _rateMap.delete(k);
    }
  }
  return entry.count <= RATE_LIMIT_GENERATE;
}

// P0-1: Explicit origin allowlist instead of CORS wildcard.
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
  // Same-origin requests (e.g. from the Vercel-served app) may not send Origin.
  // In that case, allow the request but don't reflect an origin.
  return '';
}

function setCorsHeaders(req, res) {
  const origin = corsOrigin(req);
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// P0-8: Sanitize clientName for filename — alphanumeric, spaces, dashes only, max 80 chars.
function sanitizeName(raw) {
  return String(raw || 'Client')
    .replace(/[^a-zA-Z0-9 \-]/g, '')
    .trim()
    .slice(0, 80) || 'Client';
}

function normalizeAnnualSchedule(raw, template) {
  if (raw == null) return [];
  if (!['core', 'minigames'].includes(template)) throw new Error('Annual schedule is only supported for standard package agreements');
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 3) throw new Error('Annual schedule must contain 1 to 3 years');
  return raw.map((item, index) => {
    const year = Number(item && item.year);
    const licenseFee = Number(item && item.licenseFee);
    const amountDue = Number(item && item.amountDue);
    const discountMode = item && item.discountMode === 'flat' ? 'flat' : 'pct';
    const discountValue = Number(item && item.discountValue);
    if (year !== index + 1) throw new Error('Annual schedule years must be consecutive');
    if (![licenseFee, amountDue, discountValue].every(Number.isFinite)) throw new Error(`Annual schedule Year ${year} contains an invalid amount`);
    if (licenseFee < 0 || amountDue < 0 || discountValue < 0 || licenseFee > 100000000 || amountDue > 100000000) throw new Error(`Annual schedule Year ${year} is outside the supported range`);
    if (discountMode === 'pct' && discountValue > 100) throw new Error(`Annual schedule Year ${year} discount cannot exceed 100%`);
    if (discountMode === 'flat' && discountValue > licenseFee) throw new Error(`Annual schedule Year ${year} discount cannot exceed its license fee`);
    const expectedAmountDue = discountMode === 'flat'
      ? Math.max(0, licenseFee - discountValue)
      : Math.max(0, licenseFee * (1 - discountValue / 100));
    if (Math.abs(expectedAmountDue - amountDue) > 1) throw new Error(`Annual schedule Year ${year} totals do not reconcile`);
    return { year, licenseFee, amountDue, monthlyEquivalent: amountDue / 12, discountMode, discountValue };
  });
}

function cellText(cell) {
  return ((cell && cell.content) || []).map((block) => ((block.paragraph && block.paragraph.elements) || []).map((element) => (element.textRun && element.textRun.content) || '').join('')).join('').trim();
}

function findStandardFeeTable(doc) {
  const content = doc && doc.body && Array.isArray(doc.body.content) ? doc.body.content : [];
  for (const block of content) {
    const table = block.table;
    if (!table || !Array.isArray(table.tableRows) || !table.tableRows.length) continue;
    const header = (table.tableRows[0].tableCells || []).map(cellText);
    if (header.includes('License Fee') && header.includes('Discount') && header.includes('Amount Due')) return { startIndex: block.startIndex, table };
  }
  return null;
}

function moneyText(value) {
  const rounded = Math.round(Number(value) * 100) / 100;
  return rounded.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(rounded) ? 0 : 2, maximumFractionDigits: 2 });
}

function additionalYearTextRequests(table, schedule) {
  const requests = [];
  for (let index = 1; index < schedule.length; index++) {
    const row = table.tableRows[index + 1];
    if (!row || !Array.isArray(row.tableCells) || row.tableCells.length < 5) throw new Error(`Generated fee table is missing Year ${index + 1}`);
    const year = schedule[index];
    const discount = year.discountMode === 'flat' ? `USD ${moneyText(year.discountValue)}` : `${moneyText(year.discountValue)}%`;
    const values = [
      `USD ${moneyText(year.licenseFee)}/year`,
      discount,
      '—',
      `Monthly equivalent: USD ${moneyText(year.monthlyEquivalent)}/month`,
      `USD ${moneyText(year.amountDue)}/year ${year.year}`,
    ];
    row.tableCells.slice(0, 5).forEach((cell, column) => {
      const paragraph = (cell.content || []).find((block) => block.paragraph);
      if (!paragraph || typeof paragraph.startIndex !== 'number') throw new Error(`Generated fee table Year ${year.year} column ${column + 1} is not editable`);
      requests.push({ insertText: { location: { index: paragraph.startIndex }, text: values[column] } });
    });
  }
  return requests;
}

async function expandStandardFeeTable(docId, accessToken, schedule) {
  if (schedule.length < 2) return;
  const headers = { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' };
  const readDocument = async () => {
    const response = await fetch(`https://docs.googleapis.com/v1/documents/${docId}`, { headers: { Authorization: 'Bearer ' + accessToken } });
    if (!response.ok) throw new Error('Fee table read failed: ' + response.status);
    return response.json();
  };
  let doc = await readDocument();
  let match = findStandardFeeTable(doc);
  if (!match) throw new Error('Standard agreement fee table was not found');
  const insertRequests = [];
  for (let index = 1; index < schedule.length; index++) {
    insertRequests.push({
      insertTableRow: {
        tableCellLocation: { tableStartLocation: { index: match.startIndex }, rowIndex: 1, columnIndex: 0 },
        insertBelow: true,
      },
    });
  }
  const inserted = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, { method: 'POST', headers, body: JSON.stringify({ requests: insertRequests }) });
  if (!inserted.ok) throw new Error('Fee table expansion failed: ' + (await inserted.text()).slice(0, 200));
  doc = await readDocument();
  match = findStandardFeeTable(doc);
  if (!match) throw new Error('Expanded standard agreement fee table was not found');
  const textRequests = additionalYearTextRequests(match.table, schedule);
  const filled = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, { method: 'POST', headers, body: JSON.stringify({ requests: textRequests }) });
  if (!filled.ok) throw new Error('Fee schedule fill failed: ' + (await filled.text()).slice(0, 200));
}

// Customer review links are view-only. Editing remains limited to explicitly
// authorized Google accounts rather than anyone who receives the URL.
async function shareViewerByLink(docId, token) {
  const r = await fetch(
    `https://www.googleapis.com/drive/v3/files/${docId}/permissions?sendNotificationEmail=false&fields=id`,
    {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'anyone', role: 'reader', allowFileDiscovery: false }),
    }
  );
  if (!r.ok) throw new Error('Share failed: ' + (await r.text()).slice(0, 200));
}

// Recapture agreements are internal working documents. Both Lucra domains can
// edit the generated copy, while the document remains undiscoverable and is not
// shared publicly by link. Drive recommends creating permissions sequentially.
async function shareRecaptureWithLucraDomains(docId, token) {
  for (const domain of ['lucrasports.com', 'playlucra.com']) {
    const r = await fetch(
      `https://www.googleapis.com/drive/v3/files/${docId}/permissions?sendNotificationEmail=false&fields=id`,
      {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'domain', domain, role: 'writer', allowFileDiscovery: false }),
      }
    );
    if (!r.ok) throw new Error(`Share failed for ${domain}: ` + (await r.text()).slice(0, 200));
  }
}

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
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!requireSiteAuth(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  // Reject cross-origin requests from disallowed origins.
  // Same-origin requests omit the Origin header entirely — those are allowed.
  const reqOrigin = (req.headers && req.headers.origin) || '';
  if (reqOrigin && !ALLOWED_ORIGINS.includes(reqOrigin)) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  // Defense-in-depth rate limit (not distributed — see comment above)
  if (!checkRateLimit(req)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again in 60 seconds.' });
  }

  const env = process.env;
  for (const k of ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN', 'AGREEMENT_FOLDER_ID']) {
    if (!env[k]) return res.status(500).json({ error: 'Missing env: ' + k });
  }

  try {
    // P0-3: Enforce body size limit.
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
      return res.status(413).json({ error: 'Request body exceeds 64KB limit' });
    }

    const d = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const templateId = ALLOWED_TEMPLATES[d.template];
    if (!templateId) return res.status(400).json({ error: 'Unknown template: ' + d.template });
    let annualSchedule;
    try {
      annualSchedule = normalizeAnnualSchedule(d.annualSchedule, d.template);
    } catch (scheduleError) {
      return res.status(400).json({ error: scheduleError.message });
    }
    const tokens = d.tokens && typeof d.tokens === 'object' ? d.tokens : {};
    if (!Object.keys(tokens).length) return res.status(400).json({ error: 'No tokens provided' });

    const tokenKeys = Object.keys(tokens);
    if (tokenKeys.length > 100) return res.status(400).json({ error: 'Too many tokens' });

    // Strict token-key allowlist: reject unexpected keys before any Google API call.
    const allowed = ALLOWED_TOKEN_KEYS[d.template];
    if (allowed) {
      const unexpected = tokenKeys.filter((k) => !allowed.has(k));
      if (unexpected.length) {
        return res.status(400).json({ error: 'Unexpected token keys: ' + unexpected.slice(0, 5).join(', ') });
      }
    }

    const clientName = sanitizeName(d.clientName);

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

    // 1b. Preserve the existing customer-review sharing posture for current
    // templates. Recapture copies are editable only inside Lucra's two domains.
    if (d.template === 'recapture') await shareRecaptureWithLucraDomains(docId, token);
    else await shareViewerByLink(docId, token);

    // 2. Fill tokens (each key is the literal token string in the doc)
    const requests = tokenKeys.map((k) => ({
      replaceAllText: { containsText: { text: k, matchCase: true }, replaceText: String(tokens[k] == null ? '' : tokens[k]) },
    }));
    const bu = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: 'POST', headers: H, body: JSON.stringify({ requests }),
    });
    if (!bu.ok) throw new Error('Fill failed: ' + (await bu.text()).slice(0, 200));
    await expandStandardFeeTable(docId, token, annualSchedule);

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

module.exports._test = { normalizeAnnualSchedule, findStandardFeeTable, additionalYearTextRequests, moneyText };

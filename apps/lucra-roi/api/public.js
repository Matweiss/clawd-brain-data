const { parseScenarioToken } = require('../lib/scenario-token');

function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function money(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) : '—';
}

function renderScenario(s) {
  const title = esc(s.customer || 'Lucra ROI scenario');
  const generated = esc(s.generatedAt || new Date().toISOString());
  const model = esc(s.modelVersion || 'Lucra ROI model');
  const summary = Array.isArray(s.summary) ? s.summary.slice(0, 12) : [];
  const assumptions = Array.isArray(s.assumptions) ? s.assumptions.slice(0, 20) : [];
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${title} — Lucra ROI</title><style>
  :root{color-scheme:dark;--bg:#071a33;--panel:#0b2745;--line:#29455e;--text:#eff6fb;--muted:#a9bdcc;--green:#8ae91a;--red:#f87171}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.55 Inter,ui-sans-serif,system-ui,sans-serif}.wrap{max-width:1040px;margin:auto;padding:38px 22px 56px}header{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;padding-bottom:22px;border-bottom:1px solid var(--line)}.brand{color:var(--green);font-weight:850;letter-spacing:.08em}.eyebrow{margin-top:28px;color:var(--green);font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}h1{font-size:clamp(32px,6vw,58px);line-height:1;margin:8px 0 12px}.sub{color:var(--muted);max-width:70ch}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:26px 0}.card,.assumptions{border:1px solid var(--line);border-radius:12px;background:var(--panel)}.card{padding:16px}.card span{display:block;color:var(--muted);font-size:11px;text-transform:uppercase}.card strong{display:block;margin-top:7px;font:750 24px ui-monospace,monospace}.card strong.bad{color:var(--red)}.assumptions{padding:18px}.assumptions h2{margin:0 0 12px;font-size:20px}.row{display:flex;justify-content:space-between;gap:18px;padding:9px 0;border-top:1px solid var(--line)}.row span{color:var(--muted)}footer{margin-top:22px;color:var(--muted);font-size:12px}.stamp{font-size:11px;color:var(--muted);text-align:right}@media(max-width:720px){.grid{grid-template-columns:1fr 1fr}header{display:block}.stamp{text-align:left;margin-top:8px}}@media(max-width:440px){.grid{grid-template-columns:1fr}.wrap{padding:24px 14px}.card strong{font-size:21px}}
  </style></head><body><main class="wrap"><header><div><div class="brand">LUCRA · ROI SCENARIO</div><div class="eyebrow">Customer-ready estimate</div><h1>${title}</h1><div class="sub">A transparent scenario built from customer inputs and clearly labeled planning assumptions.</div></div><div class="stamp">${model}<br>${generated}</div></header><section class="grid">${summary.map((x) => `<div class="card"><span>${esc(x.label)}</span><strong class="${Number(x.value) < 0 ? 'bad' : ''}">${x.format === 'money' ? money(x.value) : esc(x.display == null ? x.value : x.display)}</strong>${x.note ? `<small class="sub">${esc(x.note)}</small>` : ''}</div>`).join('')}</section><section class="assumptions"><h2>Inputs and assumptions</h2>${assumptions.map((x) => `<div class="row"><span>${esc(x.label)}</span><strong>${esc(x.value)}</strong></div>`).join('')}</section><footer>Planning estimate only—not a guarantee, offer, or contract. Final commercial terms, product availability, compliance requirements, and wagering eligibility depend on the executed agreement, applicable jurisdiction, and Lucra approval.</footer></main></body></html>`;
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (req.method !== 'GET') return res.status(405).end('GET only');
  if (!process.env.SCENARIO_SECRET) return res.status(503).end('Scenario sharing is not configured.');
  try {
    const parsed = parseScenarioToken(req.query && req.query.scenario, process.env.SCENARIO_SECRET);
    return res.status(200).end(renderScenario(parsed.data));
  } catch (error) {
    return res.status(400).end(`<!doctype html><title>Scenario unavailable</title><p>${esc(error && error.message || 'Scenario unavailable')}</p>`);
  }
};

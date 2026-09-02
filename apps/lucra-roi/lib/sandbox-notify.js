// "A customer just opened their sandbox." Sent once per link, to the
// presenter named on the deal (or SANDBOX_NOTIFY_TO), through Resend's HTTP
// API. Without RESEND_API_KEY nothing is sent and nothing breaks.
//
// Resend's shared sender (onboarding@resend.dev) only delivers to the address
// the Resend account was opened with; a verified domain lifts that. Set
// SANDBOX_NOTIFY_FROM once a domain is verified.

function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }

function configured() { return !!process.env.RESEND_API_KEY; }

function recipient(link) {
  const to = (process.env.SANDBOX_NOTIFY_TO || link.presenterEmail || '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) ? to : '';
}

async function sendFirstOpen(link, opts) {
  if (!configured()) return { sent: false, reason: 'no RESEND_API_KEY' };
  const to = recipient(link);
  if (!to) return { sent: false, reason: 'no recipient' };
  const from = process.env.SANDBOX_NOTIFY_FROM || 'Lucra ROI <onboarding@resend.dev>';
  const when = new Date((opts && opts.at) || Date.now()).toUTCString();
  const name = link.dealName || 'A customer';
  const dashboard = (opts && opts.dashboardUrl) || '';
  const body = {
    from, to: [to],
    subject: `${name} opened their sandbox`,
    text: `${name} opened their Lucra revenue sandbox at ${when}.` + (link.pass ? ' They entered the passcode.' : '') + (dashboard ? `\n\nSee what they change: ${dashboard}` : ''),
    html: `<p><strong>${esc(name)}</strong> opened their Lucra revenue sandbox at ${esc(when)}.${link.pass ? ' They entered the passcode.' : ''}</p>` + (dashboard ? `<p><a href="${esc(dashboard)}">See what they change</a></p>` : ''),
  };
  const fetchFn = (opts && opts.fetch) || fetch;
  const r = await fetchFn('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    let detail = '';
    try { detail = (await r.json()).message || ''; } catch { /* ignore */ }
    return { sent: false, reason: 'Resend ' + r.status + (detail ? ': ' + detail : '') };
  }
  return { sent: true, to };
}

module.exports = { sendFirstOpen, configured, recipient };

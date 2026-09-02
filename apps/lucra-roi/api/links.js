// The sandbox links dashboard, seller side.
//
// GET  /links                          the page (no data in the HTML)
// POST /api/links { action:'list',   key }        -> { ok, links, store, notify }
// POST /api/links { action:'revoke', key, id }    -> { ok }
// POST /api/links { action:'reopen', key, id }    -> { ok }
// POST /api/links { action:'remove', key, id }    -> { ok }
//
// The calculator is reachable without a login, so the dashboard has its own
// key: SANDBOX_ADMIN_KEY, entered once per browser and kept in
// sessionStorage. Without the key set, the page says so and refuses everything.

const { timingSafeEqual } = require('node:crypto');
const { getStore, credentials } = require('../lib/sandbox-store');
const notify = require('../lib/sandbox-notify');

const MAX_BODY_BYTES = 8 * 1024;

function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function allowedOrigin(req) {
  const origin = (req.headers && req.headers.origin) || '';
  const host = (req.headers && (req.headers['x-forwarded-host'] || req.headers.host)) || '';
  if (!origin) return true;
  try { return new URL(origin).host === host; } catch { return false; }
}

function keyMatches(given) {
  const want = process.env.SANDBOX_ADMIN_KEY || '';
  if (!want || typeof given !== 'string') return false;
  const a = Buffer.from(given, 'utf8'), b = Buffer.from(want, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

/* What the dashboard shows of a link: the registry row plus a status. */
function view(link, now) {
  const status = link.revoked ? 'closed' : link.exp <= now ? 'expired' : 'open';
  return Object.assign({}, link, { status });
}

function page() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Lucra · sandbox links</title><style>
:root{color-scheme:dark;--bg:#0a0a0b;--surface:#141416;--surface2:#1e1e22;--border:#2a2a2e;--text:#f5f5f5;--text2:#a1a1aa;--text3:#71717a;--green:#8AE91A;--amber:#F59E0B;--red:#EF4444;--mono:ui-monospace,SFMono-Regular,Menlo,monospace}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:14px/1.5 'Hanken Grotesk',system-ui,sans-serif}
.wrap{max-width:1240px;margin:auto;padding:26px 20px 60px}
header{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;padding-bottom:14px;border-bottom:1px solid var(--border);flex-wrap:wrap}
h1{margin:0;font-size:22px}h1 small{display:block;font-size:12px;color:var(--text3);font-weight:400;margin-top:2px}
a{color:var(--green)}
.tools{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
button,input,select{font:inherit}
button{background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:8px;padding:7px 12px;cursor:pointer}
button.primary{background:var(--green);color:#0a0a0b;border-color:var(--green);font-weight:700}
button.danger{color:var(--red);border-color:rgba(239,68,68,.4)}
button:disabled{opacity:.5;cursor:default}
input[type=password],input[type=text]{background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:8px;padding:8px 10px;min-width:220px}
.gate{max-width:420px;margin:60px auto;padding:24px;border:1px solid var(--border);border-radius:12px;background:var(--surface)}
.gate p{color:var(--text2);margin:0 0 12px}
.err{color:var(--red);font-size:13px;margin-top:8px;min-height:18px}
.notice{margin:16px 0;padding:12px 14px;border:1px solid rgba(245,158,11,.4);background:rgba(245,158,11,.08);border-radius:10px;color:var(--text2);font-size:13px}
.notice code{font-family:var(--mono);color:var(--text)}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:18px 0}
.stat{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 14px}
.stat span{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.6px;color:var(--text3)}
.stat b{display:block;font-size:20px;margin-top:4px;font-family:var(--mono)}
.tablewrap{overflow-x:auto;border:1px solid var(--border);border-radius:12px;background:var(--surface)}
table{width:100%;border-collapse:collapse;font-size:13px;min-width:980px}
th,td{padding:9px 12px;border-top:1px solid var(--border);text-align:left;vertical-align:top}
thead th{border-top:0;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--text3);white-space:nowrap}
td.num{font-family:var(--mono);text-align:right;white-space:nowrap}
td .sub{display:block;color:var(--text3);font-size:11px;margin-top:2px}
.pill{display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.3px}
.pill.open{background:rgba(138,233,26,.14);color:var(--green)}
.pill.expired{background:rgba(161,161,170,.14);color:var(--text2)}
.pill.closed{background:rgba(239,68,68,.14);color:var(--red)}
.empty{padding:40px;text-align:center;color:var(--text3)}
details{margin-top:4px}summary{cursor:pointer;color:var(--text2);font-size:12px}
.scenario{margin:6px 0 0;padding:8px 10px;background:var(--surface2);border-radius:8px;font-family:var(--mono);font-size:11px;white-space:pre-wrap;color:var(--text2);max-width:520px}
.foot{margin-top:14px;color:var(--text3);font-size:12px}
</style></head><body><div class="wrap">
<header><h1>Sandbox links<small>Every customer sandbox you have created, and what they have done with it.</small></h1>
<div class="tools"><a href="/">Back to the calculator</a><button type="button" id="refresh" hidden>Refresh</button><button type="button" id="signout" hidden>Sign out</button></div></header>
<div id="gate" class="gate"><p>Enter the dashboard key to see your links.</p><input type="password" id="key" placeholder="Dashboard key" autocomplete="current-password"><div style="margin-top:10px"><button type="button" class="primary" id="enter">Open</button></div><div class="err" id="gate-err"></div></div>
<div id="main" hidden></div>
</div>
<script>
var $=function(id){return document.getElementById(id)}, KEY='', TIMER=null;
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function when(t){ if(!t) return '—'; var d=new Date(t); return d.toLocaleDateString(undefined,{month:'short',day:'numeric'})+' '+d.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'}); }
function ago(t){ if(!t) return ''; var s=Math.max(0,(Date.now()-t)/1000); if(s<60) return 'just now'; if(s<3600) return Math.round(s/60)+' min ago'; if(s<86400) return Math.round(s/3600)+' h ago'; return Math.round(s/86400)+' d ago'; }
function left(exp){ var s=(exp-Date.now())/1000; if(s<=0) return 'expired'; if(s<3600) return Math.ceil(s/60)+' min left'; if(s<86400) return Math.ceil(s/3600)+' h left'; return Math.ceil(s/86400)+' d left'; }
function money(n){ if(n==null) return '—'; var v=Math.round(Number(n)||0); return (v<0?'-$':'$')+Math.abs(v).toLocaleString(); }
function scenario(x){
  if(!x) return '';
  var lines=[];
  lines.push('Users per location: '+Number(x.mau||0).toLocaleString()+(x.miniMau?' · app MAU '+Number(x.miniMau).toLocaleString():''));
  if(x.locations&&x.locations.length) lines.push('Locations: '+x.locations.join(' → ')+(x.scheduleStated?' (months given)':''));
  ['core','mini'].forEach(function(k){ var p=x[k]; if(!p) return; var label=k==='core'?'Venue':'App';
    (p.tournaments||[]).forEach(function(t){ lines.push(label+' · '+t.name+': $'+t.entryPrice+' × '+t.eventsPerMonth+'/mo, '+(t.basis==='mau'?t.participantPct+'% of base':Number(t.participants||0).toLocaleString()+' players')+(t.prizeCost?', prize cost $'+Number(t.prizeCost).toLocaleString():'')+(t.scope==='network'?', one across all':'')); });
    if(p.h2h) lines.push(label+' head-to-head: '+p.h2h.engagement+'% engaged, '+p.h2h.playsPerUser+' plays × $'+p.h2h.spendPerPlay); });
  lines.push('Result: '+money(x.revenueYear)+' revenue / yr · they earn '+money(x.operatorYear)+' / yr'+(x.payoffMonth!=null?' · licence retired month '+(Math.round(x.payoffMonth*10)/10).toFixed(1):''));
  return lines.join('\\n');
}
function api(body){ body.key=KEY; return fetch('/api/links',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.json().then(function(j){ if(!r.ok) throw new Error(j.error||('HTTP '+r.status)); return j; })}); }
function render(d){
  var links=d.links||[], now=Date.now(), open=links.filter(function(l){return l.status==='open'}).length, opened=links.filter(function(l){return l.opens>0}).length;
  var h='';
  if(!d.store) h+='<div class="notice">No link registry is attached yet, so nothing is recorded. Attach a Redis database to the Vercel project (Storage → Marketplace → Upstash Redis) and links created after that will appear here.</div>';
  if(d.store&&!d.notify) h+='<div class="notice">First-open emails are off: set <code>RESEND_API_KEY</code> (and <code>SANDBOX_NOTIFY_TO</code> or a presenter email on each deal) to get one when a customer first opens their link.</div>';
  h+='<div class="stats"><div class="stat"><span>Links</span><b>'+links.length+'</b></div><div class="stat"><span>Open now</span><b>'+open+'</b></div><div class="stat"><span>Opened by a customer</span><b>'+opened+'</b></div><div class="stat"><span>Edits, all links</span><b>'+links.reduce(function(a,l){return a+(l.edits||0)},0)+'</b></div></div>';
  if(!links.length){ h+='<div class="tablewrap"><div class="empty">No sandbox links yet. Create one from the Revenue Model tab.</div></div>'; $('main').innerHTML=h; return; }
  h+='<div class="tablewrap"><table><thead><tr><th>Customer</th><th>Status</th><th>Created</th><th>Expires</th><th>Passcode</th><th>Opens</th><th>Edits</th><th>Last scenario</th><th></th></tr></thead><tbody>';
  links.forEach(function(l){
    h+='<tr><td><strong>'+esc(l.dealName||'Untitled deal')+'</strong><span class="sub">'+esc(l.presenter||'')+(l.customerType?' · '+esc(l.customerType):'')+(l.term?' · '+l.term+'-yr':'')+'</span></td>'+
      '<td><span class="pill '+l.status+'">'+l.status+'</span>'+(l.revokedAt?'<span class="sub">closed '+when(l.revokedAt)+'</span>':'')+'</td>'+
      '<td>'+when(l.createdAt)+'<span class="sub">'+ago(l.createdAt)+'</span></td>'+
      '<td>'+when(l.exp)+'<span class="sub">'+left(l.exp)+'</span></td>'+
      '<td>'+(l.pass?'yes':'no')+(l.badPass?'<span class="sub" style="color:var(--amber)">'+l.badPass+' wrong attempt'+(l.badPass===1?'':'s')+'</span>':'')+'</td>'+
      '<td class="num">'+(l.opens||0)+(l.opens?'<span class="sub">first '+when(l.firstOpen)+'<br>last '+ago(l.lastOpen)+'</span>':'<span class="sub">not yet</span>')+(l.notifiedAt?'<span class="sub">emailed you</span>':'')+'</td>'+
      '<td class="num">'+(l.edits||0)+(l.edits?'<span class="sub">last '+ago(l.lastEdit)+'</span>':'')+'</td>'+
      '<td>'+(l.lastInputs?'<details><summary>'+money(l.lastInputs.revenueYear)+' / yr · they earn '+money(l.lastInputs.operatorYear)+'</summary><pre class="scenario">'+esc(scenario(l.lastInputs))+'</pre></details>':'<span class="sub">nothing changed yet</span>')+'</td>'+
      '<td style="white-space:nowrap">'+(l.status==='open'?'<button type="button" class="danger" data-act="revoke" data-id="'+esc(l.id)+'">Close now</button>':l.status==='closed'&&l.exp>now?'<button type="button" data-act="reopen" data-id="'+esc(l.id)+'">Reopen</button>':'')+' <button type="button" data-act="remove" data-id="'+esc(l.id)+'" title="Remove from this list">Remove</button></td></tr>';
  });
  h+='</tbody></table></div><div class="foot">Closing a link stops it immediately, before its expiry. Removing only takes it off this list; a removed link that has not expired still opens. Records are kept for 90 days after a link expires.</div>';
  $('main').innerHTML=h;
}
function load(){
  return api({action:'list'}).then(function(d){ $('gate').hidden=true; $('main').hidden=false; $('refresh').hidden=false; $('signout').hidden=false; render(d); })
    .catch(function(e){ $('gate').hidden=false; $('main').hidden=true; $('gate-err').textContent=e.message; try{sessionStorage.removeItem('sbx-key')}catch(x){} });
}
$('enter').onclick=function(){ KEY=$('key').value; try{sessionStorage.setItem('sbx-key',KEY)}catch(x){} load(); };
$('key').addEventListener('keydown',function(e){ if(e.key==='Enter') $('enter').click(); });
$('refresh').onclick=load;
$('signout').onclick=function(){ KEY=''; try{sessionStorage.removeItem('sbx-key')}catch(x){} $('key').value=''; $('gate').hidden=false; $('main').hidden=true; $('refresh').hidden=true; $('signout').hidden=true; };
$('main').addEventListener('click',function(e){
  var b=e.target.closest('button[data-act]'); if(!b) return;
  if(b.dataset.act==='remove'&&!window.confirm('Remove this link from the list? It keeps working until it expires unless you close it first.')) return;
  b.disabled=true;
  api({action:b.dataset.act,id:b.dataset.id}).then(load).catch(function(err){ b.disabled=false; alert(err.message); });
});
try{ KEY=sessionStorage.getItem('sbx-key')||''; }catch(x){}
if(KEY) load(); else $('key').focus();
TIMER=setInterval(function(){ if(KEY&&!$('main').hidden) load(); },60000);
</script></body></html>`;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (!process.env.SANDBOX_ADMIN_KEY) {
      return res.status(503).end('<!doctype html><title>Sandbox links</title><style>body{font:15px system-ui;background:#0a0a0b;color:#f5f5f5;padding:40px}code{color:#8AE91A}</style><h1>Dashboard not configured</h1><p>Set <code>SANDBOX_ADMIN_KEY</code> on the Vercel project to open the sandbox links dashboard.</p>');
    }
    return res.status(200).end(page());
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'GET or POST only' });
  if (!allowedOrigin(req)) return res.status(403).json({ error: 'Origin not allowed' });
  const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) return res.status(413).json({ error: 'Request too large' });
  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); } catch { return res.status(400).json({ error: 'Bad JSON' }); }

  if (!process.env.SANDBOX_ADMIN_KEY) return res.status(503).json({ error: 'Dashboard not configured: set SANDBOX_ADMIN_KEY' });
  if (!keyMatches(body.key)) return res.status(401).json({ error: 'That key is not right' });

  const store = getStore();
  try {
    if (body.action === 'list') {
      const now = Date.now();
      const links = store.enabled ? (await store.list()).map((l) => view(l, now)) : [];
      return res.status(200).json({ ok: true, links, store: store.enabled, notify: notify.configured(), redis: !!credentials() });
    }
    const id = String(body.id || '');
    if (!/^[a-f0-9]{16}$/.test(id)) return res.status(400).json({ error: 'Link id required' });
    if (!store.enabled) return res.status(503).json({ error: 'No link registry attached' });
    if (body.action === 'revoke') return res.status(200).json({ ok: await store.revoke(id, true) });
    if (body.action === 'reopen') return res.status(200).json({ ok: await store.revoke(id, false) });
    if (body.action === 'remove') return res.status(200).json({ ok: await store.remove(id) });
  } catch (error) {
    return res.status(502).json({ error: 'Link registry: ' + String(error && error.message || error) });
  }
  return res.status(400).json({ error: 'Unknown action' });
};

module.exports._internals = { keyMatches, view };

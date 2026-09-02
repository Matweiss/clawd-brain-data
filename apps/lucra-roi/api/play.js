// The customer sandbox: a page a prospect can play with, on a link the seller
// controls.
//
// GET  /play?deal=tok                        the sandbox page (no deal data in the HTML)
// POST /api/play  { action:'link', deal:{tp,mg}, days, pass, unlock }
//                                             -> { ok, url, expiresInDays }   seller-side, same origin
// POST /api/play  { action:'compute', deal:tok, pass, inputs }
//                                             -> { ok, facts, outputs }        customer-side
//
// The deal travels in the same encrypted, expiring token the deal links use.
// The maths runs here, on the server, and only customer-safe figures go back:
// the split percentages, Lucra's share and the licence credit share never reach
// the customer's browser. The customer can change only their own facts, as a
// whitelist applied on top of the deal the seller built.

const { createScenarioToken, parseScenarioToken } = require('../lib/scenario-token');
const E = require('../lib/revenue-engine');

const MAX_BODY_BYTES = 64 * 1024;
const DAY = 24 * 60 * 60;
const ALLOWED_DAYS = [1, 7, 14];
const MAX_TOURNAMENTS = 8;

function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function allowedOrigin(req) {
  const origin = (req.headers && req.headers.origin) || '';
  const host = (req.headers && (req.headers['x-forwarded-host'] || req.headers.host)) || '';
  if (!origin) return true;
  try { return new URL(origin).host === host; } catch { return false; }
}

const MG_MAP = { eng: 'engagement', plays: 'playsPerUser', wager: 'spendPerPlay', rake: 'feeRate', rewardGames: 'rewardGames', win: 'winRate', redeem: 'redeemRate', rewardValue: 'valuePerRedemption' };

/* The deal as the seller left it, with the Mini Game tab's head-to-head numbers
   written onto the mini product so the token carries one source of truth. */
function sealDeal(tp, mg) {
  const s = E.TPstate(tp || {});
  if (mg && typeof mg === 'object') {
    Object.keys(MG_MAP).forEach((k) => { if (mg[k] !== undefined && Number.isFinite(Number(mg[k]))) s.mini.h2h[MG_MAP[k]] = Number(mg[k]); });
  }
  return s;
}

function num(v, lo, hi) { return E.TPnum(v, lo, hi); }

/* Customer edits, whitelisted. Anything not listed here stays as the seller
   set it: the licence, the term, the fees, the split, the take fee, what
   products are in scope. */
function applyInputs(base, inputs, unlock) {
  const s = E.TPstate(base);
  if (!inputs || typeof inputs !== 'object') return s;
  const single = E.TPsingleLocation(s);
  if (inputs.mau !== undefined) s.mau = num(inputs.mau, 0, 50000000);
  if (!single && Array.isArray(inputs.locations)) {
    s.locations = inputs.locations.slice(0, E.TP_MAX_YEARS).map((v) => Math.max(1, Math.round(num(v, 1, 500))));
    s.openings = [];
  }
  if (!single && Array.isArray(inputs.openings)) {
    s.openings = inputs.openings.slice(0, 40).map((o) => ({ month: Math.round(num(o && o.month, 1, E.TPterm(s) * 12)), add: Math.round(num(o && o.add, 0, 200)) }));
  }
  if (inputs.rampOn !== undefined) s.rampOn = !!inputs.rampOn;
  if (inputs.rampStartPct !== undefined) s.rampStartPct = num(inputs.rampStartPct, 0, 100);
  if (inputs.rampMonths !== undefined) s.rampMonths = Math.round(num(inputs.rampMonths, 1, 24));
  if (s.mini.on && inputs.miniMau !== undefined) {
    const v = num(inputs.miniMau, 0, 50000000);
    s.mini.mauMode = v > 0 ? 'entered' : 'derived'; s.mini.mau = v;
  }
  E.TP_PRODUCTS.forEach((k) => {
    const p = s[k], pin = inputs[k];
    if (!p.on || !pin || typeof pin !== 'object') return;
    if (Array.isArray(pin.tournaments)) {
      const existing = p.tournaments;
      const next = pin.tournaments.slice(0, MAX_TOURNAMENTS).map((t, i) => {
        const from = existing.find((x) => x.id === (t && t.id)) || (unlock.addTournaments ? existing[0] || E.TP_DEFAULT_TOURNAMENTS[0] : null);
        if (!from) return null;
        const c = Object.assign({}, from, { id: String((t && t.id) || from.id || ('c' + i)).slice(0, 40) });
        if (typeof t.name === 'string') c.name = t.name.slice(0, 60);
        if (t.entryPrice !== undefined) c.entryPrice = num(t.entryPrice, 0, 1000);
        if (t.eventsPerMonth !== undefined) c.eventsPerMonth = Math.round(num(t.eventsPerMonth, 0, 60));
        if (t.basis === 'count' || t.basis === 'mau') c.basis = t.basis;
        if (t.participants !== undefined) c.participants = num(t.participants, 0, 1000000);
        if (t.participantPct !== undefined) c.participantPct = num(t.participantPct, 0, 100);
        if (t.rebuys !== undefined) { c.rebuyMode = 'avg'; c.rebuys = num(t.rebuys, 0, 20); }
        if (t.prizeValue !== undefined) {
          const v = num(t.prizeValue, 0, 1000000);
          c.rewardFaceValue = v; c.cashPrizeAmount = v;
          if (c.isCash) c.customerCashCost = v;
        }
        if (t.prizeCost !== undefined && !c.isCash) c.customerCashCost = num(t.prizeCost, 0, 1000000);
        if (k === 'core' && !single && (t.scope === 'each' || t.scope === 'network')) c.scope = t.scope;
        return c;
      }).filter(Boolean);
      // With add/remove unlocked the list is theirs, even empty (the model then
      // says to add one). Locked, only the seller's tournaments can be edited.
      p.tournaments = unlock.addTournaments ? next : (next.length ? next : p.tournaments);
    }
    if (pin.h2h && typeof pin.h2h === 'object' && p.h2hOn) {
      if (pin.h2h.engagement !== undefined) p.h2h.engagement = num(pin.h2h.engagement, 0, 100);
      if (pin.h2h.playsPerUser !== undefined) p.h2h.playsPerUser = num(pin.h2h.playsPerUser, 0, 500);
      if (pin.h2h.spendPerPlay !== undefined) p.h2h.spendPerPlay = num(pin.h2h.spendPerPlay, 0, 1000);
      if (pin.h2h.reach !== undefined) p.h2h.reach = num(pin.h2h.reach, 0, 50000000);
    }
  });
  return E.TPstate(s);
}

function miniCfg(s) {
  const h = s.mini.h2h;
  return { engagement: h.engagement, playsPerUser: h.playsPerUser, spendPerPlay: h.spendPerPlay, feeRate: h.feeRate,
    rewardGames: h.rewardGames, winRate: h.winRate, redeemRate: h.redeemRate, valuePerRedemption: h.valuePerRedemption, tournament: s };
}

/* What the customer sees of their own deal: their facts, never the terms. */
function facts(s, meta) {
  const single = E.TPsingleLocation(s);
  const tour = (t, k) => ({
    id: t.id, name: t.name, entryPrice: num(t.entryPrice, 0), eventsPerMonth: num(t.eventsPerMonth, 0), basis: t.basis,
    participants: num(t.participants, 0), participantPct: num(t.participantPct, 0), rebuys: num(t.rebuys, 0),
    prizeValue: num(t.isCash ? t.cashPrizeAmount : t.rewardFaceValue, 0), prizeCost: num(t.isCash ? t.cashPrizeAmount : t.customerCashCost, 0), pool: !!t.isCash,
    scope: k === 'core' ? (t.scope === 'network' ? 'network' : 'each') : 'network',
  });
  const product = (k) => ({
    on: E.TPproductOn(s, k), tournamentsOn: E.TPtournamentsOn(s, k), h2hOn: E.TPh2hOn(s, k),
    tournaments: E.TPproductOn(s, k) ? s[k].tournaments.map((t) => tour(t, k)) : [],
    h2h: E.TPh2hOn(s, k) ? { engagement: num(s[k].h2h.engagement, 0), playsPerUser: num(s[k].h2h.playsPerUser, 0), spendPerPlay: num(s[k].h2h.spendPerPlay, 0), reach: num(s[k].h2h.reach, 0), mode: s[k].h2h.mode } : null,
  });
  return {
    dealName: s.dealName || '', presenter: s.presenter || '', presenterEmail: s.presenterEmail || '',
    customerType: s.customerType, single, term: E.TPterm(s),
    licenceWaived: !!s.freeLicense, licenceTotal: s.freeLicense ? 0 : E.TPfees(s).reduce((a, b) => a + b, 0), fees: s.freeLicense ? [] : E.TPfees(s),
    mau: num(s.mau, 0), miniMau: s.mini.mauMode === 'entered' ? num(s.mini.mau, 0) : 0, miniBaseMonth1: Math.round(E.TPminiBase(s, 1)),
    locations: E.TPlocations(s), schedule: E.TPschedule(s), scheduleStated: E.TPscheduleStated(s),
    rampOn: !!s.rampOn, rampStartPct: num(s.rampStartPct, 0, 100), rampMonths: num(s.rampMonths, 1),
    core: product('core'), mini: product('mini'),
    unlock: meta.unlock, expiresAt: meta.exp,
  };
}

/* Customer-safe outputs only. Nothing here lets a reader recover the split
   beyond what the one-pager already prints. */
function outputs(s) {
  const cfg = miniCfg(s), r = E.TPcalculate(s, cfg), term = E.TPterm(s);
  if (r.errors.length) return { errors: r.errors };
  const cases = E.TPCcases(cfg).map((c) => ({ key: c.key, label: c.label, note: c.note, revenueYear: c.result.annualRevenueGenerated, operatorYear: c.result.operatorNet * 12, payoffMonth: c.result.tournamentResult.payoffMonth }));
  const years = [];
  for (let y = 1; y <= term; y++) {
    const ms = r.months.filter((m) => m.year === y), sum = (k) => ms.reduce((a, m) => a + (m[k] || 0), 0), yr = (r.years || [])[y - 1] || {};
    years.push({ year: y, revenue: sum('splitBase'), entries: sum('handle'), fee: sum('h2hFee'), prize: sum('prizeCost'), operator: sum('toOperator'),
      licenceFee: r.free ? 0 : (yr.fee || 0), retired: r.free ? 0 : (yr.credited || 0), locations: ms.length ? ms[ms.length - 1].locationsOpen : 1 });
  }
  return {
    errors: [], term, free: r.free, payoffMonth: r.payoffMonth, balanceDue: r.balanceDue, licenceTotal: r.totalContract,
    // Where the retired licence came from. Your share never funds it, so licenceFromYou is zero by construction.
    recapturing: !!r.recapturing, licenceFromShare: r.licenceFunding.fromShare, licenceFromYou: r.licenceFunding.fromOperator,
    licenceFromSigning: r.licenceFunding.fromUpfront + r.licenceFunding.fromSponsors, trueUp: r.licenceFunding.trueUp,
    revenueYear: r.totalSplitBase / term, entriesYear: r.totalHandle / term, feeYear: r.totalH2HFee / term,
    prizeYear: r.totalPrizeCost / term, operatorYear: r.totalOperator / term, rewardValueYear: r.totalRewardValue / term,
    byProduct: { core: { revenueYear: r.byProduct.core.splitBase / term, on: r.byProduct.core.on }, mini: { revenueYear: r.byProduct.mini.splitBase / term, on: r.byProduct.mini.on } },
    months: r.months.map((m) => ({ month: m.month, revenue: m.splitBase, operator: m.toOperator, locationsOpen: m.locationsOpen })),
    cases, years,
  };
}

function page() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Lucra · your revenue model</title><style>
:root{color-scheme:dark;--bg:#071a33;--panel:#0b2745;--panel2:#0e2f52;--line:#29455e;--text:#eff6fb;--muted:#a9bdcc;--green:#8ae91a;--amber:#f5b849;--blue:#6fb1ff;--red:#f87171;--mono:ui-monospace,SFMono-Regular,Menlo,monospace}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 Inter,ui-sans-serif,system-ui,sans-serif}
.wrap{max-width:1180px;margin:auto;padding:28px 20px 60px}header{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;padding-bottom:18px;border-bottom:1px solid var(--line)}
.brand{color:var(--green);font-weight:850;letter-spacing:.08em;font-size:12px}h1{font-size:clamp(26px,4.5vw,40px);line-height:1.05;margin:6px 0 6px}.sub{color:var(--muted);max-width:72ch}.stamp{font-size:12px;color:var(--muted);text-align:right;white-space:nowrap}
.grid{display:grid;grid-template-columns:minmax(0,7fr) minmax(0,5fr);gap:18px;margin-top:22px}@media(max-width:900px){.grid{grid-template-columns:1fr}.stamp{text-align:left}header{display:block}}
.panel{border:1px solid var(--line);border-radius:12px;background:var(--panel);padding:16px}.panel h2{margin:0 0 4px;font-size:16px}.panel .hint{color:var(--muted);font-size:12px;margin-bottom:10px}
.tiles{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}.tile{border:1px solid var(--line);border-radius:10px;background:var(--panel2);padding:12px}.tile span{display:block;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.06em}.tile strong{display:block;margin-top:6px;font:750 22px var(--mono)}.tile strong.bad{color:var(--red)}.tile small{display:block;color:var(--muted);font-size:11px;margin-top:4px}
.f{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin:8px 0}label{display:block;font-size:12px;color:var(--muted)}label b{display:block;color:var(--text);font-weight:600;margin-bottom:4px;font-size:12px}
input,select{width:100%;background:#061527;border:1px solid var(--line);border-radius:8px;color:var(--text);padding:8px 10px;font:14px var(--mono)}input:focus{outline:2px solid var(--green);outline-offset:1px}
.tour{border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin:8px 0;background:var(--panel2)}.tour .head{display:flex;justify-content:space-between;gap:10px;align-items:center}.tour .head input{font:600 14px Inter,system-ui,sans-serif;max-width:60%}
button{background:var(--panel2);border:1px solid var(--line);color:var(--text);border-radius:8px;padding:8px 12px;font:600 13px Inter,system-ui,sans-serif;cursor:pointer}button.primary{background:var(--green);color:#0b1a06;border-color:var(--green)}button.ghost{color:var(--muted)}
table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:7px 8px;border-top:1px solid var(--line);text-align:right;font-family:var(--mono)}th:first-child,td:first-child{text-align:left;font-family:Inter,system-ui,sans-serif}thead th{color:var(--muted);font:600 11px Inter,system-ui,sans-serif;text-transform:uppercase;letter-spacing:.05em;border-top:0}
.cases{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0}.case{border:1px solid var(--line);border-radius:10px;padding:10px;background:var(--panel2)}.case.mid{border-color:var(--green)}.case span{display:block;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}.case strong{display:block;font:750 18px var(--mono);margin-top:4px}.case small{color:var(--muted);font-size:11px}
.err{border:1px solid var(--red);color:var(--red);border-radius:10px;padding:10px 12px;margin-bottom:10px;font-size:13px}.note{color:var(--muted);font-size:12px;margin-top:8px}.keep{border:1px solid rgba(138,233,26,.4);background:rgba(138,233,26,.08);border-radius:12px;padding:12px 14px;margin:14px 0 6px;display:flex;flex-direction:column;gap:4px}.keep strong{color:var(--green);font-size:15px}.keep span{color:var(--muted);font-size:13px}
.gate{max-width:420px;margin:60px auto;text-align:center}.gate input{text-align:center;font-size:18px;letter-spacing:.2em}
.sched{margin:6px 0}.sched .row{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end;margin:6px 0}.chip{display:inline-block;font-size:12px;padding:4px 8px;border:1px solid var(--line);border-radius:8px;margin:3px 4px 3px 0;color:var(--muted)}.chip.est{border-color:var(--amber)}
.bars{display:flex;align-items:flex-end;gap:2px;height:90px;margin:8px 0 2px}.bars i{flex:1;background:var(--green);border-radius:2px 2px 0 0;min-width:2px;opacity:.85}.bars i.neg{background:var(--red)}.axis{display:flex;justify-content:space-between;color:var(--muted);font-size:10px}
footer{margin-top:26px;color:var(--muted);font-size:12px;border-top:1px solid var(--line);padding-top:14px}
</style></head><body><main class="wrap" id="app"><div class="gate" id="gate"><div class="brand">LUCRA · REVENUE MODEL</div><h1>Your model</h1><p class="sub" style="margin:auto">Enter the passcode you were given to open it.</p><form onsubmit="return openIt(event)"><p><input id="pass" type="password" autocomplete="off" placeholder="Passcode"></p><p><button class="primary" type="submit">Open</button></p><div class="err" id="gate-err" hidden></div></form></div><div id="model" hidden></div></main>
<script>
var TOKEN = new URLSearchParams(location.search).get('deal') || '', PASS = '', FACTS = null, OUT = null, INPUTS = null, timer = null, needsPass = __NEEDS_PASS__;
function $(id){return document.getElementById(id)}
function money(n){return '$'+Math.round(Number(n)||0).toLocaleString()}
function num(n){return Math.round(Number(n)||0).toLocaleString()}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function openIt(ev){ if(ev)ev.preventDefault(); PASS=$('pass')?$('pass').value:''; load(); return false; }
async function post(body){ var r=await fetch('/api/play',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); var d=await r.json().catch(function(){return {}}); if(!r.ok) throw new Error(d.error||'Could not load the model'); return d; }
async function load(){
  try{ var d=await post({action:'compute',deal:TOKEN,pass:PASS,inputs:null}); FACTS=d.facts; OUT=d.outputs; INPUTS=inputsFromFacts(FACTS); $('gate').hidden=true; $('model').hidden=false; render(); }
  catch(e){ var g=$('gate-err'); g.hidden=false; g.textContent=e.message; if(!needsPass){ $('gate').querySelector('form').hidden=true; } }
}
function inputsFromFacts(f){
  var tp=function(k){ return f[k].tournaments.map(function(t){ return {id:t.id,name:t.name,entryPrice:t.entryPrice,eventsPerMonth:t.eventsPerMonth,basis:t.basis,participants:t.participants,participantPct:t.participantPct,rebuys:t.rebuys,prizeValue:t.prizeValue,prizeCost:t.prizeCost,pool:t.pool,scope:t.scope}; }); };
  return { mau:f.mau, miniMau:f.miniMau, locations:f.locations.slice(), openings:f.scheduleStated?f.schedule.map(function(o){return {month:o.month,add:o.add}}):null, rampOn:f.rampOn, rampStartPct:f.rampStartPct, rampMonths:f.rampMonths,
    core:{tournaments:tp('core'),h2h:f.core.h2h?Object.assign({},f.core.h2h):null}, mini:{tournaments:tp('mini'),h2h:f.mini.h2h?Object.assign({},f.mini.h2h):null} };
}
function schedule(){ clearTimeout(timer); timer=setTimeout(recompute,250); }
async function recompute(){
  try{ var body={action:'compute',deal:TOKEN,pass:PASS,inputs:INPUTS}; var d=await post(body); FACTS=d.facts; OUT=d.outputs; renderResults(); if(!FACTS.single) renderSchedule(); }
  catch(e){ var el=$('res-err'); if(el){el.hidden=false; el.textContent=e.message;} }
}
function set(path,v,isNum){ var parts=path.split('.'),o=INPUTS; for(var i=0;i<parts.length-1;i++){o=o[parts[i]]} o[parts[parts.length-1]]=isNum?Number(v):v; schedule(); }
function setT(k,i,key,v){ INPUTS[k].tournaments[i][key]=(key==='name'||key==='scope'||key==='basis')?v:Number(v); if(key==='basis'||key==='scope'){renderInputs()} schedule(); }
function addT(k){ var t=INPUTS[k].tournaments[0]||{entryPrice:5,eventsPerMonth:4,basis:'count',participants:50,participantPct:1,rebuys:0,prizeValue:100,prizeCost:100,pool:false,scope:'each'}; INPUTS[k].tournaments.push(Object.assign({},t,{id:'new'+Date.now(),name:'New tournament'})); renderInputs(); schedule(); }
function removeT(k,i){ INPUTS[k].tournaments.splice(i,1); renderInputs(); schedule(); }
function setLoc(i,v){ INPUTS.locations[i]=Math.max(1,Math.round(Number(v)||1)); INPUTS.openings=null; schedule(); }
function pinSchedule(){ INPUTS.openings=FACTS.schedule.map(function(o){return {month:o.month,add:o.add}}); renderSchedule(); schedule(); }
function clearSchedule(){ INPUTS.openings=null; INPUTS.locations=FACTS.locations.slice(); renderSchedule(); schedule(); }
function addOpening(){ if(!INPUTS.openings) pinSchedule(); var last=INPUTS.openings[INPUTS.openings.length-1]; INPUTS.openings.push({month:Math.min(FACTS.term*12,(last?last.month:1)+6),add:1}); renderSchedule(); schedule(); }
function setOpening(i,key,v){ INPUTS.openings[i][key]=Math.round(Number(v)||0); schedule(); }
function removeOpening(i){ INPUTS.openings.splice(i,1); renderSchedule(); schedule(); }
function reset(){ INPUTS=null; PASS=PASS; load(); }
function render(){
  var f=FACTS, exp=f.expiresAt?new Date(f.expiresAt):null;
  $('model').innerHTML='<header><div><div class="brand">LUCRA · REVENUE MODEL</div><h1>'+esc(f.dealName||'Your revenue model')+'</h1><div class="sub">Change your own numbers and watch the model move. The licence and the commercial terms are as proposed and cannot be changed here.</div></div><div class="stamp">'+(f.presenter?'Prepared by '+esc(f.presenter)+(f.presenterEmail?'<br>'+esc(f.presenterEmail):'')+'<br>':'')+(exp?'Link open until '+exp.toLocaleDateString():'')+'</div></header>'+
    '<div class="grid"><div><div class="panel" id="inputs"></div></div><div><div class="panel" id="results"></div></div></div>'+
    '<footer>Illustrative planning estimate built on the numbers above, not a guarantee, offer or contract. Revenue generated is the pool before any revenue share. Prize funding is carried by you out of your share. Reward redemptions are venue value, not revenue, and are not counted.</footer>';
  renderInputs(); renderResults();
}
function renderInputs(){
  var f=FACTS, I=INPUTS, h='';
  h+='<h2>Your numbers</h2><div class="hint">Everything here is yours to change. <button class="ghost" type="button" onclick="reset()">Back to the proposal</button></div>';
  h+='<div class="f"><label><b>'+(f.single?'Monthly active users on your app or site':'Users per location')+'</b><input type="number" min="0" step="100" value="'+I.mau+'" oninput="set(\\'mau\\',this.value,true)"></label>';
  if(f.mini.on&&!f.single) h+='<label><b>Users on your app or site</b><input type="number" min="0" step="100" placeholder="'+num(f.miniBaseMonth1)+' from your venues" value="'+(I.miniMau||'')+'" oninput="set(\\'miniMau\\',this.value,true)"><span>Leave blank to follow your venues as they open.</span></label>';
  h+='</div>';
  if(!f.single){
    h+='<h2 style="margin-top:14px">Locations</h2><div class="hint">How many locations are running at the end of each contract year, or the exact months they open.</div><div class="f">';
    for(var y=0;y<f.term;y++) h+='<label><b>Year '+(y+1)+'</b><input type="number" min="1" step="1" value="'+(I.locations[y]||1)+'" oninput="setLoc('+y+',this.value)"></label>';
    h+='</div><div id="sched"></div>';
  }
  h+='<div class="f"><label><b>Each location starts on a launch ramp</b><select onchange="set(\\'rampOn\\',this.value===\\'1\\',false)"><option value="0"'+(I.rampOn?'':' selected')+'>No, full volume from day one</option><option value="1"'+(I.rampOn?' selected':'')+'>Yes</option></select></label>'+
    (I.rampOn?'<label><b>Opening month, % of full volume</b><input type="number" min="0" max="100" step="5" value="'+I.rampStartPct+'" oninput="set(\\'rampStartPct\\',this.value,true)"></label><label><b>Months to full volume</b><input type="number" min="1" max="24" step="1" value="'+I.rampMonths+'" oninput="set(\\'rampMonths\\',this.value,true)"></label>':'')+'</div>';
  ['core','mini'].forEach(function(k){
    var p=f[k]; if(!p.on) return;
    var title=k==='core'?(f.single?'Your game':'In your venues'):'On your app or site';
    if(p.tournamentsOn){
      h+='<h2 style="margin-top:14px">Tournaments · '+title+'</h2><div class="hint">'+(k==='core'&&!f.single?'Each tournament runs at every location, or once across all of them.':'One tournament across your whole base.')+'</div>';
      I[k].tournaments.forEach(function(t,i){
        var byPct=t.basis==='mau';
        h+='<div class="tour"><div class="head"><input type="text" value="'+esc(t.name)+'" oninput="setT(\\''+k+'\\','+i+',\\'name\\',this.value)" aria-label="Tournament name">'+(f.unlock.addTournaments?'<button class="ghost" type="button" onclick="removeT(\\''+k+'\\','+i+')">Remove</button>':'')+'</div><div class="f">'+
          '<label><b>Entry price</b><input type="number" min="0" step="1" value="'+t.entryPrice+'" oninput="setT(\\''+k+'\\','+i+',\\'entryPrice\\',this.value)"></label>'+
          '<label><b>Times a month</b><input type="number" min="0" step="1" value="'+t.eventsPerMonth+'" oninput="setT(\\''+k+'\\','+i+',\\'eventsPerMonth\\',this.value)"></label>'+
          '<label><b>Participation</b><select onchange="setT(\\''+k+'\\','+i+',\\'basis\\',this.value)"><option value="count"'+(byPct?'':' selected')+'>A count per event</option><option value="mau"'+(byPct?' selected':'')+'>A share of users</option></select></label>'+
          (byPct?'<label><b>Participants, % of users</b><input type="number" min="0" step="0.25" value="'+t.participantPct+'" oninput="setT(\\''+k+'\\','+i+',\\'participantPct\\',this.value)"></label>'
                :'<label><b>Participants per event'+(k==='core'&&!f.single?', per location':'')+'</b><input type="number" min="0" step="5" value="'+t.participants+'" oninput="setT(\\''+k+'\\','+i+',\\'participants\\',this.value)"></label>')+
          '<label><b>Extra entries per participant</b><input type="number" min="0" step="0.25" value="'+t.rebuys+'" oninput="setT(\\''+k+'\\','+i+',\\'rebuys\\',this.value)"></label>'+
          '<label><b>'+(t.pool?'Prize pool':'Reward value to players')+'</b><input type="number" min="0" step="25" value="'+t.prizeValue+'" oninput="setT(\\''+k+'\\','+i+',\\'prizeValue\\',this.value)"></label>'+
          (t.pool?'':'<label><b>What the reward costs you</b><input type="number" min="0" step="25" value="'+t.prizeCost+'" oninput="setT(\\''+k+'\\','+i+',\\'prizeCost\\',this.value)"></label>')+
          (k==='core'&&!f.single?'<label><b>Where it runs</b><select onchange="setT(\\''+k+'\\','+i+',\\'scope\\',this.value)"><option value="each"'+(t.scope!=='network'?' selected':'')+'>At every location</option><option value="network"'+(t.scope==='network'?' selected':'')+'>One across all locations</option></select></label>':'')+
          '</div></div>';
      });
      if(f.unlock.addTournaments) h+='<button type="button" onclick="addT(\\''+k+'\\')">Add a tournament</button>';
    }
    if(p.h2hOn&&I[k].h2h){
      var hh=I[k].h2h;
      h+='<h2 style="margin-top:14px">Head-to-head · '+title+'</h2><div class="hint">Players challenging each other'+(k==='core'&&!f.single?', per location':'')+'.</div><div class="f">'+
        '<label><b>Players taking part, % of users</b><input type="number" min="0" max="100" step="0.5" value="'+hh.engagement+'" oninput="set(\\''+k+'.h2h.engagement\\',this.value,true)"></label>'+
        (hh.mode!=='rewards'?'<label><b>Paid matchups per player a month</b><input type="number" min="0" step="1" value="'+hh.playsPerUser+'" oninput="set(\\''+k+'.h2h.playsPerUser\\',this.value,true)"></label><label><b>Entry per matchup</b><input type="number" min="0" step="0.25" value="'+hh.spendPerPlay+'" oninput="set(\\''+k+'.h2h.spendPerPlay\\',this.value,true)"></label>':'')+
        '</div>';
    }
  });
  $('inputs').innerHTML=h;
  if(!f.single) renderSchedule();
}
function renderSchedule(){
  var el=$('sched'); if(!el) return; var f=FACTS, I=INPUTS, h='';
  if(I.openings){
    h+='<div class="hint">The months your locations open. Contract month 1 is the first month of the agreement.</div><div class="sched">';
    I.openings.forEach(function(o,i){ h+='<div class="row"><label><b>Contract month</b><input type="number" min="1" max="'+(f.term*12)+'" step="1" value="'+o.month+'" oninput="setOpening('+i+',\\'month\\',this.value)"></label><label><b>Locations opening</b><input type="number" min="0" step="1" value="'+o.add+'" oninput="setOpening('+i+',\\'add\\',this.value)"></label><button class="ghost" type="button" onclick="removeOpening('+i+')">Remove</button></div>'; });
    h+='</div><button type="button" onclick="addOpening()">Add an opening</button> <button class="ghost" type="button" onclick="clearSchedule()">Back to counts per year</button>';
  } else {
    h+='<div class="hint">Openings are spread evenly through each year until you set the exact months.</div><div>'+f.schedule.map(function(o){return '<span class="chip'+(o.source==='estimate'?' est':'')+'">'+(o.add===1?'1 location':o.add+' locations')+' · month '+o.month+(o.source==='estimate'?' · estimate':'')+'</span>'}).join('')+'</div><p><button type="button" onclick="pinSchedule()">Set the exact months</button></p>';
  }
  el.innerHTML=h;
}
function renderResults(){
  var o=OUT, f=FACTS, h='<h2>What the model says</h2><div class="hint">Updated as you type. Averages across the '+f.term+'-year term.</div><div class="err" id="res-err" hidden></div>';
  if(o.errors&&o.errors.length){ $('results').innerHTML=h+'<div class="err">'+o.errors.map(esc).join('<br>')+'</div>'; return; }
  var payoff = o.free ? 'No licence to retire' : o.payoffMonth!==null ? 'Month '+(Math.round(o.payoffMonth*10)/10).toFixed(1) : money(o.balanceDue)+' left at term end';
  h+='<div class="tiles"><div class="tile"><span>Revenue generated / yr</span><strong>'+money(o.revenueYear)+'</strong><small>'+(o.byProduct.core.on&&o.byProduct.mini.on?'Venues '+money(o.byProduct.core.revenueYear)+' · app '+money(o.byProduct.mini.revenueYear):'Before any revenue share')+'</small></div>'+
    '<div class="tile"><span>You earn / yr</span><strong class="'+(o.operatorYear<0?'bad':'')+'">'+money(o.operatorYear)+'</strong><small>After funding '+money(o.prizeYear)+' of prizes</small></div>'+
    '<div class="tile"><span>'+(o.free?'Licence':'Licence retired by activity')+'</span><strong>'+payoff+'</strong><small>'+(o.free?'Waived':money(o.licenceTotal)+' over the term')+'</small></div>'+
    '<div class="tile"><span>Your prize funding / yr</span><strong>'+money(o.prizeYear)+'</strong><small>'+(o.feeYear>0?'Entries '+money(o.entriesYear)+' · head-to-head '+money(o.feeYear)+' a year':'Carried out of your share')+'</small></div></div>';
  if(!o.free&&o.recapturing) h+='<div class="keep"><strong>The licence is retired out of the licence share alone. Your share is never diverted to it.</strong><span>Of the '+money(o.licenceFromShare+o.licenceFromYou+o.licenceFromSigning)+' retired over the term, '+money(o.licenceFromShare)+' came from the licence share'+(o.licenceFromSigning>0?', '+money(o.licenceFromSigning)+' from signing and sponsors':'')+' and '+money(o.licenceFromYou)+' from your share. Your share is yours from month one and steps up once the licence is cleared.'+(o.trueUp>0?' Any shortfall is settled separately at year end, never taken from your share.':'')+'</span></div>';
  h+='<div class="cases">'+o.cases.map(function(c){return '<div class="case'+(c.key==='expected'?' mid':'')+'"><span>'+esc(c.label)+'</span><strong>'+money(c.revenueYear)+'</strong><small>'+esc(c.note)+' · you earn '+money(c.operatorYear)+'</small></div>'}).join('')+'</div>';
  var max=Math.max.apply(null,o.months.map(function(m){return Math.abs(m.revenue)}).concat([1]));
  h+='<div class="hint">Revenue generated by month</div><div class="bars">'+o.months.map(function(m){return '<i style="height:'+Math.max(2,Math.round(m.revenue/max*88))+'px" title="Month '+m.month+': '+money(m.revenue)+(m.locationsOpen>1?' · '+m.locationsOpen+' locations':'')+'"></i>'}).join('')+'</div><div class="axis"><span>Month 1</span><span>Month '+o.months.length+'</span></div>';
  h+='<table><thead><tr><th>Year</th>'+(f.single?'':'<th>Locations</th>')+'<th>Revenue generated</th><th>You earn</th>'+(o.free?'':'<th>Licence retired</th>')+'</tr></thead><tbody>'+o.years.map(function(y){return '<tr><td>Year '+y.year+'</td>'+(f.single?'':'<td>'+y.locations+'</td>')+'<td>'+money(y.revenue)+'</td><td'+(y.operator<0?' style="color:var(--red)"':'')+'>'+money(y.operator)+'</td>'+(o.free?'':'<td>'+money(y.retired)+'</td>')+'</tr>'}).join('')+'</tbody></table>';
  if(o.rewardValueYear>0) h+='<div class="note">Reward games add about '+money(o.rewardValueYear)+' a year of value to your venue through redeemed visits. That is a benefit, not revenue, so it is kept out of every figure above.</div>';
  $('results').innerHTML=h;
}
if(!needsPass){ load(); } else { $('pass').focus(); }
</script></body></html>`;
}

function verify(token, pass) {
  const parsed = parseScenarioToken(token, process.env.SCENARIO_SECRET);
  const data = parsed.data || {};
  if (data.kind !== 'revenue-sandbox') throw new Error('Not a sandbox link');
  if (data.pass && String(pass || '') !== String(data.pass)) throw new Error('That passcode is not right');
  return { data, exp: parsed.exp };
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (!process.env.SCENARIO_SECRET) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(503).end('<!doctype html><title>Unavailable</title><p>The sandbox is not configured.</p>');
  }

  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    let needsPass = false;
    try { const parsed = parseScenarioToken(req.query && req.query.deal, process.env.SCENARIO_SECRET); needsPass = !!(parsed.data && parsed.data.pass); }
    catch (error) { return res.status(400).end(`<!doctype html><title>Link unavailable</title><style>body{font:15px system-ui;background:#071a33;color:#eff6fb;padding:40px}</style><h1>This link is no longer open</h1><p>${esc(error && error.message || 'Link unavailable')}. Ask the person who sent it for a new one.</p>`); }
    return res.status(200).end(page().replace('__NEEDS_PASS__', needsPass ? 'true' : 'false'));
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'GET or POST only' });
  const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) return res.status(413).json({ error: 'Request too large' });
  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); } catch { return res.status(400).json({ error: 'Bad JSON' }); }

  if (body.action === 'link') {
    if (!allowedOrigin(req)) return res.status(403).json({ error: 'Origin not allowed' });
    const deal = body.deal;
    if (!deal || typeof deal !== 'object' || !deal.tp) return res.status(400).json({ error: 'Deal payload required' });
    const days = ALLOWED_DAYS.indexOf(Number(body.days)) >= 0 ? Number(body.days) : 7;
    const pass = String(body.pass || '').trim().slice(0, 40);
    const unlock = { addTournaments: body.unlock ? !!body.unlock.addTournaments : true };
    try {
      const sealed = sealDeal(deal.tp, deal.mg);
      const errors = E.TPvalidate(sealed);
      if (errors.length) return res.status(400).json({ error: 'Fix the deal first: ' + errors[0] });
      const payload = { kind: 'revenue-sandbox', tp: sealed, pass: pass || '', unlock, savedAt: new Date().toISOString() };
      const token = createScenarioToken(payload, process.env.SCENARIO_SECRET, { ttlSeconds: days * DAY });
      const host = (req.headers && (req.headers['x-forwarded-host'] || req.headers.host)) || '';
      const proto = (req.headers && req.headers['x-forwarded-proto']) || (/^(127\.0\.0\.1|localhost)(:|$)/.test(host) ? 'http' : 'https');
      return res.status(200).json({ ok: true, url: `${proto}://${host}/play?deal=${encodeURIComponent(token)}`, expiresInDays: days, passcode: !!pass });
    } catch (error) {
      return res.status(400).json({ error: String(error && error.message || error) });
    }
  }

  if (body.action === 'compute') {
    try {
      const v = verify(body.deal, body.pass);
      const meta = { unlock: v.data.unlock || { addTournaments: true }, exp: v.exp };
      const s = applyInputs(v.data.tp, body.inputs, meta.unlock);
      return res.status(200).json({ ok: true, facts: facts(s, meta), outputs: outputs(s) });
    } catch (error) {
      return res.status(400).json({ error: String(error && error.message || error) });
    }
  }
  return res.status(400).json({ error: 'Unknown action' });
};

module.exports._internals = { applyInputs, facts, outputs, sealDeal };

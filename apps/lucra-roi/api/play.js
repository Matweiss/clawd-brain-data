// The customer sandbox: a page a prospect can play with, on a link the seller
// controls.
//
// GET  /play?deal=tok                        the sandbox page (no deal data in the HTML)
// POST /api/play  { action:'link', deal:{tp,mg}, days, pass, unlock }
//                                             -> { ok, url, expiresInDays }   seller-side, site password, same origin; passcode required
// POST /api/play  { action:'update', edit, deal:{tp,mg} }  seller-side, site password: save a new version to a link
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
const { getStore } = require('../lib/sandbox-store');
const notify = require('../lib/sandbox-notify');
const { requireSiteAuth } = require('../lib/site-auth');

const MIN_PASS = 4;

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

/* What the dashboard keeps of a customer's latest scenario: their facts and
   the headline figures, small enough to sit in one hash field. */
function scenarioSummary(f, o) {
  const tour = (t) => ({ name: t.name, entryPrice: t.entryPrice, eventsPerMonth: t.eventsPerMonth, basis: t.basis, participants: t.participants, participantPct: t.participantPct, prizeCost: t.prizeCost, scope: t.scope });
  const h2h = (h) => (h ? { engagement: h.engagement, playsPerUser: h.playsPerUser, spendPerPlay: h.spendPerPlay, reach: h.reach } : null);
  return {
    mau: f.mau, miniMau: f.miniMau, locations: f.locations, schedule: f.schedule, scheduleStated: f.scheduleStated, rampOn: f.rampOn,
    core: f.core.on ? { tournaments: f.core.tournaments.map(tour), h2h: h2h(f.core.h2h) } : null,
    mini: f.mini.on ? { tournaments: f.mini.tournaments.map(tour), h2h: h2h(f.mini.h2h) } : null,
    revenueYear: o.errors && o.errors.length ? null : o.revenueYear, operatorYear: o.errors && o.errors.length ? null : o.operatorYear,
    payoffMonth: o.errors && o.errors.length ? null : o.payoffMonth,
  };
}

/* Customer-safe outputs. The seller asked for the licence share and the
   operator's share to be printed as percentages on the customer page, so they
   are here by name; Lucra's own percentage and Lucra's earnings never are. */
function outputs(s) {
  const cfg = miniCfg(s), r = E.TPcalculate(s, cfg), term = E.TPterm(s);
  if (r.errors.length) return { errors: r.errors };
  const allCases = E.TPCcases(cfg), mid = allCases[1].result, hh = mid.h2h || {};
  const cases = allCases.map((c) => ({ key: c.key, label: c.label, note: c.note, revenueYear: c.result.annualRevenueGenerated, operatorYear: c.result.operatorNet * 12, payoffMonth: c.result.tournamentResult.payoffMonth }));
  const rates = E.TPsplitRates(s), pct = (x) => Math.round(x * 1000) / 10;
  const totals = E.TPyearTotals(r);
  const years = totals.map((y) => {
    const yr = (r.years || [])[y.year - 1] || {};
    return {
      year: y.year, months: y.months, locations: y.locationsOpen, participantsAvg: y.participantsAvg,
      revenue: y.splitBase, entries: y.handle, fee: y.h2hFee,
      toLicence: y.toLicense, licenceCumulative: y.cumulativeLicense,
      yourShare: y.operatorGross, prize: y.prizeCost, operator: y.toOperator,
      operatorCumulative: y.cumulative.toOperator, settle: y.trueUp + y.balanceDue, settleCumulative: y.cumulative.trueUp + y.balanceDue,
      operatorAfterSettle: y.cumulative.operatorAfterTrueUp, operatorYearAfterSettle: y.operatorAfterTrueUp,
      licenceFee: r.free ? 0 : y.fee, opening: r.free ? 0 : (yr.opening || 0), fromShare: r.free ? 0 : (yr.activity || 0), fromYou: 0,
      fromSigning: r.free ? 0 : ((yr.credited || 0) - (yr.activity || 0)), retired: r.free ? 0 : (yr.credited || 0),
      clearMonth: yr.clearMonth === undefined ? null : yr.clearMonth, closing: r.free ? 0 : (yr.closing || 0),
    };
  });
  let opCum = 0;
  const monthly = r.months.map((m) => {
    opCum += m.toOperator;
    return { month: m.month, year: m.year, monthInYear: m.monthInYear, participants: m.participants, entries: m.handle, fee: m.h2hFee, revenue: m.splitBase,
      toLicence: m.licenseFromShare, licenceCumulative: m.cumulativeLicense, yourShare: m.operatorGross, prize: m.prizeCost, operator: m.toOperator, operatorCumulative: opCum,
      locationsOpen: m.locationsOpen, phase: m.split };
  });
  const funding = r.licenceFunding;
  return {
    errors: [], term, free: r.free, payoffMonth: r.payoffMonth, balanceDue: r.balanceDue, licenceTotal: r.totalContract,
    contract: { total: r.totalContract, fees: r.free ? [] : E.TPfees(s).slice(0, term), annual: !!r.annualBasis, waived: r.free },
    // Where the retired licence came from. Your share never funds it, so licenceFromYou is zero by construction.
    recapturing: !!r.recapturing, licenceFromShare: funding.fromShare, licenceFromYou: funding.fromOperator,
    licenceFromSigning: funding.fromUpfront + funding.fromSponsors, trueUp: funding.trueUp,
    // The split as it applies to the customer: the licence share while the licence is being retired, their share then and after.
    rates: r.recapturing ? { licenceSharePct: pct(rates.credit), yourSharePct: pct(rates.operator), yourSharePostPct: pct(rates.postOperator) } : { licenceSharePct: 0, yourSharePct: pct(rates.postOperator), yourSharePostPct: pct(rates.postOperator) },
    revenueYear: r.totalSplitBase / term, entriesYear: r.totalHandle / term, feeYear: r.totalH2HFee / term,
    prizeYear: r.totalPrizeCost / term, operatorYear: r.totalOperator / term, rewardValueYear: r.totalRewardValue / term,
    byProduct: { core: { revenueYear: r.byProduct.core.splitBase / term, on: r.byProduct.core.on }, mini: { revenueYear: r.byProduct.mini.splitBase / term, on: r.byProduct.mini.on } },
    months: r.months.map((m) => ({ month: m.month, revenue: m.splitBase, operator: m.toOperator, locationsOpen: m.locationsOpen, licenceCumulative: m.cumulativeLicense })),
    monthly,
    operatorTotal: r.totalOperator, yourShareTotal: r.totalOperatorGross, revenueTotal: r.totalSplitBase, prizeTotal: r.totalPrizeCost, toLicenceTotal: funding.fromShare,
    settleTotal: r.trueUpTotal + r.balanceDue, operatorAfterSettleTotal: r.totalOperator - r.trueUpTotal - r.balanceDue,
    // The combined model's tiles, at the expected case.
    combined: {
      mau: mid.mau, includeH2H: !!mid.includeH2H, includeTournaments: !!mid.includeTournaments,
      reach: hh.reach || 0, engagement: hh.engagement || 0, engaged: hh.engaged || 0, paidVolume: hh.paidVolume || 0,
      rewardValue: mid.rewardValue || 0, rewardRedemptions: hh.rewardRedemptions || 0,
      tournamentParticipants: mid.tournamentParticipants || 0, tournamentShare: mid.tournamentShare || 0, combinedShare: mid.combinedShare || 0,
    },
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
table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:7px 8px;border-top:1px solid var(--line);text-align:right;font-family:var(--mono)}th:first-child,td:first-child{text-align:left;font-family:Inter,system-ui,sans-serif}thead th{color:var(--muted);font:600 11px Inter,system-ui,sans-serif;text-transform:uppercase;letter-spacing:.05em;border-top:0}tr.total td{font-weight:700;border-top:2px solid var(--green);background:rgba(138,233,26,.06)}
.cases{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0}.case{border:1px solid var(--line);border-radius:10px;padding:10px;background:var(--panel2)}.case.mid{border-color:var(--green)}.case span{display:block;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}.case strong{display:block;font:750 18px var(--mono);margin-top:4px}.case small{color:var(--muted);font-size:11px}
.err{border:1px solid var(--red);color:var(--red);border-radius:10px;padding:10px 12px;margin-bottom:10px;font-size:13px}.note{color:var(--muted);font-size:12px;margin-top:8px}.keep{border:1px solid rgba(138,233,26,.4);background:rgba(138,233,26,.08);border-radius:12px;padding:12px 14px;margin:14px 0 6px;display:flex;flex-direction:column;gap:4px}.keep strong{color:var(--green);font-size:15px}.keep span{color:var(--muted);font-size:13px}
.gate{max-width:420px;margin:60px auto;text-align:center}.gate input{text-align:center;font-size:18px;letter-spacing:.2em}
.sched{margin:6px 0}.sched .row{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end;margin:6px 0}.chip{display:inline-block;font-size:12px;padding:4px 8px;border:1px solid var(--line);border-radius:8px;margin:3px 4px 3px 0;color:var(--muted)}.chip.est{border-color:var(--amber)}
.full{margin-top:18px}.section{margin-top:18px}.section h3{margin:0 0 4px;font-size:14px}.section .hint{margin-bottom:8px}
.tablewrap{overflow-x:auto;border:1px solid var(--line);border-radius:10px;background:var(--panel2)}.tablewrap table{min-width:640px}.tablewrap th,.tablewrap td{white-space:nowrap}tr.sub td{background:rgba(255,255,255,.04);font-weight:600;border-top:1px solid var(--line)}td.neg{color:var(--red)}td.zero{color:var(--green)}
.keep .rows{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-top:6px}.keep .rows div{display:flex;flex-direction:column}.keep .rows span{font-size:11px}.keep .rows b{font:700 15px var(--mono);color:var(--text)}.keep .rows b.zero{color:var(--green)}.keep .rows b.neg{color:var(--red)}
.banner{border:1px solid var(--blue);background:rgba(111,177,255,.1);border-radius:10px;padding:10px 12px;margin:14px 0 0;font-size:13px;color:var(--text)}.banner b{color:var(--blue)}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin:8px 0}.stat{border:1px solid var(--line);border-radius:10px;background:var(--panel2);padding:10px}.stat span{display:block;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.05em}.stat strong{display:block;font:750 18px var(--mono);margin-top:4px}.stat small{display:block;color:var(--muted);font-size:11px;margin-top:2px}
.bars{display:flex;align-items:flex-end;gap:2px;height:90px;margin:8px 0 2px}.bars i{flex:1;background:var(--green);border-radius:2px 2px 0 0;min-width:2px;opacity:.85}.bars i.neg{background:var(--red)}.bars.pay i{background:var(--blue)}.bars.pay i.done{background:var(--green)}.bars.pay i.ys{border-left:1px solid var(--line)}.axis{display:flex;justify-content:space-between;color:var(--muted);font-size:10px}
footer{margin-top:26px;color:var(--muted);font-size:12px;border-top:1px solid var(--line);padding-top:14px}
</style></head><body><main class="wrap" id="app"><div class="gate" id="gate"><div class="brand">LUCRA · REVENUE MODEL</div><h1>Your model</h1><p class="sub" style="margin:auto">Enter the passcode you were given to open it.</p><form onsubmit="return openIt(event)"><p><input id="pass" type="password" autocomplete="off" placeholder="Passcode"></p><p><button class="primary" type="submit">Open</button></p><div class="err" id="gate-err" hidden></div></form></div><div id="model" hidden></div></main>
<script>
var TOKEN = new URLSearchParams(location.search).get('deal') || '', PASS = '', FACTS = null, OUT = null, INPUTS = null, timer = null, needsPass = __NEEDS_PASS__, VERSION = null, REBASED = false;
function $(id){return document.getElementById(id)}
function money(n){var v=Math.round(Number(n)||0);return (v<0?'-$':'$')+Math.abs(v).toLocaleString()}
function num(n){return Math.round(Number(n)||0).toLocaleString()}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function openIt(ev){ if(ev)ev.preventDefault(); PASS=$('pass')?$('pass').value:''; load(); return false; }
async function post(body){ var r=await fetch('/api/play',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); var d=await r.json().catch(function(){return {}}); if(!r.ok) throw new Error(d.error||'Could not load the model'); return d; }
async function load(){
  try{ var d=await post({action:'compute',deal:TOKEN,pass:PASS,inputs:null}); FACTS=d.facts; OUT=d.outputs; VERSION=FACTS.version||null; INPUTS=inputsFromFacts(FACTS); $('gate').hidden=true; $('model').hidden=false; render(); }
  catch(e){ var g=$('gate-err'); g.hidden=false; g.textContent=e.message; if(!needsPass){ $('gate').querySelector('form').hidden=true; } }
}
function inputsFromFacts(f){
  var tp=function(k){ return f[k].tournaments.map(function(t){ return {id:t.id,name:t.name,entryPrice:t.entryPrice,eventsPerMonth:t.eventsPerMonth,basis:t.basis,participants:t.participants,participantPct:t.participantPct,rebuys:t.rebuys,prizeValue:t.prizeValue,prizeCost:t.prizeCost,pool:t.pool,scope:t.scope}; }); };
  return { mau:f.mau, miniMau:f.miniMau, locations:f.locations.slice(), openings:f.scheduleStated?f.schedule.map(function(o){return {month:o.month,add:o.add}}):null, rampOn:f.rampOn, rampStartPct:f.rampStartPct, rampMonths:f.rampMonths,
    core:{tournaments:tp('core'),h2h:f.core.h2h?Object.assign({},f.core.h2h):null}, mini:{tournaments:tp('mini'),h2h:f.mini.h2h?Object.assign({},f.mini.h2h):null} };
}
function schedule(){ clearTimeout(timer); timer=setTimeout(recompute,250); }
async function recompute(){
  try{ var body={action:'compute',deal:TOKEN,pass:PASS,inputs:INPUTS,version:VERSION}; var d=await post(body); FACTS=d.facts; OUT=d.outputs;
    if(FACTS.rebased){ VERSION=FACTS.version; INPUTS=inputsFromFacts(FACTS); REBASED=true; render(); return; }
    renderResults(); if(!FACTS.single) renderSchedule(); }
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
    (f.updatedBy==='seller'&&(f.version||1)>1?'<div class="banner"><b>'+esc(f.presenter||'The person who sent this')+' updated this model</b> on '+new Date(f.updatedAt).toLocaleDateString()+(REBASED?'. Your view has been refreshed to their version; your earlier changes were replaced.':'. This is their latest version.')+'</div>':'')+
    '<div class="grid"><div><div class="panel" id="inputs"></div></div><div><div class="panel" id="results"></div></div></div>'+
    '<div class="panel full" id="term"></div>'+
    '<footer>Illustrative planning estimate built on the numbers above, not a guarantee, offer or contract. Revenue generated is the pool before any revenue share. Prize funding is carried by you out of your share. Reward redemptions are venue value, not revenue, and are not counted.</footer>';
  REBASED=false;
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
function pctS(v){ return (Math.round(v*10)/10)+'%'; }
function shareLabel(o){ var r=o.rates; return o.recapturing&&Math.abs(r.yourSharePostPct-r.yourSharePct)>0.05 ? pctS(r.yourSharePct)+' then '+pctS(r.yourSharePostPct) : pctS(r.yourSharePct); }
function renderResults(){
  var o=OUT, f=FACTS, h='<h2>What the model says</h2><div class="hint">Updated as you type. Averages across the '+f.term+'-year term.</div><div class="err" id="res-err" hidden></div>';
  if(o.errors&&o.errors.length){ $('results').innerHTML=h+'<div class="err">'+o.errors.map(esc).join('<br>')+'</div>'; $('term').innerHTML=''; $('term').hidden=true; return; }
  $('term').hidden=false;
  var payoff = o.free ? 'No licence to retire' : o.payoffMonth!==null ? 'Month '+(Math.round(o.payoffMonth*10)/10).toFixed(1) : money(o.balanceDue)+' left at term end';
  h+='<div class="tiles"><div class="tile"><span>Revenue generated / yr</span><strong>'+money(o.revenueYear)+'</strong><small>'+(o.byProduct.core.on&&o.byProduct.mini.on?'Venues '+money(o.byProduct.core.revenueYear)+' · app '+money(o.byProduct.mini.revenueYear):'Before any revenue share')+'</small></div>'+
    '<div class="tile"><span>You earn / yr</span><strong class="'+(o.operatorYear<0?'bad':'')+'">'+money(o.operatorYear)+'</strong><small>After funding '+money(o.prizeYear)+' of prizes</small></div>'+
    '<div class="tile"><span>'+(o.free?'Licence':'Licence retired by activity')+'</span><strong>'+payoff+'</strong><small>'+(o.free?'Waived':money(o.licenceTotal)+' over the term')+'</small></div>'+
    '<div class="tile"><span>Your prize funding / yr</span><strong>'+money(o.prizeYear)+'</strong><small>'+(o.feeYear>0?'Entries '+money(o.entriesYear)+' · head-to-head '+money(o.feeYear)+' a year':'Carried out of your share')+'</small></div></div>';
  // The combined model: one base, both products, three cases.
  var c=o.combined;
  h+='<h3 style="margin:14px 0 2px;font-size:14px">Combined revenue model'+(c.includeH2H&&c.includeTournaments?' · head-to-head + tournaments':c.includeH2H?' · head-to-head':' · tournaments')+'</h3><div class="hint">One base feeds both products. Head-to-head takes a share of it; tournaments take their own share, or the count you entered.</div>';
  h+='<div class="stats"><div class="stat"><span>'+(f.single?'Monthly active users':'Users per location')+'</span><strong>'+num(c.mau)+'</strong><small>'+(f.single?'The base both products draw on':'× '+f.locations[f.locations.length-1]+' locations by the end of the term')+'</small></div>'+
    (c.includeH2H?'<div class="stat"><span>Paid-game volume / mo</span><strong>'+money(c.paidVolume)+'</strong><small>'+num(c.engaged)+' players at '+pctS(c.engagement)+'</small></div>':'')+
    (c.includeH2H&&c.rewardValue>0?'<div class="stat"><span>Reward value / mo</span><strong>'+money(c.rewardValue)+'</strong><small>'+num(c.rewardRedemptions)+' redemptions · not revenue</small></div>':'')+
    (c.includeTournaments?'<div class="stat"><span>Tournament participants</span><strong>'+num(c.tournamentParticipants)+'</strong><small>'+(Math.round(c.tournamentShare*100)/100)+'% of the base per event</small></div>':'')+'</div>';
  h+='<div class="cases">'+o.cases.map(function(c){return '<div class="case'+(c.key==='expected'?' mid':'')+'"><span>'+esc(c.label)+'</span><strong>'+money(c.revenueYear)+'</strong><small>'+esc(c.note)+' · you earn '+money(c.operatorYear)+'</small></div>'}).join('')+'</div>';
  if(c.includeH2H&&c.includeTournaments) h+='<div class="note">A player can take part in both, so the two audiences are not netted against each other: at the expected case about '+(Math.round(c.combinedShare*100)/100)+'% of the base is active across both.</div>';
  var max=Math.max.apply(null,o.months.map(function(m){return Math.abs(m.revenue)}).concat([1]));
  h+='<div class="hint" style="margin-top:12px">Revenue generated by month</div><div class="bars">'+o.months.map(function(m){return '<i style="height:'+Math.max(2,Math.round(m.revenue/max*88))+'px" title="Month '+m.month+': '+money(m.revenue)+(m.locationsOpen>1?' · '+m.locationsOpen+' locations':'')+'"></i>'}).join('')+'</div><div class="axis"><span>Month 1</span><span>Month '+o.months.length+'</span></div>';
  if(o.rewardValueYear>0) h+='<div class="note">Reward games add about '+money(o.rewardValueYear)+' a year of value to your venue through redeemed visits. That is a benefit, not revenue, so it is kept out of every figure above.</div>';
  $('results').innerHTML=h;
  renderTerm();
}
function renderTerm(){
  var o=OUT, f=FACTS, r=o.rates, multi=o.years.length>1, settle=o.settleTotal>0, single=f.single, h='';
  var yourLabel='Your share ('+shareLabel(o)+')', licLabel='To licence share ('+pctS(r.licenceSharePct)+')', settleLabel=o.balanceDue>0?'True-up / balance due':'True-up, settled at year end';
  h+='<h2>Results over the term</h2><div class="hint">The licence, what retires it, and what you make: by year and by month.</div>';
  if(!o.free&&o.recapturing){
    var total=o.licenceFromShare+o.licenceFromYou+o.licenceFromSigning;
    h+='<div class="keep"><strong>The licence is retired out of the licence share alone. Your share is never diverted to it.</strong>'+
      '<span>'+pctS(r.licenceSharePct)+' of every pool goes to the licence until that year\\'s fee is cleared; your '+pctS(r.yourSharePct)+' is yours from month one'+(Math.abs(r.yourSharePostPct-r.yourSharePct)>0.05?', stepping up to '+pctS(r.yourSharePostPct)+' once it is':'')+'.'+(settle?' Where a year falls short, the difference is settled separately at year end and shown here against what you have earned.':'')+'</span>'+
      '<div class="rows"><div><span>From the licence share</span><b>'+money(o.licenceFromShare)+'</b></div><div><span>From your share</span><b class="zero">'+money(o.licenceFromYou)+'</b></div>'+(o.licenceFromSigning>0?'<div><span>Signing and sponsors</span><b>'+money(o.licenceFromSigning)+'</b></div>':'')+'<div><span>Retired, total</span><b>'+money(total)+'</b></div>'+
      '<div><span>'+settleLabel+'</span><b>'+(settle?money(o.settleTotal):'$0')+'</b></div><div><span>You earn after the true-up</span><b class="'+(o.operatorAfterSettleTotal<0?'neg':'')+'">'+money(o.operatorAfterSettleTotal)+'</b><small class="hint" style="margin:2px 0 0">'+money(o.operatorTotal)+' earned over the term'+(settle?', less '+money(o.settleTotal):'')+'</small></div></div></div>';
  }
  // Payoff over the term: the licence retired month by month against the contract.
  if(!o.free){
    var ct=o.licenceTotal||1;
    h+='<div class="section"><h3>Licence payoff over the term</h3><div class="hint">Cumulative licence retired by activity, month by month, against the '+money(o.licenceTotal)+' contract.</div>'+
      '<div class="bars pay">'+o.months.map(function(m){var p=Math.min(100,m.licenceCumulative/ct*100);return '<i class="'+(p>=99.999?'done':'')+((m.month-1)%12===0&&m.month>1?' ys':'')+'" style="height:'+Math.max(2,Math.round(p*0.88))+'px" title="Month '+m.month+': '+money(m.licenceCumulative)+' of '+money(o.licenceTotal)+'"></i>'}).join('')+'</div><div class="axis"><span>Month 1</span><span>'+money(o.months[o.months.length-1].licenceCumulative)+' of '+money(o.licenceTotal)+' by month '+o.months.length+'</span></div>';
    if(multi){
      h+='<div class="tablewrap" style="margin-top:10px"><table><thead><tr><th>Year</th><th>Licence fee</th><th>From the licence share</th><th>From your share</th>'+(o.licenceFromSigning>0?'<th>Signing and sponsors</th>':'')+'<th>Retired, total</th><th>Cleared</th><th>'+settleLabel+'</th><th>Closing balance</th></tr></thead><tbody>'+
        o.years.map(function(y){return '<tr><td>Year '+y.year+'</td><td>'+money(y.licenceFee)+'</td><td>'+money(y.fromShare)+'</td><td class="zero">'+money(y.fromYou)+'</td>'+(o.licenceFromSigning>0?'<td>'+money(y.fromSigning)+'</td>':'')+'<td>'+money(y.retired)+'</td><td>'+(y.clearMonth===null?'—':'Month '+(Math.round(y.clearMonth*10)/10).toFixed(1))+'</td><td>'+(y.settle>0?money(y.settle):'—')+'</td><td>'+money(y.closing)+'</td></tr>'}).join('')+
        '</tbody></table></div>';
    }
    h+='</div>';
  }
  // What you make, by year: the seller's column order.
  h+='<div class="section"><h3>What you make</h3><div class="hint">Your share of the pool is yours from month one; the licence is retired out of the licence share, not this. Prize funding comes out of your share.'+(settle?' Where a year falls short on the licence, the true-up is read against what you have earned so far.':'')+'</div>';
  h+='<div class="tablewrap"><table><thead><tr><th>Year</th>'+(single?'':'<th>Locations</th>')+'<th>Revenue generated</th>'+(o.free?'':'<th>'+licLabel+'</th>')+(settle?'<th>'+settleLabel+'</th>':'')+'<th>'+yourLabel+'</th><th>Prize funding</th><th>You earn, after prizes</th>'+(multi?'<th>You earn, cumulative</th>':'')+(settle?'<th>Cumulative, after the true-up</th>':'')+'</tr></thead><tbody>'+
    o.years.map(function(y){return '<tr><td>Year '+y.year+'</td>'+(single?'':'<td>'+y.locations+'</td>')+'<td>'+money(y.revenue)+'</td>'+(o.free?'':'<td>'+money(y.toLicence)+'</td>')+(settle?'<td>'+(y.settle>0?money(y.settle):'—')+'</td>':'')+'<td>'+money(y.yourShare)+'</td><td>'+money(y.prize)+'</td><td'+(y.operator<0?' class="neg"':'')+'>'+money(y.operator)+'</td>'+(multi?'<td>'+money(y.operatorCumulative)+'</td>':'')+(settle?'<td'+(y.operatorAfterSettle<0?' class="neg"':'')+'>'+money(y.operatorAfterSettle)+'</td>':'')+'</tr>'}).join('')+
    (multi?'<tr class="total"><td>Term</td>'+(single?'':'<td></td>')+'<td>'+money(o.revenueTotal)+'</td>'+(o.free?'':'<td>'+money(o.toLicenceTotal)+'</td>')+(settle?'<td>'+money(o.settleTotal)+'</td>':'')+'<td>'+money(o.yourShareTotal)+'</td><td>'+money(o.prizeTotal)+'</td><td'+(o.operatorTotal<0?' class="neg"':'')+'>'+money(o.operatorTotal)+'</td><td>'+money(o.operatorTotal)+'</td>'+(settle?'<td'+(o.operatorAfterSettleTotal<0?' class="neg"':'')+'>'+money(o.operatorAfterSettleTotal)+'</td>':'')+'</tr>':'')+
    '</tbody></table></div>';
  if(settle) h+='<div class="note">The true-up is what the licence still needed after the licence share, settled separately at year end. It is never taken out of your share of the pool; it is shown beside it so both can be read together.</div>';
  h+='</div>';
  // Month by month: the break-even map.
  var h2h=o.feeYear>0||o.monthly.some(function(m){return m.fee>0});
  var cell=function(v,cls){return '<td'+(cls?' class="'+cls+'"':'')+'>'+v+'</td>'};
  var row=function(m){return '<tr>'+(multi?cell(m.year):'')+cell(multi?m.monthInYear:m.month)+(single?'':cell(m.locationsOpen))+cell(num(m.participants))+cell(money(m.entries))+(h2h?cell(money(m.fee)):'')+cell(money(m.revenue))+(o.free?'':cell(money(m.toLicence))+cell(money(m.licenceCumulative)))+cell(money(m.yourShare))+cell(money(m.prize))+cell(money(m.operator),m.operator<0?'neg':'')+cell(money(m.operatorCumulative))+'</tr>'};
  var sub=function(label,y,cls){return '<tr class="'+cls+'">'+(multi?cell(label):'')+cell(multi?'Total':label)+(single?'':cell(''))+cell(num(y.participantsAvg)+' avg')+cell(money(y.entries))+(h2h?cell(money(y.fee)):'')+cell(money(y.revenue))+(o.free?'':cell(money(y.toLicence))+cell(money(y.licenceCumulative)))+cell(money(y.yourShare))+cell(money(y.prize))+cell(money(y.operator),y.operator<0?'neg':'')+cell(money(y.operatorCumulative))+'</tr>'};
  var body='';
  o.years.forEach(function(y){ o.monthly.filter(function(m){return m.year===y.year}).forEach(function(m){ body+=row(m); }); if(multi) body+=sub('Year '+y.year,y,'sub'); });
  var last=o.years[o.years.length-1];
  body+=sub(multi?'Term':'Year total',{participantsAvg:o.monthly.reduce(function(a,m){return a+m.participants},0)/Math.max(1,o.monthly.length),entries:o.years.reduce(function(a,y){return a+y.entries},0),fee:o.years.reduce(function(a,y){return a+y.fee},0),revenue:o.revenueTotal,toLicence:o.toLicenceTotal,licenceCumulative:last.licenceCumulative,yourShare:o.yourShareTotal,prize:o.prizeTotal,operator:o.operatorTotal,operatorCumulative:o.operatorTotal},'total');
  h+='<div class="section"><h3>Month by month</h3><div class="hint">How much you make each month, with the participants behind it. A subtotal closes each year; the term is at the bottom.</div>'+
    '<div class="tablewrap"><table><thead><tr>'+(multi?'<th>Year</th>':'')+'<th>Month</th>'+(single?'':'<th>Locations</th>')+'<th>Participants</th><th>Entries</th>'+(h2h?'<th>Head-to-head fee</th>':'')+'<th>Revenue generated</th>'+(o.free?'':'<th>'+licLabel+'</th><th>Licence, cumulative</th>')+'<th>'+yourLabel+'</th><th>Prize funding</th><th>You earn, after prizes</th><th>You earn, cumulative</th></tr></thead><tbody>'+body+'</tbody></table></div></div>';
  $('term').innerHTML=h;
}
if(!needsPass){ load(); } else { $('pass').focus(); }
</script></body></html>`;
}

async function liveDeal(id) {
  if (!id) return null;
  const store = getStore();
  if (!store.enabled) return null;
  try { const d = await store.getDeal(id); return d && d.tp ? d : null; }
  catch (error) { console.error('sandbox store', error && error.message); return null; }
}
async function store_saveInputs(id, inputs) {
  try { await getStore().saveInputs(id, inputs); }
  catch (error) { console.error('sandbox store', error && error.message); }
}

async function isRevoked(id) {
  if (!id) return false;
  const store = getStore();
  if (!store.enabled) return false;
  try { const link = await store.get(id); return !!(link && link.revoked); }
  catch (error) { console.error('sandbox store', error && error.message); return false; }
}

/* Record what a customer did. Awaited before the response goes out (a
   serverless function may be frozen the moment it answers), but capped so a
   slow store can only delay a page, never break it. A first open also sends
   the seller an email, once. */
const LOG_BUDGET_MS = 2500;
function logActivity(id, event, data, req) {
  if (!id) return Promise.resolve();
  const store = getStore();
  if (!store.enabled) return Promise.resolve();
  const work = (async () => {
    const link = await store.get(id);
    if (!link) return;
    await store.touch(id, event, data);
    if (event === 'open' && !link.firstOpen && !link.notifiedAt && notify.configured()) {
      const host = (req.headers && (req.headers['x-forwarded-host'] || req.headers.host)) || '';
      const proto = (req.headers && req.headers['x-forwarded-proto']) || 'https';
      const result = await notify.sendFirstOpen(link, { dashboardUrl: host ? `${proto}://${host}/links` : '' });
      if (result.sent) await store.touch(id, 'notified');
      else console.error('sandbox notify', result.reason);
    }
  })().catch((error) => console.error('sandbox store', error && error.message));
  const budget = new Promise((resolve) => { const t = setTimeout(resolve, LOG_BUDGET_MS); if (t.unref) t.unref(); });
  return Promise.race([work, budget]);
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
    try {
      const parsed = parseScenarioToken(req.query && req.query.deal, process.env.SCENARIO_SECRET);
      needsPass = !!(parsed.data && parsed.data.pass);
      if (await isRevoked(parsed.data && parsed.data.id)) throw new Error('The link was closed by the person who sent it');
    }
    catch (error) { return res.status(400).end(`<!doctype html><title>Link unavailable</title><style>body{font:15px system-ui;background:#071a33;color:#eff6fb;padding:40px}</style><h1>This link is no longer open</h1><p>${esc(error && error.message || 'Link unavailable')}. Ask the person who sent it for a new one.</p>`); }
    return res.status(200).end(page().replace('__NEEDS_PASS__', needsPass ? 'true' : 'false'));
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'GET or POST only' });
  const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) return res.status(413).json({ error: 'Request too large' });
  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); } catch { return res.status(400).json({ error: 'Bad JSON' }); }

  if (body.action === 'link') {
    // Seller side: behind the site password like the rest of the calculator.
    if (!requireSiteAuth(req, res)) return;
    if (!allowedOrigin(req)) return res.status(403).json({ error: 'Origin not allowed' });
    const deal = body.deal;
    if (!deal || typeof deal !== 'object' || !deal.tp) return res.status(400).json({ error: 'Deal payload required' });
    const days = ALLOWED_DAYS.indexOf(Number(body.days)) >= 0 ? Number(body.days) : 7;
    const pass = String(body.pass || '').trim().slice(0, 40);
    // Every customer link needs a passcode: the link alone never opens the model.
    if (pass.length < MIN_PASS) return res.status(400).json({ error: 'A passcode of at least ' + MIN_PASS + ' characters is required. Give it to the customer on the call.' });
    const unlock = { addTournaments: body.unlock ? !!body.unlock.addTournaments : true };
    try {
      const sealed = sealDeal(deal.tp, deal.mg);
      const errors = E.TPvalidate(sealed);
      if (errors.length) return res.status(400).json({ error: 'Fix the deal first: ' + errors[0] });
      const store = getStore(), id = store.makeId(), createdAt = Date.now(), exp = createdAt + days * DAY * 1000;
      const payload = { kind: 'revenue-sandbox', id, tp: sealed, pass: pass || '', unlock, savedAt: new Date(createdAt).toISOString() };
      const token = createScenarioToken(payload, process.env.SCENARIO_SECRET, { ttlSeconds: days * DAY });
      const host = (req.headers && (req.headers['x-forwarded-host'] || req.headers.host)) || '';
      const proto = (req.headers && req.headers['x-forwarded-proto']) || (/^(127\.0\.0\.1|localhost)(:|$)/.test(host) ? 'http' : 'https');
      // The registry is what the dashboard reads. Its failure never blocks a link.
      let tracked = false;
      if (store.enabled) {
        try {
          await store.create({ id, dealName: String(sealed.dealName || '').slice(0, 120), presenter: String(sealed.presenter || '').slice(0, 120),
            presenterEmail: String(sealed.presenterEmail || '').slice(0, 200), createdAt, exp, days, pass: !!pass, unlockAdd: !!unlock.addTournaments,
            customerType: sealed.customerType, term: E.TPterm(sealed) });
          // The live model: the seller can change it later from the dashboard,
          // and the customer's own inputs are kept beside it.
          await store.saveDeal(id, { tp: sealed, inputs: null, version: 1, updatedBy: 'seller', updatedAt: createdAt }, exp);
          tracked = true;
        } catch (error) { console.error('sandbox store', error && error.message); }
      }
      return res.status(200).json({ ok: true, id, url: `${proto}://${host}/play?deal=${encodeURIComponent(token)}`, expiresInDays: days, passcode: !!pass, tracked, dashboard: `${proto}://${host}/links` });
    } catch (error) {
      return res.status(400).json({ error: String(error && error.message || error) });
    }
  }

  if (body.action === 'compute') {
    let linkId = null;
    try {
      // The passcode check happens inside verify; a wrong one is still logged.
      try { const peek = parseScenarioToken(body.deal, process.env.SCENARIO_SECRET); linkId = (peek.data && peek.data.id) || null; } catch { linkId = null; }
      if (await isRevoked(linkId)) return res.status(410).json({ error: 'The link was closed by the person who sent it' });
      const v = verify(body.deal, body.pass);
      const meta = { unlock: v.data.unlock || { addTournaments: true }, exp: v.exp };
      // The live model wins over the token when the registry has one: the
      // seller may have changed it since the link was made.
      const live = await liveDeal(linkId);
      const base = live ? live.tp : v.data.tp;
      let inputs = body.inputs, rebased = false;
      if (live && inputs && body.version !== undefined && Number(body.version) < Number(live.version)) {
        // The seller saved a new version while this page was open: their
        // version replaces what the page was about to send.
        inputs = null; rebased = true;
      } else if (live && !inputs && live.inputs) {
        // A returning customer finds their own changes where they left them.
        inputs = live.inputs;
      }
      const s = applyInputs(base, inputs, meta.unlock);
      const f = facts(s, meta), o = outputs(s);
      if (live) {
        f.version = live.version; f.updatedAt = live.updatedAt; f.updatedBy = live.updatedBy; f.rebased = rebased;
        if (body.inputs && !rebased) await store_saveInputs(linkId, body.inputs);
      }
      await logActivity(linkId, body.inputs ? 'edit' : 'open', body.inputs ? scenarioSummary(f, o) : null, req);
      return res.status(200).json({ ok: true, facts: f, outputs: o });
    } catch (error) {
      if (/passcode/i.test(String(error && error.message))) await logActivity(linkId, 'badPass', null, req);
      return res.status(400).json({ error: String(error && error.message || error) });
    }
  }
  if (body.action === 'update') {
    // The seller saves changes to a link the customer already has. The
    // authorisation is the edit token the dashboard minted (kind
    // revenue-model with a sandboxId), which only the key-gated dashboard
    // can produce.
    if (!requireSiteAuth(req, res)) return;
    if (!allowedOrigin(req)) return res.status(403).json({ error: 'Origin not allowed' });
    try {
      const parsed = parseScenarioToken(body.edit, process.env.SCENARIO_SECRET);
      const id = parsed.data && parsed.data.kind === 'revenue-model' && parsed.data.sandboxId;
      if (!id) return res.status(400).json({ error: 'Not a sandbox edit link' });
      const store = getStore();
      if (!store.enabled) return res.status(503).json({ error: 'No link registry attached' });
      const link = await store.get(id), cur = await store.getDeal(id);
      if (!link || !cur) return res.status(404).json({ error: 'That sandbox link is no longer on record' });
      const deal = body.deal;
      if (!deal || typeof deal !== 'object' || !deal.tp) return res.status(400).json({ error: 'Deal payload required' });
      const sealed = sealDeal(deal.tp, deal.mg);
      const errors = E.TPvalidate(sealed);
      if (errors.length) return res.status(400).json({ error: 'Fix the deal first: ' + errors[0] });
      const version = Number(cur.version || 1) + 1, updatedAt = Date.now();
      await store.saveDeal(id, { tp: sealed, inputs: null, version, updatedBy: 'seller', updatedAt }, link.exp);
      await store.touch(id, 'sellerUpdate');
      return res.status(200).json({ ok: true, id, version, updatedAt, dealName: link.dealName, status: link.revoked ? 'closed' : link.exp <= updatedAt ? 'expired' : 'open' });
    } catch (error) {
      return res.status(400).json({ error: String(error && error.message || error) });
    }
  }
  return res.status(400).json({ error: 'Unknown action' });
};

module.exports._internals = { applyInputs, facts, outputs, sealDeal, scenarioSummary };

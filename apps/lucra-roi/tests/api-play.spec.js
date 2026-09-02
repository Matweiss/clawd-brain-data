import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const handler = require('../api/play.js');
const E = require('../lib/revenue-engine.js');
const { createScenarioToken } = require('../lib/scenario-token');

const SECRET = 'test-secret-that-is-long-enough-for-aes-256';
const BLOCKED = /cash|wager|betting|\bbet\b|gambl|casino|prize money|stakes|buy-in|payout|\brake\b|\bhandle\b/i;

function res() {
  const out = { statusCode: 200, headers: {} };
  out.setHeader = (k, v) => { out.headers[k] = v; };
  out.status = (n) => { out.statusCode = n; return out; };
  out.json = (body) => { out.body = body; return out; };
  out.end = (body) => { out.body = body; return out; };
  return out;
}

const deal = () => E.TPstate({
  dealName: 'Loco Bear', presenter: 'Mat', termYears: 3, annualFees: [60000, 60000, 60000], mau: 8000, locations: [1, 3, 5],
  includeTournaments: true, includeH2H: true, splitMode: 'custom', custom: { credit: 55, operator: 35, lucra: 10 }, post: { operator: 88, lucra: 12 },
  core: { h2h: { engagement: 10, playsPerUser: 20, spendPerPlay: 2, feeRate: 17.5 } },
});

async function link(body, headers) {
  const r = res();
  // Every link carries a passcode now; tests that do not care use this one.
  await handler({ method: 'POST', body: Object.assign({ action: 'link', pass: 'test-pass' }, body), headers: Object.assign({ host: 'roi.test', 'x-forwarded-proto': 'https' }, headers || {}) }, r);
  return r;
}
const PASS = 'test-pass';
async function compute(tok, pass, inputs) {
  const r = res();
  await handler({ method: 'POST', body: { action: 'compute', deal: tok, pass, inputs }, headers: {} }, r);
  return r;
}
const tokenOf = (r) => new URL(r.body.url).searchParams.get('deal');

beforeEach(() => { process.env.SCENARIO_SECRET = SECRET; });
afterEach(() => { delete process.env.SCENARIO_SECRET; });

describe('/api/play — the customer sandbox', () => {
  it('creates a link on the seller side with the chosen expiry and passcode, same origin only', async () => {
    const r = await link({ deal: { tp: deal(), mg: { eng: 12, plays: 25 } }, days: 7, pass: 'bear' });
    expect(r.statusCode).toBe(200);
    expect(r.body.url).toMatch(/^https:\/\/roi\.test\/play\?deal=v1\./);
    expect(r.body.expiresInDays).toBe(7);
    expect(r.body.passcode).toBe(true);
    expect(r.body.url).not.toContain('Loco');
    const denied = await link({ deal: { tp: deal() } }, { origin: 'https://evil.test' });
    expect(denied.statusCode).toBe(403);
    const odd = await link({ deal: { tp: deal() }, days: 99 });
    expect(odd.body.expiresInDays).toBe(7);
    const short = await link({ deal: { tp: deal() }, days: 1 });
    expect(short.body.expiresInDays).toBe(1);
  });

  it('refuses a deal that does not validate, and refuses an ordinary deal link', async () => {
    const bad = await link({ deal: { tp: E.TPstate({ annualFees: [0], mau: 1000 }) } });
    expect(bad.statusCode).toBe(400);
    expect(bad.body.error).toMatch(/Fix the deal first/);
    const dealLink = createScenarioToken({ kind: 'revenue-model', tp: deal() }, SECRET, { ttlSeconds: 3600 });
    expect((await compute(dealLink, PASS, null)).body.error).toMatch(/Not a sandbox link/);
  });

  it('gates on the passcode and returns customer-safe facts and outputs, never the terms', async () => {
    const tok = tokenOf(await link({ deal: { tp: deal(), mg: { eng: 12 } }, pass: 'bear' }));
    expect((await compute(tok, 'wrong', null)).statusCode).toBe(400);
    const r = await compute(tok, 'bear', null);
    expect(r.statusCode).toBe(200);
    const { facts, outputs } = r.body;
    expect(facts.dealName).toBe('Loco Bear');
    expect(facts.locations).toEqual([1, 3, 5]);
    expect(facts.core.h2h.engagement).toBe(10);
    expect(facts.licenceTotal).toBe(180000);
    expect(outputs.payoffMonth).not.toBeNull();
    expect(outputs.revenueYear).toBeGreaterThan(0);
    expect(outputs.years).toHaveLength(3);
    // The licence is retired from the licence share alone; the customer's share never funds it.
    expect(outputs.recapturing).toBe(true);
    expect(outputs.licenceFromYou).toBe(0);
    expect(outputs.licenceFromShare).toBeGreaterThan(0);
    expect(outputs.licenceFromShare).toBeCloseTo(outputs.years.reduce((a, y) => a + y.retired, 0), 3);
    // Nothing that recovers the split beyond what the one-pager prints.
    const json = JSON.stringify(r.body);
    ['toLucra', 'totalLucra', 'lucraShare', 'splitMode', 'credit', 'postOperator', 'feeRate', 'rake', '"custom"', '17.5', 'operatorGross'].forEach((k) => {
      expect(json, k).not.toContain(k);
    });
    expect(json).not.toMatch(/"lucra"/);
    expect(json).not.toMatch(BLOCKED);
  });

  it('applies only the customer\'s own facts and ignores everything else', async () => {
    const tok = tokenOf(await link({ deal: { tp: deal() } }));
    const base = (await compute(tok, PASS, null)).body;
    const edited = (await compute(tok, PASS, {
      mau: 12000,
      openings: [{ month: 1, add: 1 }, { month: 14, add: 2 }, { month: 22, add: 2 }],
      core: { tournaments: [{ id: 't1', eventsPerMonth: 8, entryPrice: 12, scope: 'network' }, { id: 't2', prizeValue: 5000 }], h2h: { engagement: 15, feeRate: 25 } },
      // Terms the customer must not be able to touch.
      annualFees: [1, 1, 1], freeLicense: true, splitMode: 'sweep', custom: { credit: 1, operator: 98, lucra: 1 }, termYears: 1,
    })).body;
    expect(edited.facts.mau).toBe(12000);
    expect(edited.facts.scheduleStated).toBe(true);
    expect(edited.facts.locations).toEqual([1, 5, 5]);
    expect(edited.facts.core.tournaments[0].eventsPerMonth).toBe(8);
    expect(edited.facts.core.tournaments[0].scope).toBe('network');
    expect(edited.facts.core.tournaments[1].prizeValue).toBe(5000);
    expect(edited.facts.core.h2h.engagement).toBe(15);
    expect(edited.facts.licenceTotal).toBe(180000);
    expect(edited.facts.term).toBe(3);
    expect(edited.outputs.free).toBe(false);
    expect(edited.outputs.licenceTotal).toBe(180000);
    expect(edited.outputs.revenueYear).toBeGreaterThan(base.outputs.revenueYear);
    // The take fee stayed at the seller's 17.5%: the fee moved only with volume.
    const s = E.TPstate(deal());
    s.mau = 12000; s.openings = [{ month: 1, add: 1 }, { month: 14, add: 2 }, { month: 22, add: 2 }]; s.core.h2h.engagement = 15;
    s.core.tournaments[0].eventsPerMonth = 8; s.core.tournaments[0].entryPrice = 12; s.core.tournaments[0].scope = 'network';
    s.core.tournaments[1].rewardFaceValue = 5000; s.core.tournaments[1].cashPrizeAmount = 5000; s.core.tournaments[1].customerCashCost = 5000;
    const r = E.TPcalculate(s);
    expect(edited.outputs.revenueYear).toBeCloseTo(r.totalSplitBase / 3, 3);
    expect(edited.outputs.operatorYear).toBeCloseTo(r.totalOperator / 3, 3);
  });

  it('honours the add-and-remove lock', async () => {
    const locked = tokenOf(await link({ deal: { tp: deal() }, unlock: { addTournaments: false } }));
    const r = (await compute(locked, PASS, { core: { tournaments: [{ id: 'made-up', eventsPerMonth: 30 }] } })).body;
    expect(r.facts.unlock.addTournaments).toBe(false);
    expect(r.facts.core.tournaments.map((t) => t.id)).toEqual(['t1', 't2']);
    const open = tokenOf(await link({ deal: { tp: deal() } }));
    const added = (await compute(open, PASS, { core: { tournaments: [{ id: 't1' }, { id: 'new', name: 'Third', eventsPerMonth: 2 }] } })).body;
    expect(added.facts.core.tournaments.map((t) => t.name)).toEqual(['Weekly open', 'Third']);
  });

  it('serves the page without any deal data in it, and a plain error for a dead link', async () => {
    const tok = tokenOf(await link({ deal: { tp: deal() }, pass: 'bear' }));
    const page = res();
    await handler({ method: 'GET', query: { deal: tok }, headers: {} }, page);
    expect(page.statusCode).toBe(200);
    expect(page.body).toContain('needsPass = true');
    expect(page.body).not.toContain('Loco Bear');
    expect(page.body).not.toContain('60000');
    expect(page.body).not.toMatch(BLOCKED);
    const dead = res();
    await handler({ method: 'GET', query: { deal: 'v1.nope' }, headers: {} }, dead);
    expect(dead.statusCode).toBe(400);
    expect(dead.body).toContain('no longer open');
  });
});

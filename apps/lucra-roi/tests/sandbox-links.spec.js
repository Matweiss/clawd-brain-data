import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const play = require('../api/play.js');
const links = require('../api/links.js');
const E = require('../lib/revenue-engine.js');
const store = require('../lib/sandbox-store.js');
const notify = require('../lib/sandbox-notify.js');

const SECRET = 'test-secret-that-is-long-enough-for-aes-256';
const KEY = 'dashboard-key-for-tests';

function res() {
  const out = { statusCode: 200, headers: {} };
  out.setHeader = (k, v) => { out.headers[k] = v; };
  out.status = (n) => { out.statusCode = n; return out; };
  out.json = (body) => { out.body = body; return out; };
  out.end = (body) => { out.body = body; return out; };
  return out;
}

const deal = () => E.TPstate({
  dealName: 'Loco Bear', presenter: 'Mat', presenterEmail: 'mat@example.com', termYears: 3, annualFees: [78000, 102000, 126000], mau: 6000, locations: [1, 2, 4],
  includeTournaments: true, includeH2H: false, splitMode: 'custom', custom: { credit: 50, operator: 45, lucra: 5 }, post: { operator: 90, lucra: 10 },
});

const HEADERS = { host: 'roi.test', 'x-forwarded-proto': 'https' };
async function link(body) {
  const r = res();
  await play({ method: 'POST', body: Object.assign({ action: 'link' }, body), headers: HEADERS }, r);
  return r;
}
async function compute(tok, pass, inputs) {
  const r = res();
  await play({ method: 'POST', body: { action: 'compute', deal: tok, pass, inputs }, headers: HEADERS }, r);
  return r;
}
async function pageGet(tok) {
  const r = res();
  await play({ method: 'GET', query: { deal: tok }, headers: HEADERS }, r);
  return r;
}
async function dash(body) {
  const r = res();
  await links({ method: 'POST', body: Object.assign({ key: KEY }, body), headers: HEADERS }, r);
  return r;
}
const tokenOf = (r) => new URL(r.body.url).searchParams.get('deal');

beforeEach(() => {
  process.env.SCENARIO_SECRET = SECRET;
  process.env.SANDBOX_STORE = 'memory';
  process.env.SANDBOX_ADMIN_KEY = KEY;
  store._resetMemory();
});
afterEach(() => {
  delete process.env.SCENARIO_SECRET; delete process.env.SANDBOX_STORE; delete process.env.SANDBOX_ADMIN_KEY;
  delete process.env.RESEND_API_KEY; delete process.env.SANDBOX_NOTIFY_TO;
  vi.restoreAllMocks();
});

describe('The sandbox link registry', () => {
  it('records each link at creation and lists it on the dashboard', async () => {
    const a = await link({ deal: { tp: deal() }, days: 7, pass: 'bear' });
    expect(a.body.tracked).toBe(true);
    expect(a.body.id).toMatch(/^[a-f0-9]{16}$/);
    expect(a.body.dashboard).toBe('https://roi.test/links');
    const b = await link({ deal: { tp: Object.assign(deal(), { dealName: 'Smack Talk' }) }, days: 1 });
    const list = await dash({ action: 'list' });
    expect(list.statusCode).toBe(200);
    expect(list.body.store).toBe(true);
    expect(list.body.links.map((l) => l.dealName)).toEqual(['Smack Talk', 'Loco Bear']);
    const bear = list.body.links[1];
    expect(bear.id).toBe(a.body.id);
    expect(bear.pass).toBe(true);
    expect(bear.status).toBe('open');
    expect(bear.opens).toBe(0);
    expect(bear.exp - bear.createdAt).toBe(7 * 24 * 3600 * 1000);
    expect(list.body.links[0].id).toBe(b.body.id);
    // The registry never holds the deal itself: no fees, no split.
    const json = JSON.stringify(list.body);
    ['78000', 'credit', '"custom"', 'annualFees', 'lucra'].forEach((k) => expect(json).not.toContain(k));
    expect(bear.days).toBe(7);
    expect(bear.term).toBe(3);
  });

  it('counts opens, edits and wrong passcodes, and keeps the last scenario', async () => {
    const tok = tokenOf(await link({ deal: { tp: deal() }, pass: 'bear' }));
    expect((await compute(tok, 'nope', null)).statusCode).toBe(400);
    expect((await compute(tok, 'bear', null)).statusCode).toBe(200);
    expect((await compute(tok, 'bear', null)).statusCode).toBe(200);
    const edit = await compute(tok, 'bear', { mau: 9000, openings: [{ month: 1, add: 1 }, { month: 10, add: 3 }], core: { tournaments: [{ id: 't1', eventsPerMonth: 8 }] } });
    expect(edit.statusCode).toBe(200);
    const [l] = (await dash({ action: 'list' })).body.links;
    expect(l.opens).toBe(2);
    expect(l.edits).toBe(1);
    expect(l.badPass).toBe(1);
    expect(l.firstOpen).toBeGreaterThan(0);
    expect(l.lastOpen).toBeGreaterThanOrEqual(l.firstOpen);
    expect(l.lastEdit).toBeGreaterThan(0);
    expect(l.lastInputs.mau).toBe(9000);
    expect(l.lastInputs.locations).toEqual([4, 4, 4]);
    expect(l.lastInputs.scheduleStated).toBe(true);
    expect(l.lastInputs.core.tournaments[0].eventsPerMonth).toBe(8);
    expect(l.lastInputs.revenueYear).toBeCloseTo(edit.body.outputs.revenueYear, 3);
    expect(l.lastInputs.operatorYear).toBeCloseTo(edit.body.outputs.operatorYear, 3);
    // Still nothing of the terms in what is kept.
    const json = JSON.stringify(l.lastInputs);
    ['feeRate', 'credit', 'lucra', 'annualFees', 'toLucra'].forEach((k) => expect(json).not.toContain(k));
  });

  it('closes a link immediately, reopens it, and removes it from the list', async () => {
    const made = await link({ deal: { tp: deal() } });
    const tok = tokenOf(made), id = made.body.id;
    expect((await compute(tok, '', null)).statusCode).toBe(200);
    expect((await dash({ action: 'revoke', id })).body.ok).toBe(true);
    const closed = await compute(tok, '', null);
    expect(closed.statusCode).toBe(410);
    expect(closed.body.error).toMatch(/closed by the person who sent it/);
    const pageClosed = await pageGet(tok);
    expect(pageClosed.statusCode).toBe(400);
    expect(pageClosed.body).toContain('closed by the person who sent it');
    expect((await dash({ action: 'list' })).body.links[0].status).toBe('closed');
    expect((await dash({ action: 'reopen', id })).body.ok).toBe(true);
    expect((await compute(tok, '', null)).statusCode).toBe(200);
    expect((await pageGet(tok)).statusCode).toBe(200);
    expect((await dash({ action: 'remove', id })).body.ok).toBe(true);
    expect((await dash({ action: 'list' })).body.links).toEqual([]);
    // A removed link is unknown to the registry, so it works until it expires and is not tracked.
    expect((await compute(tok, '', null)).statusCode).toBe(200);
    expect((await dash({ action: 'revoke', id })).body.ok).toBe(false);
  });

  it('gates the dashboard on its key and the same origin', async () => {
    const r = res();
    await links({ method: 'POST', body: { action: 'list', key: 'wrong' }, headers: HEADERS }, r);
    expect(r.statusCode).toBe(401);
    const cross = res();
    await links({ method: 'POST', body: { action: 'list', key: KEY }, headers: Object.assign({ origin: 'https://evil.test' }, HEADERS) }, cross);
    expect(cross.statusCode).toBe(403);
    const bad = await dash({ action: 'revoke', id: '../x' });
    expect(bad.statusCode).toBe(400);
    delete process.env.SANDBOX_ADMIN_KEY;
    const none = res();
    await links({ method: 'POST', body: { action: 'list', key: '' }, headers: HEADERS }, none);
    expect(none.statusCode).toBe(503);
    const page = res();
    await links({ method: 'GET', headers: HEADERS }, page);
    expect(page.statusCode).toBe(503);
    expect(page.body).toContain('SANDBOX_ADMIN_KEY');
    process.env.SANDBOX_ADMIN_KEY = KEY;
    const ok = res();
    await links({ method: 'GET', headers: HEADERS }, ok);
    expect(ok.statusCode).toBe(200);
    expect(ok.body).toContain('Sandbox links');
    expect(ok.body).not.toContain(KEY);
  });

  it('keeps working statelessly when no registry is attached', async () => {
    delete process.env.SANDBOX_STORE;
    const made = await link({ deal: { tp: deal() } });
    expect(made.statusCode).toBe(200);
    expect(made.body.tracked).toBe(false);
    expect((await compute(tokenOf(made), '', null)).statusCode).toBe(200);
    const list = await dash({ action: 'list' });
    expect(list.body.store).toBe(false);
    expect(list.body.links).toEqual([]);
    expect((await dash({ action: 'revoke', id: made.body.id })).statusCode).toBe(503);
  });

  it('never lets a registry failure break a customer page', async () => {
    const made = await link({ deal: { tp: deal() } });
    const tok = tokenOf(made);
    // A configured Redis that is unreachable.
    delete process.env.SANDBOX_STORE;
    process.env.KV_REST_API_URL = 'https://kv.test'; process.env.KV_REST_API_TOKEN = 't';
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('redis down'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await compute(tok, '', null)).statusCode).toBe(200);
    expect((await pageGet(tok)).statusCode).toBe(200);
    const list = await dash({ action: 'list' });
    expect(list.statusCode).toBe(502);
    expect(list.body.error).toMatch(/redis down/);
    delete process.env.KV_REST_API_URL; delete process.env.KV_REST_API_TOKEN;
  });

  it('emails the presenter once, on the first open, when Resend is configured', async () => {
    process.env.RESEND_API_KEY = 're_test';
    const calls = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, opts) => {
      calls.push({ url, body: JSON.parse(opts.body) });
      return { ok: true, status: 200, json: async () => ({ id: 'email_1' }) };
    });
    const tok = tokenOf(await link({ deal: { tp: deal() }, pass: 'bear' }));
    await compute(tok, 'bear', null);
    await compute(tok, 'bear', null);
    await compute(tok, 'bear', { mau: 7000 });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://api.resend.com/emails');
    expect(calls[0].body.to).toEqual(['mat@example.com']);
    expect(calls[0].body.subject).toBe('Loco Bear opened their sandbox');
    expect(calls[0].body.text).toContain('https://roi.test/links');
    expect(calls[0].body.text).toContain('entered the passcode');
    const [l] = (await dash({ action: 'list' })).body.links;
    expect(l.notifiedAt).toBeGreaterThan(0);
    // SANDBOX_NOTIFY_TO wins over the presenter; without either, nothing is sent.
    process.env.SANDBOX_NOTIFY_TO = 'sales@example.com';
    expect(notify.recipient({ presenterEmail: 'mat@example.com' })).toBe('sales@example.com');
    delete process.env.SANDBOX_NOTIFY_TO;
    expect(notify.recipient({ presenterEmail: 'not an email' })).toBe('');
    expect((await notify.sendFirstOpen({ presenterEmail: '' })).sent).toBe(false);
  });

  it('reports a Resend refusal without throwing', async () => {
    process.env.RESEND_API_KEY = 're_test';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 403, json: async () => ({ message: 'domain not verified' }) });
    const r = await notify.sendFirstOpen({ dealName: 'X', presenterEmail: 'mat@example.com' });
    expect(r.sent).toBe(false);
    expect(r.reason).toBe('Resend 403: domain not verified');
  });
});

describe('Co-working a customer\'s sandbox', () => {
  async function update(edit, tp) {
    const r = res();
    await play({ method: 'POST', body: { action: 'update', edit, deal: { tp } }, headers: HEADERS }, r);
    return r;
  }
  const editToken = (r) => new URL(r.body.url).searchParams.get('deal');

  it('keeps the customer\'s own changes for their next visit', async () => {
    const tok = tokenOf(await link({ deal: { tp: deal() } }));
    const first = (await compute(tok, '', null)).body;
    expect(first.facts.version).toBe(1);
    expect(first.facts.mau).toBe(6000);
    await compute(tok, '', { mau: 9000, core: { tournaments: [{ id: 't1', eventsPerMonth: 8 }] } });
    // A fresh load (inputs null) comes back where they left off.
    const again = (await compute(tok, '', null)).body;
    expect(again.facts.mau).toBe(9000);
    expect(again.facts.core.tournaments[0].eventsPerMonth).toBe(8);
    expect(again.facts.version).toBe(1);
    expect(again.facts.rebased).toBe(false);
  });

  it('lets the seller open the customer\'s current model, save changes, and the customer sees them', async () => {
    const made = await link({ deal: { tp: deal() } });
    const tok = tokenOf(made), id = made.body.id;
    await compute(tok, '', { mau: 9000 });
    // The dashboard mints an edit link carrying the customer's inputs on top of the deal.
    const edit = await dash({ action: 'edit', id });
    expect(edit.statusCode).toBe(200);
    expect(edit.body.url).toMatch(/^https:\/\/roi\.test\/\?deal=v1\./);
    expect(edit.body.customerEdited).toBe(true);
    const parsed = require('../lib/scenario-token').parseScenarioToken(editToken(edit), SECRET);
    expect(parsed.data.kind).toBe('revenue-model');
    expect(parsed.data.sandboxId).toBe(id);
    expect(parsed.data.sandboxName).toBe('Loco Bear');
    expect(parsed.data.tp.mau).toBe(9000);
    // The seller changes the deal and adds a tournament, then saves it back.
    const tp = E.TPstate(parsed.data.tp);
    tp.mau = 10000;
    tp.core.tournaments.push(Object.assign({}, tp.core.tournaments[0], { id: 'seller-added', name: 'Seller special', eventsPerMonth: 2 }));
    const saved = await update(editToken(edit), tp);
    expect(saved.statusCode).toBe(200);
    expect(saved.body.version).toBe(2);
    expect(saved.body.status).toBe('open');
    // The customer's page, still open on version 1, sends its stale inputs: it is rebased, not honoured.
    const staleR = res();
    await play({ method: 'POST', body: { action: 'compute', deal: tok, pass: '', inputs: { mau: 9000 }, version: 1 }, headers: HEADERS }, staleR);
    expect(staleR.body.facts.rebased).toBe(true);
    expect(staleR.body.facts.version).toBe(2);
    expect(staleR.body.facts.mau).toBe(10000);
    expect(staleR.body.facts.core.tournaments.map((t) => t.name)).toContain('Seller special');
    expect(staleR.body.facts.updatedBy).toBe('seller');
    // A fresh visit gets the seller's version outright.
    const fresh = (await compute(tok, '', null)).body;
    expect(fresh.facts.mau).toBe(10000);
    expect(fresh.facts.version).toBe(2);
    // And from there the customer can edit again on top of it.
    const edited = (await compute(tok, '', { mau: 11000 })).body;
    expect(edited.facts.mau).toBe(11000);
    expect(edited.facts.rebased).toBe(false);
    const [l] = (await dash({ action: 'list' })).body.links;
    expect(l.sellerUpdates).toBe(1);
    expect(l.lastSellerUpdate).toBeGreaterThan(0);
  });

  it('refuses an update without a sandbox edit token, and a bad deal', async () => {
    const made = await link({ deal: { tp: deal() } });
    const plain = require('../lib/scenario-token').createScenarioToken({ kind: 'revenue-model', tp: deal() }, SECRET, { ttlSeconds: 600 });
    expect((await update(plain, deal())).statusCode).toBe(400);
    const edit = editToken(await dash({ action: 'edit', id: made.body.id }));
    const bad = await update(edit, E.TPstate({ annualFees: [0], mau: 1000 }));
    expect(bad.statusCode).toBe(400);
    expect(bad.body.error).toMatch(/Fix the deal first/);
    await dash({ action: 'remove', id: made.body.id });
    expect((await update(edit, deal())).statusCode).toBe(404);
    expect((await dash({ action: 'edit', id: made.body.id })).statusCode).toBe(404);
  });
});

describe('The customer page outputs', () => {
  it('carry the split as it applies to the customer, by year and by month, never Lucra\'s', async () => {
    const tok = tokenOf(await link({ deal: { tp: deal() } }));
    const { outputs: o } = (await compute(tok, '', null)).body;
    expect(o.rates).toEqual({ licenceSharePct: 50, yourSharePct: 45, yourSharePostPct: 90 });
    expect(o.years).toHaveLength(3);
    expect(o.monthly).toHaveLength(36);
    const y1 = o.years[0], m1 = o.monthly[0];
    expect(m1.toLicence).toBeCloseTo(m1.revenue * 0.5, 6);
    expect(m1.yourShare).toBeCloseTo(m1.revenue * 0.45, 6);
    expect(m1.operator).toBeCloseTo(m1.yourShare - m1.prize, 6);
    expect(y1.revenue).toBeCloseTo(o.monthly.filter((m) => m.year === 1).reduce((a, m) => a + m.revenue, 0), 6);
    expect(y1.toLicence).toBeCloseTo(y1.fromShare, 6);
    expect(y1.fromYou).toBe(0);
    expect(o.years[2].operatorCumulative).toBeCloseTo(o.operatorTotal, 6);
    expect(o.monthly[35].operatorCumulative).toBeCloseTo(o.operatorTotal, 6);
    expect(o.operatorAfterSettleTotal).toBeCloseTo(o.operatorTotal - o.settleTotal, 6);
    expect(o.contract.total).toBe(306000);
    expect(o.combined.mau).toBe(6000);
    const json = JSON.stringify(o);
    ['toLucra', 'lucraShare', 'postOperator', 'credit', 'operatorGross', 'feeRate'].forEach((k) => expect(json).not.toContain(k));
    expect(json).not.toMatch(/"lucra/i);
  });
});

describe('The store over the Redis REST protocol', () => {
  it('speaks Upstash pipelines and reads hashes back', async () => {
    const sent = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, opts) => {
      const body = JSON.parse(opts.body);
      sent.push({ url, body, auth: opts.headers.Authorization });
      const hash = ['id', 'abc', 'dealName', 'Loco Bear', 'opens', '3', 'pass', '1', 'revoked', '0', 'lastInputs', '{"mau":6000}'];
      if (url.endsWith('/pipeline')) return { json: async () => body.map((c) => ({ result: c[0] === 'HGETALL' ? hash : 1 })) };
      if (body[0] === 'HGETALL') return { json: async () => ({ result: hash }) };
      if (body[0] === 'ZREVRANGE') return { json: async () => ({ result: ['abc'] }) };
      if (body[0] === 'EXISTS') return { json: async () => ({ result: 1 }) };
      return { json: async () => ({ result: 'OK' }) };
    });
    const s = store.createStore(store.redisClient({ url: 'https://kv.test', token: 'tok' }), { now: () => 1000 });
    await s.create({ id: 'abc', dealName: 'Loco Bear', createdAt: 1000, exp: 2000, pass: true });
    expect(sent[0].url).toBe('https://kv.test/pipeline');
    expect(sent[0].auth).toBe('Bearer tok');
    expect(sent[0].body[0].slice(0, 2)).toEqual(['HSET', 'sbx:link:abc']);
    expect(sent[0].body[0]).toContain('pass');
    expect(sent[0].body[0][sent[0].body[0].indexOf('pass') + 1]).toBe('1');
    expect(sent[0].body[1]).toEqual(['EXPIRE', 'sbx:link:abc', String(Math.round((2000 + store.KEEP_AFTER_EXPIRY_MS - 1000) / 1000))]);
    expect(sent[0].body[2]).toEqual(['ZADD', 'sbx:links', '1000', 'abc']);
    const got = await s.get('abc');
    expect(got).toEqual({ id: 'abc', dealName: 'Loco Bear', opens: 3, pass: true, revoked: false, unlockAdd: false, lastInputs: { mau: 6000 } });
    const list = await s.list();
    expect(list).toHaveLength(1);
    await s.touch('abc', 'open');
    const touch = sent[sent.length - 1].body;
    expect(touch[0]).toEqual(['HINCRBY', 'sbx:link:abc', 'opens', '1']);
    expect(touch[2]).toEqual(['HSETNX', 'sbx:link:abc', 'firstOpen', '1000']);
    expect(store.credentials()).toBeNull();
    process.env.KV_REST_API_URL = 'https://kv.test/'; process.env.KV_REST_API_TOKEN = 't';
    expect(store.credentials()).toEqual({ url: 'https://kv.test', token: 't' });
    delete process.env.KV_REST_API_URL; delete process.env.KV_REST_API_TOKEN;
  });
});

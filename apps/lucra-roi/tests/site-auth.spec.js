import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const auth = require('../lib/site-auth.js');
const index = require('../api/index.js');
const deal = require('../api/deal.js');
const play = require('../api/play.js');
const links = require('../api/links.js');
const E = require('../lib/revenue-engine.js');

const basic = (u, p) => 'Basic ' + Buffer.from(u + ':' + p).toString('base64');
function res() {
  const out = { statusCode: 200, headers: {} };
  out.setHeader = (k, v) => { out.headers[k] = v; };
  out.status = (n) => { out.statusCode = n; return out; };
  out.json = (body) => { out.body = body; return out; };
  out.end = (body) => { out.body = body; return out; };
  return out;
}
const HOST = { host: 'roi.test', 'x-forwarded-proto': 'https' };
const tp = () => E.TPstate({ dealName: 'Loco Bear', termYears: 1, annualFees: [60000], mau: 6000, includeTournaments: true });

beforeEach(() => { delete process.env.SITE_AUTH; process.env.SITE_PASSWORD = 'open-sesame'; process.env.SCENARIO_SECRET = 'test-secret-that-is-long-enough-for-aes-256'; process.env.SANDBOX_STORE = 'memory'; });
afterEach(() => { process.env.SITE_AUTH = 'off'; delete process.env.SITE_PASSWORD; delete process.env.SITE_USER; delete process.env.SCENARIO_SECRET; delete process.env.SANDBOX_STORE; delete process.env.SANDBOX_ADMIN_KEY; });

describe('The site password', () => {
  it('accepts the configured user and password only, and fails closed without one', () => {
    expect(auth.siteAuthOk({ headers: { authorization: basic('lucra', 'open-sesame') } })).toBe(true);
    expect(auth.siteAuthOk({ headers: { authorization: basic('lucra', 'wrong') } })).toBe(false);
    expect(auth.siteAuthOk({ headers: { authorization: basic('someone', 'open-sesame') } })).toBe(false);
    expect(auth.siteAuthOk({ headers: {} })).toBe(false);
    expect(auth.siteAuthOk({ headers: { authorization: 'Bearer x' } })).toBe(false);
    process.env.SITE_USER = 'mat';
    expect(auth.siteAuthOk({ headers: { authorization: basic('lucra', 'open-sesame') } })).toBe(false);
    expect(auth.siteAuthOk({ headers: { authorization: basic('mat', 'open-sesame') } })).toBe(true);
    delete process.env.SITE_PASSWORD;
    expect(auth.siteAuthOk({ headers: { authorization: basic('mat', '') } })).toBe(false);
    const r = res();
    expect(auth.requireSiteAuth({ headers: {} }, r)).toBe(false);
    expect(r.statusCode).toBe(503);
  });

  it('guards the calculator page and its APIs with a browser prompt', async () => {
    const page = res();
    await index({ method: 'GET', headers: HOST }, page);
    expect(page.statusCode).toBe(401);
    expect(page.headers['WWW-Authenticate']).toMatch(/^Basic realm=/);
    const ok = res();
    await index({ method: 'GET', headers: Object.assign({ authorization: basic('lucra', 'open-sesame') }, HOST) }, ok);
    expect(ok.statusCode).toBe(200);
    expect(ok.body).toContain('<html');
    const d = res();
    await deal({ method: 'POST', body: { deal: { tp: tp() } }, headers: HOST }, d);
    expect(d.statusCode).toBe(401);
    const dash = res();
    await links({ method: 'GET', headers: HOST }, dash);
    expect(dash.statusCode).toBe(401);
    const dashOk = res();
    await links({ method: 'GET', headers: Object.assign({ authorization: basic('lucra', 'open-sesame') }, HOST) }, dashOk);
    expect(dashOk.statusCode).toBe(200);
    // With no second key, the dashboard opens straight away behind the site password.
    expect(dashOk.body).toContain('NEEDS_KEY=false');
    const list = res();
    await links({ method: 'POST', body: { action: 'list' }, headers: Object.assign({ authorization: basic('lucra', 'open-sesame') }, HOST) }, list);
    expect(list.statusCode).toBe(200);
    process.env.SANDBOX_ADMIN_KEY = 'second-gate';
    const noKey = res();
    await links({ method: 'POST', body: { action: 'list' }, headers: Object.assign({ authorization: basic('lucra', 'open-sesame') }, HOST) }, noKey);
    expect(noKey.statusCode).toBe(401);
  });

  it('keeps the customer sandbox open, but only with the link and its passcode', async () => {
    // Making a link is the seller's job: site password required, passcode required.
    const noAuth = res();
    await play({ method: 'POST', body: { action: 'link', deal: { tp: tp() }, pass: 'bear-1234' }, headers: HOST }, noAuth);
    expect(noAuth.statusCode).toBe(401);
    const sellerHeaders = Object.assign({ authorization: basic('lucra', 'open-sesame') }, HOST);
    const noPass = res();
    await play({ method: 'POST', body: { action: 'link', deal: { tp: tp() } }, headers: sellerHeaders }, noPass);
    expect(noPass.statusCode).toBe(400);
    expect(noPass.body.error).toMatch(/passcode of at least 4/);
    const short = res();
    await play({ method: 'POST', body: { action: 'link', deal: { tp: tp() }, pass: 'abc' }, headers: sellerHeaders }, short);
    expect(short.statusCode).toBe(400);
    const made = res();
    await play({ method: 'POST', body: { action: 'link', deal: { tp: tp() }, pass: 'bear-1234' }, headers: sellerHeaders }, made);
    expect(made.statusCode).toBe(200);
    const tok = new URL(made.body.url).searchParams.get('deal');
    // The customer, with no site credentials at all.
    const pageR = res();
    await play({ method: 'GET', query: { deal: tok }, headers: HOST }, pageR);
    expect(pageR.statusCode).toBe(200);
    expect(pageR.body).toContain('needsPass = true');
    const wrong = res();
    await play({ method: 'POST', body: { action: 'compute', deal: tok, pass: '', inputs: null }, headers: HOST }, wrong);
    expect(wrong.statusCode).toBe(400);
    expect(wrong.body.error).toMatch(/passcode/i);
    const right = res();
    await play({ method: 'POST', body: { action: 'compute', deal: tok, pass: 'bear-1234', inputs: null }, headers: HOST }, right);
    expect(right.statusCode).toBe(200);
    expect(right.body.facts.dealName).toBe('Loco Bear');
    // Saving a new version is the seller's job too.
    const upd = res();
    await play({ method: 'POST', body: { action: 'update', edit: 'x', deal: { tp: tp() } }, headers: HOST }, upd);
    expect(upd.statusCode).toBe(401);
  });
});

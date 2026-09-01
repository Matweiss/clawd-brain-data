import { afterEach, describe, expect, it } from 'vitest';

const handler = require('../api/deal.js');
const secret = 'test-secret-that-is-long-enough-for-aes-256';

function res() {
  const out = { statusCode: 200, headers: {} };
  out.setHeader = (k, v) => { out.headers[k] = v; };
  out.status = (n) => { out.statusCode = n; return out; };
  out.json = (body) => { out.body = body; return out; };
  return out;
}

afterEach(() => { delete process.env.SCENARIO_SECRET; });

describe('/api/deal', () => {
  it('round-trips a Revenue Model deal through an opaque fourteen-day link', async () => {
    process.env.SCENARIO_SECRET = secret;
    const made = res();
    const tp = { dealName: 'Northline', termYears: 2, annualFees: [60000, 90000], locations: [1, 3], tournaments: [{ id: 't', name: 'Weekly', entryPrice: 10 }] };
    await handler({ method: 'POST', body: { deal: { tp, mg: { eng: 12, rake: 10 } } }, headers: { origin: 'https://roi.example', host: 'roi.example' } }, made);
    expect(made.statusCode).toBe(200);
    expect(made.body.expiresInDays).toBe(14);
    expect(made.body.url).toMatch(/^https:\/\/roi\.example\/\?deal=v1\./);
    expect(made.body.url).not.toContain('Northline');

    const token = new URL(made.body.url).searchParams.get('deal');
    const opened = res();
    await handler({ method: 'GET', query: { deal: token }, headers: { host: 'roi.example' } }, opened);
    expect(opened.statusCode).toBe(200);
    expect(opened.body.deal.kind).toBe('revenue-model');
    expect(opened.body.deal.tp).toEqual(tp);
    expect(opened.body.deal.mg).toEqual({ eng: 12, rake: 10 });
  });

  it('refuses a customer scenario token, a tampered token, and a cross-origin create', async () => {
    process.env.SCENARIO_SECRET = secret;
    const { createScenarioToken } = require('../lib/scenario-token');
    const wrongKind = res();
    await handler({ method: 'GET', query: { deal: createScenarioToken({ customer: 'Acme' }, secret) }, headers: {} }, wrongKind);
    expect(wrongKind.statusCode).toBe(400);
    expect(wrongKind.body.error).toMatch(/Not a deal link/);

    const good = createScenarioToken({ kind: 'revenue-model', tp: {} }, secret);
    const [v, iv, ct, tag] = good.split('.');
    const bad = res();
    await handler({ method: 'GET', query: { deal: [v, iv, ct.slice(0, 4) + (ct[4] === 'A' ? 'B' : 'A') + ct.slice(5), tag].join('.') }, headers: {} }, bad);
    expect(bad.statusCode).toBe(400);

    const denied = res();
    await handler({ method: 'POST', body: { deal: { tp: {} } }, headers: { origin: 'https://evil.example', host: 'roi.example' } }, denied);
    expect(denied.statusCode).toBe(403);
  });

  it('says so when links are not configured, and never leaks the deal into the URL', async () => {
    const off = res();
    await handler({ method: 'POST', body: { deal: { tp: { dealName: 'Secret Co' } } }, headers: { host: 'roi.example' } }, off);
    expect(off.statusCode).toBe(503);
    expect(JSON.stringify(off.body)).not.toContain('Secret Co');
  });
});

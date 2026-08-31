import { afterEach, describe, expect, it } from 'vitest';

const handler = require('../api/scenario.js');

function res() {
  const out = { statusCode: 200, headers: {} };
  out.setHeader = (k, v) => { out.headers[k] = v; };
  out.status = (n) => { out.statusCode = n; return out; };
  out.json = (body) => { out.body = body; return out; };
  return out;
}

afterEach(() => { delete process.env.SCENARIO_SECRET; });

describe('/api/scenario', () => {
  it('creates an opaque, expiring public URL for same-origin requests', async () => {
    process.env.SCENARIO_SECRET = 'test-secret-that-is-long-enough-for-aes-256';
    const response = res();
    await handler({ method: 'POST', body: { scenario: { customer: 'Acme' } }, headers: { origin: 'https://roi.example', host: 'roi.example' } }, response);
    expect(response.statusCode).toBe(200);
    expect(response.body.url).toMatch(/^https:\/\/roi\.example\/public\?scenario=v1\./);
    expect(response.body.url).not.toContain('Acme');
    expect(response.body.expiresInDays).toBe(7);
  });

  it('rejects cross-origin requests and missing configuration', async () => {
    process.env.SCENARIO_SECRET = 'test-secret-that-is-long-enough-for-aes-256';
    const denied = res();
    await handler({ method: 'POST', body: { scenario: {} }, headers: { origin: 'https://evil.example', host: 'roi.example' } }, denied);
    expect(denied.statusCode).toBe(403);
    delete process.env.SCENARIO_SECRET;
    const unavailable = res();
    await handler({ method: 'POST', body: { scenario: {} }, headers: { host: 'roi.example' } }, unavailable);
    expect(unavailable.statusCode).toBe(503);
  });
});

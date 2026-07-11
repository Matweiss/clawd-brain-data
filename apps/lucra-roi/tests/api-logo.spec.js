import { describe, it, expect } from 'vitest';

const handler = require('../api/logo.js');

function mockReq(query, method = 'GET') {
  return { method, query, headers: { origin: 'https://lucra-roi-calculator.vercel.app' } };
}

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k, v) { res.headers[k] = v; },
    status(code) { res.statusCode = code; return res; },
    json(data) { res.body = data; res.ended = true; return res; },
    send(data) { res.body = data; res.ended = true; return res; },
    end() { res.ended = true; return res; },
    ended: false,
  };
  return res;
}

describe('/api/logo contract tests', () => {
  it('rejects POST requests with 405', async () => {
    const req = mockReq({}, 'POST');
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it('returns 400 when no url or domain provided', async () => {
    const req = mockReq({});
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('url or domain');
  });

  it('handles OPTIONS preflight', async () => {
    const req = mockReq({}, 'OPTIONS');
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
  });

  it('rejects localhost URLs', async () => {
    const req = mockReq({ url: 'http://localhost/logo.png' });
    const res = mockRes();
    await handler(req, res);
    // Should get 400 (no valid candidates) or 404 (no logo found)
    expect([400, 404]).toContain(res.statusCode);
  });

  it('rejects non-http URLs', async () => {
    const req = mockReq({ url: 'file:///etc/passwd' });
    const res = mockRes();
    await handler(req, res);
    expect([400, 404]).toContain(res.statusCode);
  });

  it('rejects 127.0.0.1 URLs', async () => {
    const req = mockReq({ url: 'http://127.0.0.1/logo.png' });
    const res = mockRes();
    await handler(req, res);
    expect([400, 404]).toContain(res.statusCode);
  });

  it('builds candidates from domain query param', async () => {
    // This will try to fetch real URLs — we just verify it doesn't crash
    // and returns either success or 404 (no DNS resolution in test)
    const req = mockReq({ domain: 'nonexistent-test-domain-12345.invalid' });
    const res = mockRes();
    await handler(req, res);
    // Should get 404 since domain doesn't resolve
    expect(res.statusCode).toBe(404);
    expect(res.body.tried).toBeInstanceOf(Array);
  });
});

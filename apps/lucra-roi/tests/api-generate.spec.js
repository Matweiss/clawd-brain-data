import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock environment before requiring the handler
beforeEach(() => {
  process.env.GOOGLE_CLIENT_ID = 'test-client-id';
  process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
  process.env.GOOGLE_REFRESH_TOKEN = 'test-refresh-token';
  process.env.AGREEMENT_FOLDER_ID = 'test-folder-id';
});

// We test the handler's input validation without hitting Google APIs.
// The module is CommonJS so we can require it directly.
const handler = require('../api/generate.js');

function mockReq(body, method = 'POST') {
  return {
    method,
    body,
    headers: { origin: 'https://lucra-roi-calculator.vercel.app' },
  };
}

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k, v) { res.headers[k] = v; },
    status(code) { res.statusCode = code; return res; },
    json(data) { res.body = data; res.ended = true; return res; },
    end() { res.ended = true; return res; },
    ended: false,
  };
  return res;
}

describe('/api/generate contract tests', () => {
  it('rejects GET requests with 405', async () => {
    const req = mockReq(null, 'GET');
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it('handles OPTIONS preflight', async () => {
    const req = mockReq(null, 'OPTIONS');
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.ended).toBe(true);
  });

  it('rejects unknown template with 400', async () => {
    const req = mockReq({ template: 'nonexistent', tokens: { '{{CLIENT_NAME}}': 'Y' }, clientName: 'Test' });
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('Unknown template');
  });

  it('rejects empty tokens with 400', async () => {
    const req = mockReq({ template: 'core', tokens: {}, clientName: 'Test' });
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('No tokens');
  });

  it('accepts valid template names: trackman, core, minigames', async () => {
    // These will fail at Google API call, but should pass validation.
    // Use valid token keys per template to pass the allowlist.
    const validTokens = {
      trackman: { '[CLIENT NAME]': 'Test' },
      core: { '{{CLIENT_NAME}}': 'Test' },
      minigames: { '{{CLIENT_NAME}}': 'Test' },
    };
    for (const t of ['trackman', 'core', 'minigames']) {
      const req = mockReq({ template: t, tokens: validTokens[t], clientName: 'Test' });
      const res = mockRes();
      try {
        await handler(req, res);
      } catch (e) {
        // Expected: will fail at fetch to Google API
      }
      // Should not be 400 (template/token validation passed)
      expect(res.statusCode).not.toBe(400);
    }
  });

  it('rejects request body over 64KB', async () => {
    const bigTokens = {};
    for (let i = 0; i < 500; i++) {
      bigTokens[`{{TOKEN_${i}}}`] = 'A'.repeat(200);
    }
    const req = mockReq({ template: 'core', tokens: bigTokens, clientName: 'Test' });
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(413);
  });

  it('rejects disallowed non-empty origin with 403', async () => {
    const req = {
      method: 'POST',
      body: { template: 'core', tokens: { '{{CLIENT_NAME}}': 'Test' }, clientName: 'Test' },
      headers: { origin: 'https://evil.example.com' },
    };
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toContain('Origin not allowed');
  });

  it('allows requests with no origin header (same-origin)', async () => {
    const req = {
      method: 'POST',
      body: { template: 'core', tokens: { '{{CLIENT_NAME}}': 'Test' }, clientName: 'Test' },
      headers: {},
    };
    const res = mockRes();
    try {
      await handler(req, res);
    } catch (e) {
      // Will fail at Google API — that's fine, it passed origin check
    }
    expect(res.statusCode).not.toBe(403);
  });

  it('rejects unexpected token keys for trackman template with 400', async () => {
    const req = mockReq({
      template: 'trackman',
      tokens: { '{{CLIENT_NAME}}': 'Test', '[CLIENT NAME]': 'Test' },
      clientName: 'Test',
    });
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('Unexpected token keys');
  });

  it('rejects unexpected token keys for core template with 400', async () => {
    const req = mockReq({
      template: 'core',
      tokens: { '[BOGUS_KEY]': 'Test', '{{CLIENT_NAME}}': 'Test' },
      clientName: 'Test',
    });
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('Unexpected token keys');
  });

  it('accepts all valid trackman token keys', async () => {
    const tokens = {};
    ['[CLIENT NAME]', '[EFFECTIVE DATE]', '[PACKAGE NAME]', '[LIST PRICE AMOUNT]',
     '[MONTHLY PER BAY FEE]', '[NUMBER OF BAYS]', '[TOTAL MONTHLY FEE]',
     '[IMPLEMENTATION FEE AMOUNT]', '[CLIENT REVENUE SHARE %]', '[LUCRA REVENUE SHARE %]',
     '[LICENSE TERM YEARS]', '[GO-LIVE DATE]', '[CLIENT SIGNATURE NAME]',
     '[CHK_A]', '[CHK_B]', '[CHK_C]', '[CHK_D]', '[CHK_E]', '[CHK_IMPL]',
    ].forEach((k) => { tokens[k] = 'val'; });
    const req = mockReq({ template: 'trackman', tokens, clientName: 'Test' });
    const res = mockRes();
    try { await handler(req, res); } catch (e) { /* Google API */ }
    expect(res.statusCode).not.toBe(400);
  });

  it('accepts all valid core/minigames token keys', async () => {
    const tokens = {};
    ['{{CLIENT_NAME}}', '{{EFFECTIVE_DATE}}', '{{LICENSE_FEE}}', '{{DISCOUNT_PERCENTAGE}}',
     '{{AMOUNT_DUE}}', '{{CLIENT_REVENUE_SHARE}}', '{{LUCRA_REVENUE_SHARE}}',
     '{{LICENSE_TERM}}', '{{KICKOFF_DATE}}', '{{DELIVERY_DATE}}', '{{TARGET_DELIVERY_DATE}}',
     '{{DELIVERY_COST_REDUCTION_PERCENTAGE}}',
     '{{CHK_A}}', '{{CHK_B}}', '{{CHK_C}}', '{{CHK_D}}', '{{CHK_E}}', '{{CHK_F}}',
     '{{CHK_G}}', '{{CHK_H}}', '{{CHK_I}}',
     '{{A_monthly}}', '{{B_monthly}}', '{{C_monthly}}', '{{D_monthly_}}',
     '{{E_monthly}}', '{{F_monthly}}',
     '{{strat_imp_price}}', '{{growth_imp_price}}', '{{launch_imp_price}}',
     '{{Implementation_name}}', '{{NOTES}}',
    ].forEach((k) => { tokens[k] = 'val'; });
    for (const tpl of ['core', 'minigames']) {
      const req = mockReq({ template: tpl, tokens, clientName: 'Test' });
      const res = mockRes();
      try { await handler(req, res); } catch (e) { /* Google API */ }
      expect(res.statusCode).not.toBe(400);
    }
  });

  it('sanitizes client name in generated filename', async () => {
    // We can't test the full flow without Google APIs, but we verify
    // the handler doesn't error on names with special characters
    const req = mockReq({
      template: 'core',
      tokens: { '{{CLIENT_NAME}}': 'Y' },
      clientName: '<script>alert("xss")</script> & Co.'
    });
    const res = mockRes();
    try {
      await handler(req, res);
    } catch (e) {
      // Will fail at Google API, but validation should pass
    }
    // Should not be 400
    expect(res.statusCode).not.toBe(400);
  });
});

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
const {
  normalizeAnnualSchedule,
  findStandardFeeTable,
  additionalYearTextRequests,
  moneyText,
} = handler._test;

function mockCell(startIndex, text = '') {
  return {
    content: [{
      startIndex,
      paragraph: { elements: [{ textRun: { content: text } }] },
    }],
  };
}

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
  it('normalizes a reconciled three-year standard agreement schedule', () => {
    expect(normalizeAnnualSchedule([
      { year: 1, licenseFee: 180000, amountDue: 162000, discountMode: 'pct', discountValue: 10 },
      { year: 2, licenseFee: 180000, amountDue: 150000, discountMode: 'flat', discountValue: 30000 },
      { year: 3, licenseFee: 195000, amountDue: 195000, discountMode: 'pct', discountValue: 0 },
    ], 'core')).toEqual([
      { year: 1, licenseFee: 180000, amountDue: 162000, monthlyEquivalent: 13500, discountMode: 'pct', discountValue: 10 },
      { year: 2, licenseFee: 180000, amountDue: 150000, monthlyEquivalent: 12500, discountMode: 'flat', discountValue: 30000 },
      { year: 3, licenseFee: 195000, amountDue: 195000, monthlyEquivalent: 16250, discountMode: 'pct', discountValue: 0 },
    ]);
  });

  it('rejects annual schedules whose discount and amount due do not reconcile', () => {
    expect(() => normalizeAnnualSchedule([
      { year: 1, licenseFee: 180000, amountDue: 170000, discountMode: 'pct', discountValue: 10 },
    ], 'core')).toThrow('totals do not reconcile');
  });

  it('finds the standard pricing table by its header row', () => {
    const table = {
      tableRows: [{
        tableCells: ['License Fee', 'Discount', 'Implementation', 'Notes', 'Amount Due']
          .map((text, index) => mockCell(20 + index, text)),
      }],
    };
    expect(findStandardFeeTable({ body: { content: [{ startIndex: 7, table }] } })).toEqual({ startIndex: 7, table });
  });

  it('builds cell inserts for every additional agreement year', () => {
    const blankRow = (offset) => ({ tableCells: Array.from({ length: 5 }, (_, index) => mockCell(offset + index * 10)) });
    const table = { tableRows: [{ tableCells: [] }, blankRow(100), blankRow(200), blankRow(300)] };
    const schedule = normalizeAnnualSchedule([
      { year: 1, licenseFee: 180000, amountDue: 162000, discountMode: 'pct', discountValue: 10 },
      { year: 2, licenseFee: 180000, amountDue: 150000, discountMode: 'flat', discountValue: 30000 },
      { year: 3, licenseFee: 195000, amountDue: 195000, discountMode: 'pct', discountValue: 0 },
    ], 'core');
    const requests = additionalYearTextRequests(table, schedule);
    expect(requests).toHaveLength(10);
    expect(requests.map((request) => request.insertText.text)).toEqual([
      'USD 180,000/year', 'USD 30,000', '—', 'Monthly equivalent: USD 12,500/month', 'USD 150,000/year 2',
      'USD 195,000/year', '0%', '—', 'Monthly equivalent: USD 16,250/month', 'USD 195,000/year 3',
    ]);
    expect(requests[0].insertText.location.index).toBe(200);
    expect(moneyText(12500.5)).toBe('12,500.50');
  });

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

  it('accepts valid template names: trackman, core, minigames, recapture', async () => {
    // These will fail at Google API call, but should pass validation.
    // Use valid token keys per template to pass the allowlist.
    const validTokens = {
      trackman: { '[CLIENT NAME]': 'Test' },
      core: { '{{CLIENT_NAME}}': 'Test' },
      minigames: { '{{CLIENT_NAME}}': 'Test' },
      recapture: { '{{CLIENT_LEGAL_NAME}}': 'Test' },
    };
    for (const t of ['trackman', 'core', 'minigames', 'recapture']) {
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

  it('allows this project\'s protected Vercel preview origins', async () => {
    const req = mockReq({ template: 'core', tokens: {}, clientName: 'Preview' });
    req.headers.origin = 'https://lucra-roi-calculator-abc123-mats-projects-bc1a3570.vercel.app';
    req.headers['x-forwarded-for'] = '203.0.113.213';
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('No tokens');
    expect(res.headers['Access-Control-Allow-Origin']).toBe(req.headers.origin);
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

  it('accepts the complete recapture template token contract', async () => {
    const tokens = {};
    [
      '{{CLIENT_LEGAL_NAME}}', '{{EFFECTIVE_DATE}}',
      '{{CHK_A}}', '{{A_MONTHLY}}', '{{CHK_B}}', '{{B_MONTHLY}}',
      '{{CHK_C}}', '{{C_MONTHLY}}', '{{CHK_D}}', '{{D_MONTHLY}}',
      '{{CHK_E}}', '{{E_MONTHLY}}', '{{CHK_F}}', '{{F_MONTHLY}}',
      '{{CHK_G}}', '{{STRATEGIC_FEE}}', '{{CHK_H}}', '{{GROWTH_FEE}}',
      '{{CHK_I}}', '{{LAUNCH_FEE}}', '{{YEAR_1_LICENSE_FEE}}',
      '{{IMPLEMENTATION_PACKAGE}}', '{{YEAR_1_NOTES}}', '{{YEAR_1_MINIMUM_DUE}}',
      '{{YEAR_2_LICENSE_FEE}}', '{{YEAR_2_NOTES}}', '{{YEAR_2_MINIMUM_DUE}}',
      '{{YEAR_3_LICENSE_FEE}}', '{{YEAR_3_NOTES}}', '{{YEAR_3_MINIMUM_DUE}}',
      '{{LICENSE_TERM}}', '{{DELIVERY_DATE}}', '{{TOTAL_LICENSE_COMMITMENT}}',
      '{{CLIENT_RECAP_PCT}}', '{{LUCRA_RECAP_PCT}}', '{{LICENSE_PCT}}',
      '{{CLIENT_POST_PCT}}', '{{LUCRA_POST_PCT}}', '{{RENEWAL_ESCALATOR_PCT}}',
      '{{KICKOFF_DATE}}', '{{GTM_DOLLARS}}',
    ].forEach((key) => { tokens[key] = 'value'; });
    const req = mockReq({ template: 'recapture', tokens, clientName: 'Test' });
    const res = mockRes();
    try { await handler(req, res); } catch (e) { /* Google API */ }
    expect(res.statusCode).not.toBe(400);
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

  it('shares generated agreements as read-only for anyone with the link', async () => {
    const originalFetch = globalThis.fetch;
    const permissionBodies = [];

    globalThis.fetch = vi.fn(async (url, options = {}) => {
      const target = String(url);
      if (target.includes('oauth2.googleapis.com/token')) {
        return new Response(JSON.stringify({ access_token: 'test-access-token' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (target.includes('/copy?')) {
        return new Response(JSON.stringify({ id: 'doc-123', webViewLink: 'https://docs.google.com/document/d/doc-123/edit' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (target.includes('/permissions?')) {
        permissionBodies.push(JSON.parse(options.body));
        return new Response(JSON.stringify({ id: 'permission-123' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (target.includes(':batchUpdate')) {
        return new Response('{}', { status: 200 });
      }
      if (target.includes('/export?')) {
        return new Response(new Uint8Array([1, 2, 3]), { status: 200 });
      }
      throw new Error(`Unexpected fetch: ${target}`);
    });

    try {
      const req = mockReq({
        template: 'core',
        tokens: { '{{CLIENT_NAME}}': 'Editable Agreement' },
        clientName: 'Editable Agreement',
      });
      req.headers['x-forwarded-for'] = '203.0.113.42';
      const res = mockRes();
      await handler(req, res);

      expect(res.statusCode).toBe(200);
      expect(permissionBodies).toEqual([
        { type: 'anyone', role: 'reader', allowFileDiscovery: false },
      ]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('expands and fills the copied standard agreement for a three-year schedule', async () => {
    const originalFetch = globalThis.fetch;
    const batchBodies = [];
    const headerRow = {
      tableCells: ['License Fee', 'Discount', 'Implementation', 'Notes', 'Amount Due']
        .map((text, index) => mockCell(20 + index, text)),
    };
    const dataRow = (offset) => ({ tableCells: Array.from({ length: 5 }, (_, index) => mockCell(offset + index * 10)) });
    const documentWithRows = (rows) => ({
      body: { content: [{ startIndex: 10, table: { tableRows: [headerRow, dataRow(100), ...rows] } }] },
    });
    let documentReads = 0;

    globalThis.fetch = vi.fn(async (url, options = {}) => {
      const target = String(url);
      if (target.includes('oauth2.googleapis.com/token')) return new Response(JSON.stringify({ access_token: 'test-access-token' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (target.includes('/copy?')) return new Response(JSON.stringify({ id: 'doc-schedule', webViewLink: 'https://docs.google.com/document/d/doc-schedule/edit' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (target.includes('/permissions?')) return new Response(JSON.stringify({ id: 'permission' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (target === 'https://docs.googleapis.com/v1/documents/doc-schedule') {
        documentReads += 1;
        const doc = documentReads === 1 ? documentWithRows([]) : documentWithRows([dataRow(200), dataRow(300)]);
        return new Response(JSON.stringify(doc), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (target.includes(':batchUpdate')) {
        batchBodies.push(JSON.parse(options.body));
        return new Response('{}', { status: 200 });
      }
      if (target.includes('/export?')) return new Response(new Uint8Array([1, 2, 3]), { status: 200 });
      throw new Error(`Unexpected fetch: ${target}`);
    });

    try {
      const req = mockReq({
        template: 'core',
        clientName: 'Multi-Year QA',
        tokens: { '{{CLIENT_NAME}}': 'Multi-Year QA' },
        annualSchedule: [
          { year: 1, licenseFee: 180000, amountDue: 162000, discountMode: 'pct', discountValue: 10 },
          { year: 2, licenseFee: 180000, amountDue: 150000, discountMode: 'flat', discountValue: 30000 },
          { year: 3, licenseFee: 195000, amountDue: 195000, discountMode: 'pct', discountValue: 0 },
        ],
      });
      req.headers['x-forwarded-for'] = '203.0.113.212';
      const res = mockRes();
      await handler(req, res);

      expect(res.statusCode).toBe(200);
      expect(documentReads).toBe(2);
      expect(batchBodies).toHaveLength(3);
      expect(batchBodies[1].requests).toHaveLength(2);
      expect(batchBodies[1].requests[0].insertTableRow.tableCellLocation).toEqual({
        tableStartLocation: { index: 10 }, rowIndex: 1, columnIndex: 0,
      });
      expect(batchBodies[2].requests).toHaveLength(10);
      expect(batchBodies[2].requests.at(-1).insertText.text).toBe('USD 195,000/year 3');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('shares recapture agreements as undiscoverable editors with both Lucra domains', async () => {
    const originalFetch = globalThis.fetch;
    const permissionBodies = [];
    globalThis.fetch = vi.fn(async (url, options = {}) => {
      const target = String(url);
      if (target.includes('oauth2.googleapis.com/token')) return new Response(JSON.stringify({ access_token: 'test-access-token' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (target.includes('/copy?')) return new Response(JSON.stringify({ id: 'doc-456', webViewLink: 'https://docs.google.com/document/d/doc-456/edit' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (target.includes('/permissions?')) { permissionBodies.push(JSON.parse(options.body)); return new Response(JSON.stringify({ id: 'permission' }), { status: 200, headers: { 'Content-Type': 'application/json' } }); }
      if (target.includes(':batchUpdate')) return new Response('{}', { status: 200 });
      if (target.includes('/export?')) return new Response(new Uint8Array([1, 2, 3]), { status: 200 });
      throw new Error(`Unexpected fetch: ${target}`);
    });
    try {
      const req = mockReq({ template: 'recapture', tokens: { '{{CLIENT_LEGAL_NAME}}': 'Internal Agreement' }, clientName: 'Internal Agreement' });
      req.headers['x-forwarded-for'] = '203.0.113.99';
      const res = mockRes();
      await handler(req, res);
      expect(res.statusCode).toBe(200);
      expect(permissionBodies).toEqual([
        { type: 'domain', domain: 'lucrasports.com', role: 'writer', allowFileDiscovery: false },
        { type: 'domain', domain: 'playlucra.com', role: 'writer', allowFileDiscovery: false },
      ]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

import { afterEach, describe, expect, it } from 'vitest';

const handler = require('../api/public.js');
const { createScenarioToken } = require('../lib/scenario-token.js');
const secret = 'test-secret-that-is-long-enough-for-aes-256';

function res() {
  const out = { statusCode: 200, headers: {} };
  out.setHeader = (k, v) => { out.headers[k] = v; };
  out.status = (n) => { out.statusCode = n; return out; };
  out.end = (body) => { out.body = body; return out; };
  return out;
}

afterEach(() => { delete process.env.SCENARIO_SECRET; });

describe('/public scenario', () => {
  it('renders a sanitized, noindex, read-only scenario', async () => {
    process.env.SCENARIO_SECRET = secret;
    const token = createScenarioToken({ customer: '<script>Acme</script>', modelVersion: 'v-test', summary: [{ label: 'Net', value: 100, format: 'money' }], assumptions: [{ label: 'Source', value: 'Customer input' }] }, secret);
    const response = res();
    await handler({ method: 'GET', query: { scenario: token } }, response);
    expect(response.statusCode).toBe(200);
    expect(response.headers['X-Robots-Tag']).toContain('noindex');
    expect(response.body).toContain('&lt;script&gt;Acme&lt;/script&gt;');
    expect(response.body).not.toContain('<script>Acme</script>');
    expect(response.body).toContain('Planning estimate only');
  });

  it('rejects invalid tokens without exposing calculator internals', async () => {
    process.env.SCENARIO_SECRET = secret;
    const response = res();
    await handler({ method: 'GET', query: { scenario: 'invalid' } }, response);
    expect(response.statusCode).toBe(400);
    expect(response.body).not.toContain('tab-digitalmedia');
  });
});

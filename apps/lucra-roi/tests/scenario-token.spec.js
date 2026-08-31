import { describe, expect, it } from 'vitest';

const { createScenarioToken, parseScenarioToken } = require('../lib/scenario-token.js');
const secret = 'test-secret-that-is-long-enough-for-aes-256';

describe('secure scenario tokens', () => {
  it('round-trips an opaque scenario payload', () => {
    const token = createScenarioToken({ customer: 'Acme', summary: [{ label: 'ROI', value: 2 }] }, secret, { now: 1000, ttlSeconds: 300 });
    expect(token).not.toContain('Acme');
    expect(parseScenarioToken(token, secret, { now: 2000 }).data.customer).toBe('Acme');
  });

  it('rejects expired and tampered tokens', () => {
    const token = createScenarioToken({ customer: 'Acme' }, secret, { now: 1000, ttlSeconds: 300 });
    expect(() => parseScenarioToken(token, secret, { now: 302001 })).toThrow(/expired/i);
    expect(() => parseScenarioToken(`${token.slice(0, -1)}x`, secret, { now: 2000 })).toThrow();
  });

  it('requires a strong server-side secret', () => {
    expect(() => createScenarioToken({}, 'short')).toThrow(/at least 32 characters/i);
  });
});

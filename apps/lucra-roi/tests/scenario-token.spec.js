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
    // Tamper inside the ciphertext, not at the final character. The token's last
    // base64url character carries only two significant bits and takes just four
    // values, so swapping it decodes to identical bytes about a quarter of the
    // time and the "tampered" token is not tampered at all.
    const [v, iv, ct, tag] = token.split('.');
    const flipped = ct.slice(0, 4) + (ct[4] === 'A' ? 'B' : 'A') + ct.slice(5);
    expect(flipped).not.toBe(ct);
    expect(() => parseScenarioToken([v, iv, flipped, tag].join('.'), secret, { now: 2000 })).toThrow();
  });

  it('requires a strong server-side secret', () => {
    expect(() => createScenarioToken({}, 'short')).toThrow(/at least 32 characters/i);
  });
});

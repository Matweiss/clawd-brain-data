import { describe, expect, it } from 'vitest';
import { DEAL_STATE_VERSION, parseDealState } from '../src/state';

describe('versioned deal state', () => {
  it('accepts the current schema and removes unsupported field values', () => {
    const state = parseDealState(JSON.stringify({
      version: DEAL_STATE_VERSION,
      updatedAt: '2026-07-12T00:00:00.000Z',
      fields: { venue: 'Range One', visits: 4000, enabled: true, unsafe: { nested: true } }
    }));
    expect(state?.fields).toEqual({ venue: 'Range One', visits: 4000, enabled: true });
  });

  it('fails closed for corrupt or unknown versions', () => {
    expect(parseDealState('{nope')).toBeNull();
    expect(parseDealState(JSON.stringify({ version: 99, updatedAt: '', fields: {} }))).toBeNull();
  });
});

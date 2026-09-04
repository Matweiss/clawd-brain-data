import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { extractFromApp, extractFromMirror, normalise } from './tp-extract.js';

// Closes the standing risk that tests/calc-functions.js is a hand-copy of the
// shipped formulas with nothing verifying the two stay in sync. If a Tournament
// Payoff formula changes in api/app.html without the mirror being updated, this
// fails rather than letting a green suite run over stale math.
describe('Tournament Payoff formula drift guard', () => {
  it('the mirrored pure block matches the code shipped in app.html', () => {
    expect(normalise(extractFromMirror())).toBe(normalise(extractFromApp()));
  });

  it('the server engine in lib/revenue-engine.js matches the code shipped in app.html', () => {
    expect(normalise(extractFromMirror(fileURLToPath(new URL('../lib/revenue-engine.js', import.meta.url))))).toBe(normalise(extractFromApp()));
  });

  it('both markers are present on both sides', () => {
    expect(extractFromApp().length).toBeGreaterThan(1000);
    expect(extractFromMirror().length).toBeGreaterThan(1000);
  });
});

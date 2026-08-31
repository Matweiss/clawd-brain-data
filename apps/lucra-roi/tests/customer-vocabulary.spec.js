import { describe, it, expect } from 'vitest';
import calc from './calc-functions.js';

const { TPcustomerProjection, TP_DEFAULTS } = calc;

// The lucra-model-onepager skill blocks this vocabulary on anything a partner
// sees. Grep taken from that skill, applied to the customer-facing projection
// so a future field cannot reintroduce betting jargon into a shared artifact.
const BLOCKED = /cash|wager|betting|\bbet\b|gambl|casino|prize money|stakes|buy-in|payout|\brake\b|\bhandle\b/i;

const deal = (o = {}) => Object.assign(JSON.parse(JSON.stringify(TP_DEFAULTS)), {
  dealName: 'Fairway Social',
  tournaments: [
    { id: 'a', name: 'Weekly open', entryPrice: 10, eventsPerMonth: 4, participationMode: 'shared', rebuyMode: 'avg', rebuys: 2, isCash: false, rewardFaceValue: 500, customerCashCost: 200 },
    { id: 'b', name: 'Championship', entryPrice: 25, eventsPerMonth: 1, participationMode: 'shared', rebuyMode: 'pct', rebuyPct: 40, isCash: true, cashPrizeAmount: 1000 },
  ],
}, o);

describe('Customer-facing vocabulary', () => {
  it('the customer projection contains no blocked terms', () => {
    const json = JSON.stringify(TPcustomerProjection(deal()));
    const hit = json.match(BLOCKED);
    expect(hit, hit ? `blocked term "${hit[0]}" in ${json}` : '').toBeNull();
  });

  it('a real-money tournament reads as a prize pool, not a cash prize', () => {
    const p = TPcustomerProjection(deal());
    expect(p.tournaments[1].rewardLabel).toBe('$1,000 prize pool');
  });

  it('a merchandise reward still reads as a value reward', () => {
    expect(TPcustomerProjection(deal()).tournaments[0].rewardLabel).toBe('$500 value reward');
  });

  it('holds even when the operator names a tournament with blocked words', () => {
    // The name is the operator's own text, so it is passed through. This test
    // documents that the guard covers generated labels, not user-entered names.
    const p = TPcustomerProjection(deal({ tournaments: [{ id: 'x', name: 'Cash Dash', entryPrice: 5, eventsPerMonth: 1, rebuyMode: 'avg', isCash: true, cashPrizeAmount: 100 }] }));
    expect(p.tournaments[0].rewardLabel).not.toMatch(BLOCKED);
  });
});

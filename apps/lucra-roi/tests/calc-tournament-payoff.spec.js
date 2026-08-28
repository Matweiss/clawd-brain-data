import { describe, it, expect } from 'vitest';
import calc from './calc-functions.js';

const { TPcalculate, TPparticipants, TPsplitRates, TPvalidate, TPcustomerProjection, TP_DEFAULTS } = calc;

// One tournament: 100 participants, no rebuys, $10 entry, 4 events, $200 cash
// cost per event -> handle 4000, prize 800, net 3200.
const base = (o = {}) => Object.assign(JSON.parse(JSON.stringify(TP_DEFAULTS)), {
  licenseFee: 60000,
  participants: 100,
  tournaments: [{ id: 't', name: 'Open', entryPrice: 10, eventsPerMonth: 4, rebuys: 0, isCash: false, rewardFaceValue: 500, customerCashCost: 200 }],
}, o);

describe('Volume model', () => {
  it('flat applies one number to every month with no baked-in growth', () => {
    const s = base();
    expect(TPparticipants(s, 1)).toBe(100);
    expect(TPparticipants(s, 7)).toBe(100);
    expect(TPparticipants(s, 12)).toBe(100);
  });

  it('ramp interpolates linearly then holds at plateau', () => {
    const s = base({ volumeMode: 'ramp', rampStart: 50, rampPlateau: 200, rampMonths: 6 });
    expect(TPparticipants(s, 1)).toBe(50);
    expect(TPparticipants(s, 3)).toBeCloseTo(50 + 150 * 2 / 5, 9);
    expect(TPparticipants(s, 6)).toBe(200);
    expect(TPparticipants(s, 12)).toBe(200);
  });

  it('a one-month ramp starts at plateau instead of dividing by zero', () => {
    expect(TPparticipants(base({ volumeMode: 'ramp', rampMonths: 1, rampPlateau: 200 }), 1)).toBe(200);
  });

  it('a declining ramp is preserved rather than clamped', () => {
    const s = base({ volumeMode: 'ramp', rampStart: 200, rampPlateau: 50, rampMonths: 6 });
    expect(TPparticipants(s, 6)).toBe(50);
    expect(TPparticipants(s, 3)).toBeLessThan(200);
  });
});

describe('Entries, handle and prize cost', () => {
  it('entries per event are participants times one plus rebuys', () => {
    expect(TPcalculate(base()).months[0].detail[0].entriesPerEvent).toBe(100);
    const withRebuys = base({ tournaments: [{ name: 'R', entryPrice: 10, eventsPerMonth: 4, rebuys: 1.5, customerCashCost: 0 }] });
    expect(TPcalculate(withRebuys).months[0].detail[0].entriesPerEvent).toBe(250);
  });

  it('handle is entries times price times events', () => {
    expect(TPcalculate(base()).months[0].handle).toBe(4000);
  });

  it('prize cost scales with events per month, not participants', () => {
    expect(TPcalculate(base()).months[0].prizeCost).toBe(800);
    const moreParticipants = TPcalculate(base({ participants: 500 })).months[0];
    expect(moreParticipants.prizeCost).toBe(800);
    const moreEvents = TPcalculate(base({ tournaments: [{ name: 'O', entryPrice: 10, eventsPerMonth: 8, rebuys: 0, customerCashCost: 200 }] })).months[0];
    expect(moreEvents.prizeCost).toBe(1600);
  });

  it('a cash tournament uses the single cash prize amount for both roles', () => {
    const s = base({ tournaments: [{ name: 'C', entryPrice: 10, eventsPerMonth: 3, rebuys: 0, isCash: true, cashPrizeAmount: 300, customerCashCost: 999, rewardFaceValue: 111 }] });
    expect(TPcalculate(s).months[0].prizeCost).toBe(900);
    expect(TPcustomerProjection(s).tournaments[0].rewardLabel).toBe('$300 cash prize');
  });

  it('a non-cash tournament advertises face value but charges cash cost', () => {
    const p = TPcustomerProjection(base());
    expect(p.tournaments[0].rewardLabel).toBe('$500 value reward');
    expect(TPcalculate(base()).months[0].prizeCost).toBe(800);
  });
});

describe('Prize cost is deducted before the split', () => {
  it('net revenue is handle minus prize cost', () => {
    expect(TPcalculate(base({ licenseFee: 1e6 })).months[0].netRevenue).toBe(3200);
  });

  it('all three parties fund prizes pro rata', () => {
    const m = TPcalculate(base({ licenseFee: 1e6 })).months[0];
    expect(m.toLicense).toBe(1600);
    expect(m.toOperator).toBe(1280);
    expect(m.toLucra).toBe(320);
  });

  it('a loss-making month floors net at zero but still reports raw handle and cost', () => {
    const s = base({ licenseFee: 1e6, tournaments: [{ name: 'L', entryPrice: 1, eventsPerMonth: 1, rebuys: 0, customerCashCost: 5000 }] });
    const m = TPcalculate(s).months[0];
    expect(m.netRevenue).toBe(0);
    expect(m.handle).toBe(100);
    expect(m.prizeCost).toBe(5000);
  });
});

describe('Split modes', () => {
  it('standard recapture is 50 / 40 / 10', () => {
    expect(TPsplitRates(base())).toMatchObject({ credit: 0.5, operator: 0.4, lucra: 0.1 });
  });

  it('aggressive sweep sends 90 to licence and nothing to the operator', () => {
    const m = TPcalculate(base({ splitMode: 'sweep', licenseFee: 1e6 })).months[0];
    expect(m.toLicense).toBeCloseTo(2880, 9);
    expect(m.toOperator).toBe(0);
    expect(m.toLucra).toBeCloseTo(320, 9);
  });

  it('custom percentages are honoured', () => {
    const m = TPcalculate(base({ splitMode: 'custom', custom: { credit: 60, operator: 25, lucra: 15 }, licenseFee: 1e6 })).months[0];
    expect(m.toLicense).toBeCloseTo(1920, 9);
    expect(m.toOperator).toBeCloseTo(800, 9);
    expect(m.toLucra).toBeCloseTo(480, 9);
  });

  it('a custom split that does not sum to 100 is rejected rather than normalised', () => {
    const s = base({ splitMode: 'custom', custom: { credit: 60, operator: 30, lucra: 15 } });
    expect(TPvalidate(s)[0]).toMatch(/sum to 100/);
    expect(TPcalculate(s).months).toHaveLength(0);
  });

  it('a zero licence share points the user at the free licence toggle', () => {
    const s = base({ splitMode: 'custom', custom: { credit: 0, operator: 90, lucra: 10 } });
    expect(TPvalidate(s).join(' ')).toMatch(/free licence toggle/);
  });
});

describe('Mid-month retirement', () => {
  // 3200 net per month, 50% credit -> 1600 per month. A 4000 fee retires in month 3.
  const r = () => TPcalculate(base({ licenseFee: 4000 }));

  it('credits only what is left in the clearing month', () => {
    const months = r().months;
    expect(months[0].toLicense).toBe(1600);
    expect(months[1].toLicense).toBe(1600);
    expect(months[2].toLicense).toBe(800);
  });

  it('redirects the rest of the clearing month to the operator', () => {
    const m = r().months[2];
    expect(m.split).toBe('Crossover');
    expect(m.toOperator).toBeCloseTo(1600 * 0.4 + 1600 * 0.9, 9);
  });

  it('pays the operator the post-payoff share for the remaining months', () => {
    const m = r().months[3];
    expect(m.split).toBe('Post-payoff');
    expect(m.toOperator).toBeCloseTo(3200 * 0.9, 9);
    expect(m.toLicense).toBe(0);
  });

  it('reports a fractional payoff month', () => {
    expect(r().payoffMonth).toBeCloseTo(2.5, 9);
    expect(r().balanceDue).toBe(0);
  });

  it('nothing is lost in any month, crossover included', () => {
    r().months.forEach((m) => {
      expect(m.toLicense + m.toOperator + m.toLucra).toBeCloseTo(m.netRevenue, 6);
    });
  });

  it('never credits more than the fee', () => {
    expect(r().cumulativeLicense).toBeCloseTo(4000, 6);
  });
});

describe('A deal that never retires', () => {
  const r = () => TPcalculate(base({ licenseFee: 500000 }));

  it('reports no payoff month rather than a false one', () => {
    expect(r().payoffMonth).toBeNull();
  });

  it('reports the year-end balance due', () => {
    expect(r().balanceDue).toBeCloseTo(500000 - 1600 * 12, 6);
  });

  it('never pays the operator the post-payoff share', () => {
    r().months.forEach((m) => expect(m.split).toBe('Payoff'));
  });
});

describe('Free licence', () => {
  const r = () => TPcalculate(base({ freeLicense: true }));

  it('zeroes the fee and removes the licence bucket entirely', () => {
    expect(r().licenseFee).toBe(0);
    expect(r().free).toBe(true);
    r().months.forEach((m) => expect(m.toLicense).toBe(0));
  });

  it('splits net revenue between operator and Lucra only', () => {
    const m = r().months[0];
    expect(m.toOperator).toBeCloseTo(3200 * 0.9, 9);
    expect(m.toLucra).toBeCloseTo(3200 * 0.1, 9);
    expect(m.toOperator + m.toLucra).toBeCloseTo(m.netRevenue, 9);
  });

  it('reports no payoff month and no balance due', () => {
    expect(r().payoffMonth).toBeNull();
    expect(r().balanceDue).toBe(0);
  });

  it('ignores an invalid custom split because there is nothing to credit', () => {
    const s = base({ freeLicense: true, splitMode: 'custom', custom: { credit: 0, operator: 0, lucra: 0 } });
    expect(TPvalidate(s)).toEqual([]);
  });
});

describe('Customer-safe projection', () => {
  it('returns exactly the whitelisted keys and nothing else', () => {
    const p = TPcustomerProjection(base());
    expect(Object.keys(p).sort()).toEqual(['dealName', 'tournaments']);
    expect(Object.keys(p.tournaments[0]).sort()).toEqual(['entryPrice', 'frequencyLabel', 'name', 'rebuyLabel', 'rewardLabel']);
  });

  it('never carries licence fee, split or cash cost through, even when set', () => {
    const json = JSON.stringify(TPcustomerProjection(base({ licenseFee: 987654, splitMode: 'sweep' })));
    expect(json).not.toContain('987654');
    expect(json).not.toContain('licenseFee');
    expect(json).not.toContain('customerCashCost');
    expect(json).not.toContain('sweep');
    expect(json).not.toContain('200'); // the cash cost value
  });

  it('describes the rebuy structure in customer language', () => {
    expect(TPcustomerProjection(base()).tournaments[0].rebuyLabel).toBe('Single entry');
    const withRebuys = base({ tournaments: [{ name: 'R', entryPrice: 10, eventsPerMonth: 2, rebuys: 3, rewardFaceValue: 100 }] });
    expect(TPcustomerProjection(withRebuys).tournaments[0].rebuyLabel).toBe('Up to 3 rebuys');
    expect(TPcustomerProjection(withRebuys).tournaments[0].frequencyLabel).toBe('2x per month');
  });
});

describe('Model shape and guards', () => {
  it('always produces twelve months', () => {
    expect(TPcalculate(base()).months).toHaveLength(12);
  });

  it('requires a fee or the free toggle', () => {
    expect(TPvalidate(base({ licenseFee: 0 })).join(' ')).toMatch(/licence fee/i);
  });

  it('requires at least one tournament type', () => {
    expect(TPvalidate(base({ tournaments: [] })).join(' ')).toMatch(/at least one tournament/i);
  });

  it('rejects a post-payoff split that does not sum to 100', () => {
    expect(TPvalidate(base({ post: { operator: 80, lucra: 10 } })).join(' ')).toMatch(/Post-payoff split/);
  });
});

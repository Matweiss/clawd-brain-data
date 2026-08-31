import { describe, it, expect } from 'vitest';
import calc from './calc-functions.js';

const {
  TPcalculate, TPvalidate, TPcustomerProjection, TPstate, TPsplitRates,
  TPrampFactor, TPavgRamp, TPreach, TPtypeParticipants, TPentriesPerEvent, TP_DEFAULTS,
} = calc;

// One tournament: 100 participants, no rebuys, $10 entry, 4 events, $200 cash
// cost per event -> entries value 4000, prize 800, net 3200.
const base = (o = {}) => Object.assign(JSON.parse(JSON.stringify(TP_DEFAULTS)), {
  termYears: 1,
  annualFees: [60000],
  includeTournaments: true,
  includeH2H: false,
  tournaments: [{ id: 't', name: 'Open', entryPrice: 10, eventsPerMonth: 4, basis: 'count', participants: 100, rebuyMode: 'avg', rebuys: 0, isCash: false, rewardFaceValue: 500, customerCashCost: 200 }],
}, o);

const t0 = (s) => TPstate(s).tournaments[0];

describe('Launch ramp', () => {
  it('is off by default, so every month runs at full volume', () => {
    const s = base();
    expect(TPrampFactor(s, 1)).toBe(1);
    expect(TPrampFactor(s, 12)).toBe(1);
    expect(TPavgRamp(s)).toBe(1);
  });

  it('interpolates from the starting share up to full volume', () => {
    const s = base({ rampOn: true, rampStartPct: 25, rampMonths: 6 });
    expect(TPrampFactor(s, 1)).toBeCloseTo(0.25, 9);
    expect(TPrampFactor(s, 6)).toBe(1);
    expect(TPrampFactor(s, 12)).toBe(1);
    expect(TPrampFactor(s, 3)).toBeCloseTo(0.25 + 0.75 * 2 / 5, 9);
  });

  it('a one-month ramp starts at full volume rather than dividing by zero', () => {
    expect(TPrampFactor(base({ rampOn: true, rampMonths: 1, rampStartPct: 25 }), 1)).toBe(1);
  });

  it('scales tournament participation month by month', () => {
    const s = base({ rampOn: true, rampStartPct: 50, rampMonths: 3 });
    expect(TPtypeParticipants(s, t0(s), 1)).toBeCloseTo(50, 9);
    expect(TPtypeParticipants(s, t0(s), 3)).toBeCloseTo(100, 9);
    const r = TPcalculate(s);
    expect(r.months[0].handle).toBeCloseTo(2000, 6);
    expect(r.months[2].handle).toBeCloseTo(4000, 6);
  });

  it('reports the average factor across the term', () => {
    expect(TPavgRamp(base({ rampOn: true, rampStartPct: 0, rampMonths: 13 }), 12)).toBeGreaterThan(0);
    expect(TPavgRamp(base({ rampOn: true, rampStartPct: 100, rampMonths: 6 }))).toBe(1);
  });
});

describe('Per-tournament participation', () => {
  it('each type carries its own headcount', () => {
    const s = base({
      tournaments: [
        { id: 'a', name: 'Dollar open', entryPrice: 1, eventsPerMonth: 4, basis: 'count', participants: 400, rebuyMode: 'avg', rebuys: 0, customerCashCost: 0 },
        { id: 'b', name: 'Headline', entryPrice: 20, eventsPerMonth: 1, basis: 'count', participants: 60, rebuyMode: 'avg', rebuys: 0, customerCashCost: 0 },
      ],
    });
    const d = TPcalculate(s).months[0].detail;
    expect(d[0].participants).toBe(400);
    expect(d[1].participants).toBe(60);
    expect(d[0].handle).toBe(1600);
    expect(d[1].handle).toBe(1200);
  });

  it('a type can instead take a share of the addressable base', () => {
    const s = base({
      mau: 20000,
      tournaments: [{ id: 'a', name: 'A', entryPrice: 1, eventsPerMonth: 1, basis: 'mau', participantPct: 4, rebuyMode: 'avg', customerCashCost: 0 }],
    });
    expect(TPcalculate(s).months[0].detail[0].participants).toBe(800);
  });

  it('a share basis needs an addressable base', () => {
    const s = base({ mau: 0, tournaments: [{ id: 'a', name: 'A', entryPrice: 1, eventsPerMonth: 1, basis: 'mau', participantPct: 4 }] });
    expect(TPvalidate(s).join(' ')).toMatch(/addressable users/i);
  });

  it('a headcount basis needs no addressable base at all', () => {
    expect(TPvalidate(base({ mau: 0 }))).toEqual([]);
  });

  it('sums participants across types for the monthly row', () => {
    const s = base({
      tournaments: [
        { id: 'a', name: 'A', entryPrice: 1, eventsPerMonth: 1, basis: 'count', participants: 30, customerCashCost: 0 },
        { id: 'b', name: 'B', entryPrice: 1, eventsPerMonth: 1, basis: 'count', participants: 70, customerCashCost: 0 },
      ],
    });
    expect(TPcalculate(s).months[0].participants).toBe(100);
  });
});

describe('Entries, value and prize cost', () => {
  it('entries per event are participants times one plus rebuys', () => {
    const s = base();
    expect(TPentriesPerEvent(s, t0(s), 1)).toBe(100);
    const r = base({ tournaments: [{ id: 'r', name: 'R', entryPrice: 10, eventsPerMonth: 4, basis: 'count', participants: 100, rebuyMode: 'avg', rebuys: 1.5, customerCashCost: 0 }] });
    expect(TPentriesPerEvent(r, t0(r), 1)).toBe(250);
  });

  it('a percentage rebuy rate adds entries as a share of participants', () => {
    const s = base({ tournaments: [{ id: 'p', name: 'P', entryPrice: 10, eventsPerMonth: 1, basis: 'count', participants: 100, rebuyMode: 'pct', rebuyPct: 40, customerCashCost: 0 }] });
    expect(TPentriesPerEvent(s, t0(s), 1)).toBe(140);
    const over = base({ tournaments: [{ id: 'p', name: 'P', entryPrice: 10, eventsPerMonth: 1, basis: 'count', participants: 100, rebuyMode: 'pct', rebuyPct: 250, customerCashCost: 0 }] });
    expect(TPentriesPerEvent(over, t0(over), 1)).toBe(350);
  });

  it('prize cost scales with events per month, not participants', () => {
    expect(TPcalculate(base()).months[0].prizeCost).toBe(800);
    expect(TPcalculate(base({ tournaments: [{ id: 'x', name: 'X', entryPrice: 10, eventsPerMonth: 8, basis: 'count', participants: 500, customerCashCost: 200 }] })).months[0].prizeCost).toBe(1600);
  });

  it('a cash tournament uses the single prize amount for both roles', () => {
    const s = base({ tournaments: [{ id: 'c', name: 'C', entryPrice: 10, eventsPerMonth: 3, basis: 'count', participants: 100, isCash: true, cashPrizeAmount: 300, customerCashCost: 999, rewardFaceValue: 111 }] });
    expect(TPcalculate(s).months[0].prizeCost).toBe(900);
    expect(TPcustomerProjection(s).tournaments[0].rewardLabel).toBe('$300 prize pool');
  });

  it('a loss-making month floors net at zero but keeps the raw figures visible', () => {
    const s = base({ tournaments: [{ id: 'l', name: 'L', entryPrice: 1, eventsPerMonth: 1, basis: 'count', participants: 100, customerCashCost: 5000 }] });
    const m = TPcalculate(s).months[0];
    expect(m.netRevenue).toBe(0);
    expect(m.grossMargin).toBe(-4900);
    expect(m.handle).toBe(100);
    expect(m.prizeCost).toBe(5000);
    expect(TPcalculate(s).lossMonths).toBe(12);
  });
});

describe('Prize cost is deducted before the split', () => {
  it('all three parties fund prizes pro rata', () => {
    const m = TPcalculate(base({ annualFees: [1e6] })).months[0];
    expect(m.netRevenue).toBe(3200);
    expect(m.toLicense).toBe(1600);
    expect(m.toOperator).toBe(1280);
    expect(m.toLucra).toBe(320);
  });
});

describe('Recapture toggle', () => {
  it('recapture on gives the licence a share of activity', () => {
    expect(TPsplitRates(base())).toMatchObject({ recapturing: true, credit: 0.5, operator: 0.4, lucra: 0.1 });
  });

  it('recapture off removes the licence bucket without waiving the fee', () => {
    const s = base({ recapture: false });
    const rates = TPsplitRates(TPstate(s));
    expect(rates.recapturing).toBe(false);
    expect(rates.free).toBe(false);
    expect(rates.credit).toBe(0);
    const r = TPcalculate(s);
    expect(r.recapturing).toBe(false);
    expect(r.totalContract).toBe(60000);
    expect(r.cumulativeLicense).toBe(0);
    expect(r.balanceDue).toBe(60000);
    expect(r.payoffMonth).toBeNull();
    expect(r.months[0].toOperator).toBeCloseTo(3200 * 0.9, 6);
  });

  it('a free licence waives the fee entirely, which recapture off does not', () => {
    const free = TPcalculate(base({ freeLicense: true }));
    expect(free.free).toBe(true);
    expect(free.totalContract).toBe(0);
    expect(free.balanceDue).toBe(0);
  });

  it('sweep sends 90 to the licence and nothing to the operator', () => {
    const m = TPcalculate(base({ splitMode: 'sweep', annualFees: [1e6] })).months[0];
    expect(m.toLicense).toBeCloseTo(2880, 6);
    expect(m.toOperator).toBe(0);
    expect(m.toLucra).toBeCloseTo(320, 6);
  });

  it('a custom split that does not sum to 100 is rejected', () => {
    const s = base({ splitMode: 'custom', custom: { credit: 60, operator: 30, lucra: 15 } });
    expect(TPvalidate(s)[0]).toMatch(/sum to 100/);
  });

  it('a zero licence share points at the recapture toggle', () => {
    const s = base({ splitMode: 'custom', custom: { credit: 0, operator: 90, lucra: 10 } });
    expect(TPvalidate(s).join(' ')).toMatch(/recapture off/i);
  });

  it('recapture off skips the split validation entirely', () => {
    expect(TPvalidate(base({ recapture: false, splitMode: 'custom', custom: { credit: 0, operator: 0, lucra: 0 } }))).toEqual([]);
  });
});

describe('Mid-month retirement', () => {
  const r = () => TPcalculate(base({ annualFees: [4000] }));

  it('credits only what is left in the clearing month', () => {
    const m = r().months;
    expect(m[0].toLicense).toBe(1600);
    expect(m[2].toLicense).toBe(800);
    expect(m[2].split).toBe('Crossover');
  });

  it('redirects the rest of that month to the operator', () => {
    expect(r().months[2].toOperator).toBeCloseTo(1600 * 0.4 + 1600 * 0.9, 6);
    expect(r().months[3].toOperator).toBeCloseTo(3200 * 0.9, 6);
  });

  it('reports a fractional payoff month and reconciles every month', () => {
    expect(r().payoffMonth).toBeCloseTo(2.5, 9);
    r().months.forEach((m) => expect(m.toLicense + m.toOperator + m.toLucra).toBeCloseTo(m.netRevenue, 6));
  });
});

describe('A deal that never retires', () => {
  it('reports the balance due rather than a false payoff', () => {
    const r = TPcalculate(base({ annualFees: [500000] }));
    expect(r.payoffMonth).toBeNull();
    expect(r.balanceDue).toBeCloseTo(500000 - 1600 * 12, 6);
  });
});

describe('Multi-year terms', () => {
  const multi = (o = {}) => base(Object.assign({ termYears: 3, annualFees: [12000, 12000, 12000] }, o));

  it('runs twelve months per contract year and tags them', () => {
    const m = TPcalculate(multi()).months;
    expect(m).toHaveLength(36);
    expect(m[12]).toMatchObject({ month: 13, year: 2, monthInYear: 1 });
  });

  it('whole-term basis treats the fees as one balance', () => {
    const r = TPcalculate(multi({ payoffBasis: 'term' }));
    expect(r.payoffMonth).toBeCloseTo(22.5, 6);
    expect(r.months[35].split).toBe('Post-payoff');
  });

  it('per-year basis opens a fresh balance at each step-up', () => {
    const r = TPcalculate(multi({ payoffBasis: 'annual' }));
    expect(r.years[1].opening).toBe(12000);
    expect(r.months[12].split).toBe('Payoff');
  });

  it('rolls a shortfall forward or charges it as cash', () => {
    const roll = TPcalculate(multi({ payoffBasis: 'annual', shortfall: 'roll', annualFees: [30000, 10000, 10000] }));
    expect(roll.years[0].closing).toBeCloseTo(10800, 6);
    expect(roll.trueUpTotal).toBe(0);
    const cash = TPcalculate(multi({ payoffBasis: 'annual', shortfall: 'cash', annualFees: [30000, 10000, 10000] }));
    expect(cash.years[0].trueUp).toBeCloseTo(10800, 6);
    expect(cash.years[1].opening).toBe(10000);
  });

  it('reconciles every month in both bases', () => {
    ['term', 'annual'].forEach((payoffBasis) => {
      TPcalculate(multi({ payoffBasis })).months.forEach((m) => {
        expect(m.toLicense + m.toOperator + m.toLucra).toBeCloseTo(m.netRevenue, 6);
      });
    });
  });

  it('caps the term at five years', () => {
    expect(TPcalculate(base({ termYears: 9, annualFees: [1, 1, 1, 1, 1] })).months).toHaveLength(60);
  });
});

describe('Head-to-head reach', () => {
  it('follows the addressable base until overridden', () => {
    expect(TPreach(TPstate(base({ mau: 500000 })))).toBe(500000);
    expect(TPreach(TPstate(base({ mau: 500000, h2hReach: 120000 })))).toBe(120000);
  });

  it('needs one of the two when head-to-head is selected', () => {
    expect(TPvalidate(base({ includeH2H: true, mau: 0, h2hReach: 0 })).join(' ')).toMatch(/addressable users/i);
    expect(TPvalidate(base({ includeH2H: true, mau: 0, h2hReach: 50000 }))).toEqual([]);
  });
});

describe('Customer-safe projection', () => {
  it('returns exactly the whitelisted keys', () => {
    const p = TPcustomerProjection(base());
    expect(Object.keys(p).sort()).toEqual(['dealName', 'tournaments']);
    expect(Object.keys(p.tournaments[0]).sort()).toEqual(['entryPrice', 'frequencyLabel', 'name', 'rebuyLabel', 'rewardLabel']);
  });

  it('never carries the fee, split or cash cost through', () => {
    const json = JSON.stringify(TPcustomerProjection(base({ annualFees: [987654], splitMode: 'sweep' })));
    expect(json).not.toContain('987654');
    expect(json).not.toContain('sweep');
    expect(json).not.toContain('customerCashCost');
  });
});

describe('Model shape and guards', () => {
  it('always produces twelve months per year', () => {
    expect(TPcalculate(base()).months).toHaveLength(12);
  });

  it('requires a fee or the free toggle', () => {
    expect(TPvalidate(base({ annualFees: [0] })).join(' ')).toMatch(/licence fee/i);
  });

  it('requires at least one tournament type', () => {
    expect(TPvalidate(base({ tournaments: [] })).join(' ')).toMatch(/at least one tournament/i);
  });

  it('requires at least one product', () => {
    expect(TPvalidate(base({ includeTournaments: false, includeH2H: false })).join(' ')).toMatch(/at least one product/i);
  });

  it('migrates the previous shared-participation shape onto each type', () => {
    const legacy = TPstate({
      participants: 250, participantBasis: 'count',
      tournaments: [{ id: 'a', name: 'A', entryPrice: 5, eventsPerMonth: 1, participationMode: 'shared' }],
    });
    expect(legacy.tournaments[0].basis).toBe('count');
    expect(legacy.tournaments[0].participants).toBe(250);
  });

  it('migrates a per-type override too', () => {
    const legacy = TPstate({
      participants: 250, participantBasis: 'count',
      tournaments: [{ id: 'a', name: 'A', entryPrice: 5, eventsPerMonth: 1, participationMode: 'custom', participantsCustom: 40 }],
    });
    expect(legacy.tournaments[0].participants).toBe(40);
  });

  it('renames the old standard split to recapture', () => {
    expect(TPstate({ splitMode: 'standard' }).splitMode).toBe('recapture');
  });
});

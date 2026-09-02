import { describe, it, expect } from 'vitest';
import calc from './calc-functions.js';

const {
  TPcalculate, TPvalidate, TPcustomerProjection, TPstate, TPsplitRates,
  TPrampFactor, TPavgRamp, TPreach, TPtypeParticipants, TPentriesPerEvent, TP_DEFAULTS,
} = calc;

// One tournament: 100 participants, no rebuys, $10 entry, 4 events, $200 cash
// cost per event -> entries value 4000, prize funding 800. The split is taken on the
// full 4000; the operator funds the 800 out of their own share afterwards.
const base = (o = {}) => Object.assign(JSON.parse(JSON.stringify(TP_DEFAULTS)), {
  termYears: 1,
  annualFees: [60000],
  includeTournaments: true,
  includeH2H: false,
  tournaments: [{ id: 't', name: 'Open', entryPrice: 10, eventsPerMonth: 4, basis: 'count', participants: 100, rebuyMode: 'avg', rebuys: 0, isCash: false, rewardFaceValue: 500, customerCashCost: 200 }],
}, o);

const t0 = (s) => TPstate(s).core.tournaments[0];

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
    expect(TPvalidate(s).join(' ')).toMatch(/users per location/i);
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

  it('a loss-making month still splits the entries and leaves the operator negative', () => {
    const s = base({ tournaments: [{ id: 'l', name: 'L', entryPrice: 1, eventsPerMonth: 1, basis: 'count', participants: 100, customerCashCost: 5000 }] });
    const m = TPcalculate(s).months[0];
    // The pool is the entries. Prize funding does not shrink it, so the loss lands
    // entirely on the operator and is preserved rather than floored away.
    expect(m.splitBase).toBe(100);
    expect(m.grossMargin).toBe(-4900);
    expect(m.handle).toBe(100);
    expect(m.prizeCost).toBe(5000);
    expect(m.operatorGross).toBe(40);
    expect(m.toOperator).toBe(-4960);
    expect(TPcalculate(s).lossMonths).toBe(12);
  });
});

describe('The split is taken on gross entries', () => {
  it('the operator funds the prize out of their own share, not out of the pool', () => {
    const m = TPcalculate(base({ annualFees: [1e6] })).months[0];
    expect(m.splitBase).toBe(4000);
    expect(m.toLicense).toBe(2000);
    expect(m.operatorGross).toBe(1600);
    expect(m.toOperator).toBe(800);
    expect(m.toLucra).toBe(400);
    // Nothing is created or lost: the pool is fully accounted for.
    expect(m.toLicense + m.operatorGross + m.toLucra).toBe(m.splitBase);
    expect(m.toLicense + m.toOperator + m.toLucra + m.prizeCost).toBe(m.splitBase);
  });

  it('prize funding never reduces what the licence is credited', () => {
    const cheap = TPcalculate(base({ annualFees: [1e6] })).months[0];
    const dear = TPcalculate(base({ annualFees: [1e6], tournaments: [{ id: 't', name: 'Open', entryPrice: 10, eventsPerMonth: 4, basis: 'count', participants: 100, rebuyMode: 'avg', rebuys: 0, customerCashCost: 700 }] })).months[0];
    expect(dear.prizeCost).toBe(2800);
    expect(dear.toLicense).toBe(cheap.toLicense);
    expect(dear.toLucra).toBe(cheap.toLucra);
    expect(dear.toOperator).toBe(cheap.toOperator - 2000);
  });
});

describe('The licence is retired from the licence share alone', () => {
  // Loco Bear terms: 50 to the licence, 45 to the operator, 5 to Lucra while the
  // licence is being retired; 90/10 afterwards. Fee stepped 78k / 102k / 126k.
  const bear = (o = {}) => base(Object.assign({
    termYears: 3, annualFees: [78000, 102000, 126000], payoffBasis: 'annual', shortfall: 'cash',
    splitMode: 'custom', custom: { credit: 50, operator: 45, lucra: 5 }, post: { operator: 90, lucra: 10 },
    tournaments: [{ id: 't', name: 'Weekly', entryPrice: 10, eventsPerMonth: 4, basis: 'count', participants: 500, rebuyMode: 'avg', rebuys: 0, isCash: false, rewardFaceValue: 500, customerCashCost: 250 }],
  }, o));

  it('the operator keeps their 45% from month one; nothing from it goes to the licence', () => {
    const r = TPcalculate(bear());
    r.months.forEach((m) => {
      expect(m.licenseFromOperator).toBe(0);
      expect(m.licenseFromShare).toBe(m.toLicense);
      if (m.split === 'Payoff') {
        expect(m.toLicense).toBeCloseTo(m.splitBase * 0.5, 6);
        expect(m.toOperator).toBeCloseTo(m.splitBase * 0.45 - m.prizeCost, 6);
        expect(m.toLucra).toBeCloseTo(m.splitBase * 0.05, 6);
      }
      if (m.split === 'Post-payoff') {
        expect(m.toLicense).toBe(0);
        expect(m.toOperator).toBeCloseTo(m.splitBase * 0.9 - m.prizeCost, 6);
      }
      // The 50% alone retires the fee; the 45% is never part of the credit.
      expect(m.toLicense).toBeLessThanOrEqual(m.splitBase * 0.5 + 1e-9);
      expect(m.toOperator + m.prizeCost).toBeGreaterThanOrEqual(m.splitBase * 0.45 - 1e-9);
    });
    expect(r.months.some((m) => m.split === 'Payoff')).toBe(true);
    expect(r.months.some((m) => m.split === 'Post-payoff')).toBe(true);
  });

  it('reports the funding sources so every table can print them', () => {
    const r = TPcalculate(bear());
    const f = r.licenceFunding;
    expect(f.fromOperator).toBe(0);
    expect(f.fromShare).toBeCloseTo(r.months.reduce((a, m) => a + m.toLicense, 0), 6);
    expect(f.fromShare).toBe(r.totalActivityCredited);
    expect(f.fromSponsors).toBe(0);
    expect(f.fromUpfront).toBe(0);
    expect(f.fromShare + f.fromSponsors + f.fromUpfront).toBeCloseTo(r.cumulativeLicense, 6);
    r.years.forEach((y) => {
      expect(y.fromOperator).toBe(0);
      expect(y.activity).toBeCloseTo(y.credited, 6);
    });
  });

  it('a signing payment or sponsor is its own source, still not the operator share', () => {
    const r = TPcalculate(bear({ upfrontMode: 'amount', upfrontValue: 20000, sponsors: [{ name: 'S', amount: 5000, month: 2 }] }));
    const f = r.licenceFunding;
    expect(f.fromUpfront).toBe(20000);
    expect(f.fromSponsors).toBe(5000);
    expect(f.fromOperator).toBe(0);
    expect(r.years[0].credited).toBeCloseTo(r.years[0].activity + 25000, 6);
    expect(f.fromShare + f.fromSponsors + f.fromUpfront).toBeCloseTo(r.cumulativeLicense, 6);
  });

  it('a cash true-up is settled separately, never taken from the operator share', () => {
    // Too little activity to retire 78k in year 1: the shortfall is a cash true-up.
    const r = TPcalculate(bear({ tournaments: [{ id: 't', name: 'Weekly', entryPrice: 10, eventsPerMonth: 4, basis: 'count', participants: 50, rebuyMode: 'avg', rebuys: 0, isCash: false, rewardFaceValue: 100, customerCashCost: 50 }] }));
    expect(r.trueUpTotal).toBeGreaterThan(0);
    expect(r.licenceFunding.trueUp).toBe(r.trueUpTotal);
    expect(r.licenceFunding.fromOperator).toBe(0);
    r.months.forEach((m) => expect(m.toOperator).toBeCloseTo(m.splitBase * 0.45 - m.prizeCost, 6));
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
    expect(r.months[0].toOperator).toBeCloseTo(4000 * 0.9 - 800, 6);
  });

  it('a free licence waives the fee entirely, which recapture off does not', () => {
    const free = TPcalculate(base({ freeLicense: true }));
    expect(free.free).toBe(true);
    expect(free.totalContract).toBe(0);
    expect(free.balanceDue).toBe(0);
  });

  it('sweep sends 90 to the licence and nothing to the operator', () => {
    const m = TPcalculate(base({ splitMode: 'sweep', annualFees: [1e6] })).months[0];
    expect(m.toLicense).toBeCloseTo(3600, 6);
    expect(m.operatorGross).toBe(0);
    expect(m.toLucra).toBeCloseTo(400, 6);
    // Sweep leaves the operator carrying the prize funding with no share to cover it.
    expect(m.toOperator).toBeCloseTo(-800, 6);
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
  const r = () => TPcalculate(base({ annualFees: [5000] }));

  it('credits only what is left in the clearing month', () => {
    const m = r().months;
    expect(m[0].toLicense).toBe(2000);
    expect(m[2].toLicense).toBe(1000);
    expect(m[2].split).toBe('Crossover');
  });

  it('redirects the rest of that month to the operator', () => {
    expect(r().months[2].toOperator).toBeCloseTo(2000 * 0.4 + 2000 * 0.9 - 800, 6);
    expect(r().months[3].toOperator).toBeCloseTo(4000 * 0.9 - 800, 6);
  });

  it('reports a fractional payoff month and reconciles every month', () => {
    expect(r().payoffMonth).toBeCloseTo(2.5, 9);
    r().months.forEach((m) => expect(m.toLicense + m.toOperator + m.toLucra + m.prizeCost).toBeCloseTo(m.splitBase, 6));
  });
});

describe('A deal that never retires', () => {
  it('reports the balance due rather than a false payoff', () => {
    const r = TPcalculate(base({ annualFees: [500000] }));
    expect(r.payoffMonth).toBeNull();
    expect(r.balanceDue).toBeCloseTo(500000 - 2000 * 12, 6);
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
    expect(r.payoffMonth).toBeCloseTo(18, 6);
    expect(r.months[35].split).toBe('Post-payoff');
  });

  it('per-year basis opens a fresh balance at each step-up', () => {
    const r = TPcalculate(multi({ payoffBasis: 'annual' }));
    expect(r.years[1].opening).toBe(12000);
    expect(r.months[12].split).toBe('Payoff');
  });

  it('rolls a shortfall forward or charges it as cash', () => {
    const roll = TPcalculate(multi({ payoffBasis: 'annual', shortfall: 'roll', annualFees: [30000, 10000, 10000] }));
    expect(roll.years[0].closing).toBeCloseTo(6000, 6);
    expect(roll.trueUpTotal).toBe(0);
    const cash = TPcalculate(multi({ payoffBasis: 'annual', shortfall: 'cash', annualFees: [30000, 10000, 10000] }));
    expect(cash.years[0].trueUp).toBeCloseTo(6000, 6);
    expect(cash.years[1].opening).toBe(10000);
  });

  it('reconciles every month in both bases', () => {
    ['term', 'annual'].forEach((payoffBasis) => {
      TPcalculate(multi({ payoffBasis })).months.forEach((m) => {
        expect(m.toLicense + m.toOperator + m.toLucra + m.prizeCost).toBeCloseTo(m.splitBase, 6);
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
    expect(TPvalidate(base({ includeH2H: true, mau: 0, h2hReach: 0 })).join(' ')).toMatch(/users per location/i);
    expect(TPvalidate(base({ includeH2H: true, mau: 0, h2hReach: 50000 }))).toEqual([]);
  });
});

describe('Customer-safe projection', () => {
  it('returns exactly the whitelisted keys', () => {
    const p = TPcustomerProjection(base());
    expect(Object.keys(p).sort()).toEqual(['customerType', 'dealName', 'tournaments']);
    expect(Object.keys(p.tournaments[0]).sort()).toEqual(['entryPrice', 'frequencyLabel', 'name', 'product', 'productLabel', 'rebuyLabel', 'rewardLabel', 'scopeLabel']);
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
    expect(legacy.core.tournaments[0].basis).toBe('count');
    expect(legacy.core.tournaments[0].participants).toBe(250);
  });

  it('migrates a per-type override too', () => {
    const legacy = TPstate({
      participants: 250, participantBasis: 'count',
      tournaments: [{ id: 'a', name: 'A', entryPrice: 5, eventsPerMonth: 1, participationMode: 'custom', participantsCustom: 40 }],
    });
    expect(legacy.core.tournaments[0].participants).toBe(40);
  });

  it('renames the old standard split to recapture', () => {
    expect(TPstate({ splitMode: 'standard' }).splitMode).toBe('recapture');
  });
});

describe('A waived licence keeps the revenue split', () => {
  // The split is how Lucra is paid, so waiving the fee makes it more important,
  // not less. With no licence to retire, everything runs at the operator/Lucra
  // split exactly as entered.
  it('routes all activity through the entered split rather than zeroing it', () => {
    const s = base({ freeLicense: true, post: { operator: 50, lucra: 50 } });
    const rates = TPsplitRates(TPstate(s));
    expect(rates.free).toBe(true);
    expect(rates.credit).toBe(0);
    expect(rates.operator).toBeCloseTo(0.5, 9);
    expect(rates.lucra).toBeCloseTo(0.5, 9);

    const m = TPcalculate(s).months[0];
    expect(m.splitBase).toBe(4000);
    expect(m.toLicense).toBe(0);
    expect(m.operatorGross).toBeCloseTo(2000, 6);
    expect(m.toLucra).toBeCloseTo(2000, 6);
    expect(m.toOperator).toBeCloseTo(2000 - 800, 6);
  });

  it('honours any split entered, from a 50/50 waiver to a 95/5 paid deal', () => {
    const at = (operator, lucra, o = {}) =>
      TPcalculate(base(Object.assign({ post: { operator, lucra } }, o))).months[0];
    expect(at(50, 50, { freeLicense: true }).toLucra).toBeCloseTo(2000, 6);
    expect(at(75, 25, { freeLicense: true }).toLucra).toBeCloseTo(1000, 6);
    expect(at(95, 5, { freeLicense: true }).toLucra).toBeCloseTo(200, 6);
    // Same split, paid licence with recapture off: the fee stays payable and the
    // split still governs every dollar of activity.
    const paid = at(95, 5, { recapture: false });
    expect(paid.toLucra).toBeCloseTo(200, 6);
    expect(TPcalculate(base({ recapture: false })).totalContract).toBe(60000);
  });

  it('validates the operator and Lucra split for a head-to-head-only deal', () => {
    const s = base({ includeTournaments: false, includeH2H: true, mau: 100000, post: { operator: 60, lucra: 30 } });
    expect(TPvalidate(s).join(' ')).toMatch(/sum to 100/);
    expect(TPvalidate(base({ includeTournaments: false, includeH2H: true, mau: 100000, post: { operator: 50, lucra: 50 } }))).toEqual([]);
  });
});

// A mini-games deal: Lucra's catalog on the customer's app, the product the
// ladder's published anchors describe. Core stays off.
const miniDeal = (o = {}) => {
  const opts = Object.assign({}, o), mini = opts.mini || {}; delete opts.mini;
  return base(Object.assign({
    includeTournaments: false, includeH2H: false, customerType: 'app',
    termYears: 1, annualFees: [120000, 0, 0, 0, 0], post: { operator: 90, lucra: 10 },
    mini: Object.assign({ on: true, tournamentsOn: true, h2hOn: true }, mini),
  }, opts));
};

describe('The configuration recommender', () => {
  const { TPrecommend, TPengCurve, TPrecPrizeShare, TP_BANDS } = calc;
  const deal = miniDeal;

  it('scales engagement down as the base grows, anchored on the reference deals', () => {
    expect(TPengCurve(100000)).toBe(15);
    expect(TPengCurve(500000)).toBe(10);
    expect(TPengCurve(5000000)).toBe(8);
    expect(TPengCurve(25000000)).toBe(2);
    // Between anchors it interpolates rather than stepping off a cliff.
    expect(TPengCurve(1000000)).toBeLessThan(10);
    expect(TPengCurve(1000000)).toBeGreaterThan(8);
    // A base smaller or larger than the anchors is clamped, never extrapolated.
    expect(TPengCurve(1000)).toBe(15);
    expect(TPengCurve(500000000)).toBe(2);
  });

  it('never models above the published ceiling, and reports the gap instead', () => {
    // A base far too small for a $120k licence cannot be made to work. Since the
    // head-to-head fee now credits the licence too, it takes a very small base.
    const r = TPrecommend(deal(), 2000);
    expect(r.cleared).toBe(false);
    expect(r.chosen.step.key).toBe('published-2025');
    expect(r.chosen.engagement).toBeLessThanOrEqual(TP_BANDS.engagement.ceiling);
    expect(r.shortfallYear).toBeGreaterThan(0);
    // The gap is the unretired licence, not a number invented to look tidy.
    expect(r.licenceGapYear).toBeCloseTo(r.chosen.result.balanceDue, 6);
  });

  it('stops at the first step that clears rather than reaching for the ceiling', () => {
    const r = TPrecommend(deal(), 1000000);
    expect(r.cleared).toBe(true);
    expect(r.chosen.step.key).toBe('conservative');
    expect(r.shortfallYear).toBe(0);
    expect(r.chosen.tests).toEqual({ licenceRetired: true, lucraCoversLicence: true, operatorPositive: true });
  });

  it('sizes prize funding inside the operator share so the programme is not self-defeating', () => {
    // At the default recapture split the operator sees 40% during payoff, so a
    // prize pool of half the entries would lose them money every month.
    expect(TPrecPrizeShare(deal())).toBeCloseTo(0.32, 9);
    const r = TPrecommend(deal(), 1000000);
    expect(r.chosen.result.months[0].toOperator).toBeGreaterThan(0);
    expect(r.chosen.result.lossMonths).toBe(0);
    // A waived licence hands the operator more, so the prize can be richer.
    expect(TPrecPrizeShare(deal({ freeLicense: true, post: { operator: 50, lucra: 50 } }))).toBeCloseTo(0.4, 9);
  });

  it('counts reward value as a benefit and keeps it out of revenue', () => {
    const r = TPrecommend(deal(), 1000000);
    expect(r.chosen.rewardValueYear).toBeGreaterThan(0);
    const h = r.chosen.h2h;
    // Revenue generated is the one pool both products feed, split month by month.
    expect(r.chosen.revenueYear).toBeCloseTo(r.chosen.result.totalSplitBase, 6);
    expect(r.chosen.result.totalSplitBase).toBeCloseTo(r.chosen.result.totalHandle + r.chosen.result.totalH2HFee, 6);
    expect(h.platformFee * 12).toBeCloseTo(r.chosen.result.totalH2HFee, 3);
    expect(r.chosen.revenueYear).not.toBeCloseTo(r.chosen.revenueYear + r.chosen.rewardValueYear, 6);
  });

  it('refuses to recommend without a base', () => {
    expect(TPrecommend(deal(), 0).ok).toBe(false);
  });

  it('recommends for mini games by default when they are in the deal, else core', () => {
    expect(TPrecommend(deal(), 1000000).product).toBe('mini');
    expect(TPrecommend(base({ includeH2H: true, mau: 5000 }), 5000).product).toBe('core');
  });

  it('has no benchmark for core: it tests the deal as entered and says so', () => {
    const core = base({ includeH2H: true, termYears: 1, annualFees: [120000, 0, 0, 0, 0], post: { operator: 90, lucra: 10 }, mau: 5000 });
    const r = TPrecommend(core, 5000);
    expect(r.product).toBe('core');
    expect(r.noBenchmark).toBe(true);
    expect(r.tried).toHaveLength(1);
    expect(r.chosen.step.key).toBe('entered');
    expect(r.chosen.step.basis).toMatch(/No published benchmark for in-venue play/);
    // The candidate is the deal's own numbers, not a ladder step's.
    const s = TPstate(core);
    expect(r.chosen.cfg).toBeNull();
    expect(r.chosen.state.core.h2h.engagement).toBe(s.core.h2h.engagement);
    expect(r.chosen.state.core.h2h.feeRate).toBe(s.core.h2h.feeRate);
    expect(r.chosen.state.core.tournaments.map((t) => t.entryPrice)).toEqual(s.core.tournaments.map((t) => t.entryPrice));
    // A product can be asked for explicitly.
    expect(TPrecommend(miniDeal({ includeTournaments: true, includeH2H: true, mau: 5000 }), 5000, { product: 'core' }).product).toBe('core');
  });
});

describe('Growth over the term: locations', () => {
  const { TPlocations, TPopenings, TPvolumeFactor, TPavgVolume, TPh2h } = calc;
  const grow = (o = {}) => base(Object.assign({
    termYears: 3, annualFees: [60000, 60000, 60000], locations: [1, 3, 7],
  }, o));

  it('defaults to one location, so nothing changes for a web-only customer', () => {
    const s = TPstate(base());
    expect(TPlocations(s)).toEqual([1]);
    expect(TPopenings(s)).toEqual([1]);
    expect(TPvolumeFactor(s, 1)).toBe(1);
    expect(TPavgVolume(s)).toBe(1);
  });

  it('never lets a year run fewer locations than the one before, or fewer than one', () => {
    expect(TPlocations(TPstate(grow({ locations: [1, 3, 2] })))).toEqual([1, 3, 3]);
    expect(TPlocations(TPstate(grow({ locations: [0, 0, 5] })))).toEqual([1, 1, 5]);
    expect(TPlocations(TPstate(grow({ locations: [2] })))).toEqual([2, 2, 2]);
  });

  it('spreads a year\'s openings through that year rather than on its first day', () => {
    const s = TPstate(grow());
    expect(TPopenings(s)).toEqual([1, 13, 19, 25, 28, 31, 34]);
    // Two locations at the start of year two would have doubled volume in
    // month 13. Spreading them means month 13 sees only the first opening.
    expect(TPvolumeFactor(s, 13)).toBe(2);
    expect(TPvolumeFactor(s, 24)).toBe(3);
    expect(TPvolumeFactor(s, 36)).toBe(7);
  });

  it('puts every new location on its own launch ramp from the month it opens', () => {
    const s = TPstate(grow({ rampOn: true, rampStartPct: 25, rampMonths: 6 }));
    expect(TPvolumeFactor(s, 1)).toBeCloseTo(0.25, 9);
    expect(TPvolumeFactor(s, 12)).toBe(1);
    // Month 13: the first location is at full volume, the new one just opened at 25%.
    expect(TPvolumeFactor(s, 13)).toBeCloseTo(1.25, 9);
    // Month 36: five of seven are fully ramped, the last two are still climbing.
    expect(TPvolumeFactor(s, 36)).toBeLessThan(7);
    expect(TPvolumeFactor(s, 36)).toBeGreaterThan(6);
  });

  it('scales tournaments and head-to-head by the same factor', () => {
    const one = TPstate(grow({ locations: [1, 1, 1] })), seven = TPstate(grow());
    const r1 = TPcalculate(one), r7 = TPcalculate(seven);
    expect(r7.months[35].handle).toBeCloseTo(r1.months[35].handle * 7, 6);
    expect(r7.months[0].handle).toBeCloseTo(r1.months[0].handle, 6);
    const cfg = { engagement: 10, playsPerUser: 20, spendPerPlay: 2, feeRate: 10 };
    const h1 = TPh2h(Object.assign({}, one, { includeH2H: true, mau: 100000 }), cfg, 1);
    const h7 = TPh2h(Object.assign({}, seven, { includeH2H: true, mau: 100000 }), cfg, 1);
    expect(h7.paidVolume / h1.paidVolume).toBeCloseTo(TPavgVolume(seven), 6);
  });

  it('retires a tiered licence that one location alone could not', () => {
    // 100 participants at $10, 4 events: 4,000 of entries a month per location.
    // One location credits 2,000 a month, 72,000 over three years, short of 180,000.
    const alone = TPcalculate(TPstate(grow({ locations: [1, 1, 1] })));
    expect(alone.payoffMonth).toBeNull();
    expect(alone.balanceDue).toBeGreaterThan(0);
    const growing = TPcalculate(TPstate(grow()));
    expect(growing.payoffMonth).not.toBeNull();
    expect(growing.balanceDue).toBe(0);
    expect(growing.payoffMonth).toBeGreaterThan(24);
  });
});

describe('Head-to-head credits the licence at the same share', () => {
  const { TPmonthlyH2H } = calc;
  const cfg = { engagement: 10, playsPerUser: 20, spendPerPlay: 2, feeRate: 10 };
  const both = () => base({ includeH2H: true, mau: 100000, annualFees: [1e6] });

  it('adds the monthly platform fee to the pool that is split', () => {
    const r = TPcalculate(both(), cfg);
    const fee = TPmonthlyH2H(TPstate(both()), cfg, 1).platformFee;
    // 100,000 x 10% x 20 x $2 x 10% = $40,000 a month of platform fee.
    expect(fee).toBeCloseTo(40000, 6);
    expect(r.months[0].h2hFee).toBeCloseTo(40000, 6);
    expect(r.months[0].splitBase).toBeCloseTo(4000 + 40000, 6);
    expect(r.months[0].toLicense).toBeCloseTo(44000 * 0.5, 6);
    expect(r.includesH2H).toBe(true);
  });

  it('retires a licence that tournaments alone could not', () => {
    const s = base({ includeH2H: true, mau: 100000, annualFees: [60000] });
    const alone = TPcalculate(base({ includeH2H: false, mau: 100000, annualFees: [60000] }));
    // Core head-to-head runs on the deal's own inputs; cfg drives mini games only.
    const together = TPcalculate(s);
    expect(alone.includesH2H).toBe(false);
    expect(alone.payoffMonth).toBeNull();
    expect(together.payoffMonth).not.toBeNull();
    expect(together.payoffMonth).toBeLessThan(3);
  });

  it('keeps head-to-head out of the split when the product is not selected', () => {
    const r = TPcalculate(base({ includeH2H: false, mau: 100000 }), cfg);
    expect(r.includesH2H).toBe(false);
    expect(r.totalH2HFee).toBe(0);
    expect(r.months[0].splitBase).toBe(4000);
  });

  it('models a head-to-head-only deal through the same result', () => {
    const r = TPcalculate(base({ includeTournaments: false, includeH2H: true, mau: 100000, annualFees: [60000] }), cfg);
    expect(r.errors).toEqual([]);
    expect(r.totalHandle).toBe(0);
    expect(r.months[0].splitBase).toBeCloseTo(40000, 6);
    expect(r.payoffMonth).not.toBeNull();
  });
});

describe('Sponsors credit the licence directly', () => {
  it('lands against the licence in the month paid, before any split', () => {
    const s = base({ annualFees: [60000], sponsors: [{ id: 'a', name: 'Launch sponsor', amount: 20000, month: 3 }] });
    const r = TPcalculate(s);
    expect(r.months[1].sponsorCredit).toBe(0);
    expect(r.months[2].sponsorCredit).toBe(20000);
    // Month three's activity still credits at the licence share on top.
    expect(r.months[2].toLicense).toBe(2000);
    expect(r.months[2].cumulativeLicense).toBe(2000 * 3 + 20000);
    expect(r.totalSponsorCredited).toBe(20000);
    expect(r.totalSponsorUnapplied).toBe(0);
    // Sponsor money never enters the pool, so nothing of it reaches Lucra or the operator.
    expect(r.months[2].toLucra).toBe(400);
  });

  it('reports sponsor money that has nothing left to retire rather than losing it', () => {
    const s = base({ annualFees: [5000], sponsors: [{ id: 'a', name: 'Big', amount: 9000, month: 1 }] });
    const r = TPcalculate(s);
    expect(r.months[0].sponsorCredit).toBe(5000);
    expect(r.totalSponsorUnapplied).toBe(4000);
    expect(r.payoffMonth).toBe(0);
    expect(r.balanceDue).toBe(0);
  });

  it('is ignored entirely on a waived licence', () => {
    const r = TPcalculate(base({ freeLicense: true, sponsors: [{ id: 'a', name: 'X', amount: 1000, month: 1 }] }));
    expect(r.totalSponsorCredited).toBe(0);
    expect(r.totalSponsorUnapplied).toBe(1000);
  });
});

describe('A payment at signing credits the licence first', () => {
  const { TPupfront } = calc;
  it('is a dollar amount or a share of the year-1 fee, and nothing on a waived licence', () => {
    expect(TPupfront(TPstate(base()))).toBe(0);
    expect(TPupfront(TPstate(base({ upfrontMode: 'amount', upfrontValue: 12000 })))).toBe(12000);
    expect(TPupfront(TPstate(base({ upfrontMode: 'pct', upfrontValue: 25 })))).toBe(15000);
    expect(TPupfront(TPstate(base({ upfrontMode: 'pct', upfrontValue: 250 })))).toBe(60000);
    expect(TPupfront(TPstate(base({ upfrontMode: 'amount', upfrontValue: 12000, freeLicense: true })))).toBe(0);
  });

  it('comes off the balance in month 1 before activity or sponsors, and never enters the pool', () => {
    const r = TPcalculate(base({ upfrontMode: 'amount', upfrontValue: 12000, sponsors: [{ id: 'a', name: 'S', amount: 5000, month: 1 }] }));
    expect(r.months[0].upfrontCredit).toBe(12000);
    expect(r.months[0].sponsorCredit).toBe(5000);
    expect(r.months[1].upfrontCredit).toBe(0);
    expect(r.months[0].cumulativeLicense).toBe(12000 + 5000 + 2000);
    expect(r.totalUpfrontCredited).toBe(12000);
    expect(r.years[0].credited).toBe(12000 + 5000 + 2000 * 12);
    // Activity still splits exactly as before: the signing payment is not revenue.
    expect(r.months[0].toLucra).toBe(400);
    expect(r.months[0].splitBase).toBe(4000);
    const plain = TPcalculate(base());
    expect(r.balanceDue).toBe(Math.max(0, plain.balanceDue - 17000));
  });

  it('can retire the licence at signing, and is capped at the balance', () => {
    const r = TPcalculate(base({ annualFees: [10000], upfrontMode: 'amount', upfrontValue: 25000 }));
    expect(r.months[0].upfrontCredit).toBe(10000);
    expect(r.totalUpfrontCredited).toBe(10000);
    expect(r.payoffMonth).toBe(0);
    expect(r.balanceDue).toBe(0);
    // Everything after signing is post-payoff split.
    expect(r.months[0].split).toBe('Post-payoff');
  });
});

describe('Engagement decay', () => {
  const { TPdecayFactor, TPaudienceFactor } = calc;
  it('is off by default and leaves every year at full engagement', () => {
    const s = TPstate(base({ termYears: 3, annualFees: [1, 1, 1] }));
    expect(TPdecayFactor(s, 1)).toBe(1);
    expect(TPdecayFactor(s, 36)).toBe(1);
  });
  it('runs each contract year at the chosen share of the year before', () => {
    const s = TPstate(base({ termYears: 3, annualFees: [1, 1, 1], decayOn: true, decayRate: 95 }));
    expect(TPdecayFactor(s, 12)).toBe(1);
    expect(TPdecayFactor(s, 13)).toBeCloseTo(0.95, 9);
    expect(TPdecayFactor(s, 36)).toBeCloseTo(0.9025, 9);
    const r = TPcalculate(s);
    expect(r.months[24].handle).toBeCloseTo(r.months[0].handle * 0.9025, 6);
  });
  it('stacks with locations and season inside one audience factor', () => {
    const s = TPstate(base({ termYears: 2, annualFees: [1, 1], locations: [1, 3], decayOn: true, decayRate: 90 }));
    expect(TPaudienceFactor(s, 24)).toBeCloseTo(3 * 0.9, 9);
  });
});

describe('Seasonality', () => {
  const { TPseasonProfile, TPseasonFactor, TP_SEASONS } = calc;
  it('is flat unless switched on', () => {
    const s = TPstate(base());
    expect(TPseasonProfile(s)).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
  });
  it('normalises every preset so a season moves volume around the year without changing the year', () => {
    Object.keys(TP_SEASONS).forEach((key) => {
      if (!TP_SEASONS[key].profile) return;
      const p = TPseasonProfile(TPstate(base({ seasonOn: true, seasonPreset: key })));
      expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(12, 9);
    });
    const flat = TPcalculate(base()), nfl = TPcalculate(base({ seasonOn: true, seasonPreset: 'nfl' }));
    expect(nfl.totalHandle).toBeCloseTo(flat.totalHandle, 3);
    expect(nfl.months[9].handle).toBeGreaterThan(nfl.months[4].handle); // October beats May for the NFL
  });
  it('starts the profile from the calendar month the contract begins', () => {
    const jan = TPstate(base({ seasonOn: true, seasonPreset: 'nfl', seasonStart: 1 }));
    const sep = TPstate(base({ seasonOn: true, seasonPreset: 'nfl', seasonStart: 9 }));
    expect(TPseasonFactor(sep, 1)).toBeCloseTo(TPseasonFactor(jan, 9), 9);
  });
  it('accepts a custom twelve-month shape and normalises it too', () => {
    const s = TPstate(base({ seasonOn: true, seasonPreset: 'custom', seasonProfile: [2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0] }));
    const p = TPseasonProfile(s);
    expect(p[0]).toBeCloseTo(2, 9);
    expect(p[11]).toBe(0);
  });
});


describe('The recommender verdict and its levers', () => {
  const { TPrecommend, TPrecLevers, TPrewardCostRatio } = calc;
  const deal = miniDeal;
  const coreDeal = (o = {}) => base(Object.assign({
    includeH2H: true, termYears: 1, annualFees: [120000, 0, 0, 0, 0], post: { operator: 90, lucra: 10 },
  }, o));

  it('gates a paid licence on retirement and the operator, not on whether the split alone would cover the fee', () => {
    // At 4,000 users the licence retires and the operator is positive, while
    // Lucra's split share alone is well below the fee. Lucra is paid the fee
    // anyway on a paid licence, so the deal clears.
    const r = TPrecommend(deal(), 4000);
    expect(r.chosen.tests.licenceRetired).toBe(true);
    expect(r.chosen.tests.operatorPositive).toBe(true);
    expect(r.chosen.tests.lucraCoversLicence).toBe(false);
    expect(r.cleared).toBe(true);
    expect(r.shortfallYear).toBe(0);
    expect(r.lucraGapYear).toBeGreaterThan(0); // still reported, as information
  });

  it('gates a waived licence on Lucra earning anything at all', () => {
    const waived = deal({ freeLicense: true, post: { operator: 50, lucra: 50 } });
    expect(TPrecommend(waived, 4000).cleared).toBe(true);
    const nothing = deal({ freeLicense: true, post: { operator: 100, lucra: 0 } });
    expect(TPrecommend(nothing, 4000).chosen.tests.lucraCoversLicence).toBe(false);
    expect(TPrecommend(nothing, 4000).cleared).toBe(false);
  });

  it('takes the reward cost ratio from the deal, else from the tournaments, and never assumes a discount', () => {
    expect(TPrewardCostRatio(TPstate(coreDeal()))).toBeCloseTo(200 / 500, 9);
    expect(TPrewardCostRatio(TPstate(coreDeal({ rewardCostRatio: 25 })))).toBeCloseTo(0.25, 9);
    expect(TPrewardCostRatio(TPstate(coreDeal({ rewardCostRatio: '' })))).toBeCloseTo(0.4, 9);
    // A deal with only money prizes has no in-kind ratio to draw on: full cost.
    expect(TPrewardCostRatio(TPstate(coreDeal({ tournaments: [{ id: 'c', name: 'C', entryPrice: 10, eventsPerMonth: 1, basis: 'count', participants: 100, isCash: true, cashPrizeAmount: 300 }] })))).toBe(1);
    // A product's own list can be asked for; mini games with none entered is full cost.
    expect(TPrewardCostRatio(TPstate(deal()), 'mini')).toBe(1);
  });

  it('tries the tournament programme first, then the take fee, and locations only for a multi-site deal', () => {
    // The venue's reward cost ratio is entered on the deal, so the in-kind lever exists.
    const r = TPrecommend(deal({ rewardCostRatio: 40 }), 3000);
    expect(r.cleared).toBe(false);
    const levers = TPrecLevers(deal({ rewardCostRatio: 40 }), 3000, r.chosen.step);
    const keys = levers.map((l) => l.key);
    expect(keys).not.toContain('locations');
    // Within the ones that do not clear, the commercial order holds.
    const shortKeys = levers.filter((l) => !l.clears).map((l) => l.key);
    expect(shortKeys.indexOf('events')).toBeLessThan(shortKeys.indexOf('price'));
    expect(shortKeys.indexOf('price')).toBeLessThan(shortKeys.indexOf('reward-cost'));
    // Every lever reports what it does to the gap, and one clears here.
    levers.forEach((l) => { expect(l.gapAfter).toBeLessThanOrEqual(l.gapBefore + 1e-6); });
    const fee = levers.find((l) => l.key === 'take-fee');
    expect(fee.clears).toBe(true);
    expect(fee.apply.rake).toBeLessThanOrEqual(25);
    expect(fee.apply.rake).toBeGreaterThan(r.chosen.step.rake);
    expect(levers[0].key).toBe('take-fee'); // the one that clears leads
  });

  it('offers another location only when a core customer already has more than one', () => {
    const multi = coreDeal({ termYears: 2, annualFees: [120000, 120000, 0, 0, 0], locations: [1, 2, 2, 2, 2], mau: 1500 });
    const r = TPrecommend(multi, 1500);
    expect(r.product).toBe('core');
    const levers = TPrecLevers(multi, 1500, r.chosen.step);
    const loc = levers.find((l) => l.key === 'locations');
    expect(loc).toBeTruthy();
    expect(loc.apply.locations).toEqual([1, 3]);
    expect(loc.gapAfter).toBeLessThan(loc.gapBefore);
    // With a stated schedule the lever adds an opening in the last year instead.
    const stated = coreDeal({ termYears: 2, annualFees: [120000, 120000, 0, 0, 0], openings: [{ month: 1, add: 1 }, { month: 14, add: 1 }], mau: 1500 });
    const lever = TPrecLevers(stated, 1500, TPrecommend(stated, 1500).chosen.step).find((l) => l.key === 'locations');
    expect(lever.apply.openings).toEqual([{ month: 1, add: 1 }, { month: 14, add: 1 }, { month: 13, add: 1 }]);
    expect(lever.detail).toContain('1 → 2 becomes 1 → 3');
    // Mini games never get a locations lever, whatever the venues do.
    const miniMulti = deal({ termYears: 2, annualFees: [120000, 120000, 0, 0, 0], locations: [1, 2, 2, 2, 2], customerType: 'both' });
    expect(TPrecLevers(miniMulti, 1500, TPrecommend(miniMulti, 1500).chosen.step).map((l) => l.key)).not.toContain('locations');
  });

  it('returns no levers for a deal that already clears', () => {
    const r = TPrecommend(deal(), 1000000);
    expect(TPrecLevers(deal(), 1000000, r.chosen.step)).toEqual([]);
  });

  it('an applied lever changes the deal, and the recommender then agrees with itself', () => {
    const { TPrecAdjust, TPrecProgramme } = calc;
    const r = TPrecommend(deal(), 3000);
    const fee = TPrecLevers(deal(), 3000, r.chosen.step).find((l) => l.key === 'take-fee');
    // The take fee lives on the deal's head-to-head inputs; once set, the
    // ladder is floored at it and the same base now clears.
    const after = TPrecommend(deal(), 3000, { rakeFloor: fee.apply.rake });
    expect(after.cleared).toBe(true);
    expect(after.chosen.cfg.feeRate).toBe(fee.apply.rake);
    expect(after.chosen.step.rakeFromDeal).toBe(true);
    expect(TPrecLevers(deal(), 3000, after.chosen.step, { rakeFloor: fee.apply.rake })).toEqual([]);
    // A floor below the step leaves the ladder alone, and the band caps it.
    expect(TPrecommend(deal(), 3000, { rakeFloor: 5 }).chosen.step.rakeFromDeal).toBeUndefined();
    expect(TPrecommend(deal(), 3000, { rakeFloor: 40 }).chosen.cfg.feeRate).toBe(25);

    // Programme levers are patches to the deal that survive a change of base.
    const events = TPrecLevers(deal(), 3000, r.chosen.step).find((l) => l.key === 'events');
    expect(events.apply.product).toBe('mini');
    const patched = deal({ mini: { recAdjust: Object.assign({}, TPrecAdjust(TPstate(deal()), 'mini'), events.apply.adjust) } });
    expect(TPrecAdjust(TPstate(patched), 'mini').events).toBe(1);
    expect(TPrecProgramme(TPstate(patched), 3000, 'mini')[0].eventsPerMonth).toBe(5);
    expect(TPrecProgramme(TPstate(patched), 9000, 'mini')[0].eventsPerMonth).toBe(5);
    expect(TPrecommend(patched, 3000).chosen.state.mini.tournaments[0].eventsPerMonth).toBe(5);
    // Prices double once; the reward-cost lever is offered once, at the venue's ratio.
    const priced = deal({ mini: { recAdjust: { priceMult: 2 } } });
    const pr = TPrecommend(priced, 3000);
    const again = TPrecLevers(priced, 3000, pr.chosen.step).map((l) => l.key);
    expect(again).not.toContain('price');
    const inKind = deal({ mini: { recAdjust: { rewardAtRatio: true } }, rewardCostRatio: 30 });
    const prog = TPrecProgramme(TPstate(inKind), 3000, 'mini');
    prog.forEach((t) => { expect(t.isCash).toBe(false); expect(t.customerCashCost).toBe(Math.round(t.rewardFaceValue * 0.3)); });
    expect(TPrecLevers(inKind, 3000, pr.chosen.step).map((l) => l.key)).not.toContain('reward-cost');
  });
});

describe('Two products under one licence', () => {
  const { TPlocations, TPopenings, TPschedule, TPscheduleStated, TPlocationsOpen, TPminiBase, TPprizeMultiplier, TPcustomerDefaults } = calc;
  const t = { id: 'w', name: 'Weekly', entryPrice: 10, eventsPerMonth: 4, basis: 'count', participants: 100, rebuyMode: 'avg', rebuys: 0, isCash: false, rewardFaceValue: 500, customerCashCost: 200 };
  const venue = (o = {}) => base(Object.assign({
    customerType: 'venues', termYears: 2, annualFees: [60000, 60000], mau: 8000, locations: [1, 3],
    includeH2H: false, tournaments: [t],
  }, o));

  it('migrates a v2 deal onto core and leaves mini games off', () => {
    const s = TPstate({ includeTournaments: true, includeH2H: true, h2hReach: 5000, h2hMode: 'wagering', mau: 20000, tournaments: [t], recAdjust: { events: 2 } });
    expect(s.core.on).toBe(true);
    expect(s.core.tournamentsOn).toBe(true);
    expect(s.core.h2hOn).toBe(true);
    expect(s.core.h2h.reach).toBe(5000);
    expect(s.core.h2h.mode).toBe('wagering');
    expect(s.core.tournaments.map((x) => x.id)).toEqual(['w']);
    expect(s.core.tournaments[0].scope).toBe('each');
    expect(s.core.recAdjust.events).toBe(2);
    expect(s.mini.on).toBe(false);
    expect(s.tournaments).toBeUndefined();
    expect(s.includeH2H).toBeUndefined();
    expect(s.customerType).toBe('venues');
  });

  it('a stated opening schedule is the truth; the per-year spread is only the estimate', () => {
    const spread = TPstate(venue());
    expect(TPscheduleStated(spread)).toBe(false);
    expect(TPschedule(spread)).toEqual([{ month: 1, add: 1, source: 'fact' }, { month: 13, add: 1, source: 'estimate' }, { month: 19, add: 1, source: 'estimate' }]);
    expect(TPopenings(spread)).toEqual([1, 13, 19]);
    const stated = TPstate(venue({ openings: [{ month: 1, add: 1 }, { month: 14, add: 2 }, { month: 22, add: 1 }] }));
    expect(TPscheduleStated(stated)).toBe(true);
    expect(TPopenings(stated)).toEqual([1, 14, 14, 22]);
    expect(TPlocations(stated)).toEqual([1, 4]);
    expect(TPlocationsOpen(stated, 13)).toBe(1);
    expect(TPlocationsOpen(stated, 14)).toBe(3);
    expect(TPlocationsOpen(stated, 24)).toBe(4);
    // A schedule that forgets month one still starts with one location.
    expect(TPschedule(TPstate(venue({ openings: [{ month: 14, add: 2 }] })))[0]).toEqual({ month: 1, add: 1, source: 'fact' });
    // Openings past the term are ignored; zero-count entries are dropped.
    expect(TPopenings(TPstate(venue({ openings: [{ month: 1, add: 1 }, { month: 30, add: 5 }, { month: 6, add: 0 }] })))).toEqual([1]);
    // An app-only customer is one location whatever is entered.
    expect(TPlocations(TPstate(venue({ customerType: 'app', locations: [1, 5], openings: [{ month: 1, add: 3 }] })))).toEqual([1, 1]);
  });

  it('a stated schedule changes when the volume lands, and the result says so', () => {
    const spread = TPcalculate(venue());
    const late = TPcalculate(venue({ openings: [{ month: 1, add: 1 }, { month: 22, add: 2 }] }));
    // Two openings in month 22 contribute three months; the spread gave them 12 and 6.
    expect(late.totalHandle).toBeLessThan(spread.totalHandle);
    expect(late.scheduleStated).toBe(true);
    expect(spread.scheduleStated).toBe(false);
    expect(late.months[20].locationsOpen).toBe(1);
    expect(late.months[21].locationsOpen).toBe(3);
    expect(late.months[21].handle).toBeCloseTo(4000 * 3, 6);
  });

  it('a core tournament at every location funds its prize once per location open; one across the network funds it once', () => {
    const each = TPcalculate(venue({ openings: [{ month: 1, add: 1 }, { month: 13, add: 2 }] }));
    expect(each.months[0].prizeCost).toBe(800);
    expect(each.months[12].prizeCost).toBe(800 * 3);
    expect(each.months[12].detail[0].prizeMultiplier).toBe(3);
    const network = TPcalculate(venue({ openings: [{ month: 1, add: 1 }, { month: 13, add: 2 }], tournaments: [Object.assign({}, t, { scope: 'network' })] }));
    expect(network.months[12].prizeCost).toBe(800);
    // Entries are the same either way: the players are the players.
    expect(network.months[12].handle).toBeCloseTo(each.months[12].handle, 6);
    expect(TPprizeMultiplier(TPstate(venue()), t, 24)).toBe(3);
    expect(TPprizeMultiplier(TPstate(venue()), Object.assign({}, t, { scope: 'network' }), 24)).toBe(1);
  });

  it('mini games run on the whole base and never per location', () => {
    const both = venue({
      customerType: 'both', mini: { on: true, tournamentsOn: true, h2hOn: false, mauMode: 'derived', tournaments: [{ id: 'm', name: 'App weekly', entryPrice: 5, eventsPerMonth: 4, basis: 'mau', participantPct: 1, customerCashCost: 300, rewardFaceValue: 300 }] },
    });
    const s = TPstate(both);
    expect(s.mini.tournaments[0].scope).toBe('network');
    // Derived base is the venue base times locations open.
    expect(TPminiBase(s, 1)).toBe(8000);
    expect(TPminiBase(s, 24)).toBe(24000);
    const r = TPcalculate(both);
    const m1 = r.months[0].products, m24 = r.months[23].products;
    expect(m1.mini.handle).toBeCloseTo(8000 * 0.01 * 5 * 4, 6);
    expect(m24.mini.handle).toBeCloseTo(24000 * 0.01 * 5 * 4, 6);
    // The prize is funded once a month, whatever the venues do.
    expect(m24.mini.prizeCost).toBe(300 * 4);
    expect(r.byProduct.core.handle).toBeGreaterThan(0);
    expect(r.byProduct.mini.handle).toBeGreaterThan(0);
    expect(r.byProduct.core.handle + r.byProduct.mini.handle).toBeCloseTo(r.totalHandle, 6);
    // An entered app MAU replaces the derived one and stops growing with openings.
    const entered = TPcalculate(base(Object.assign({}, both, { mini: Object.assign({}, both.mini, { mauMode: 'entered', mau: 50000 }) })));
    expect(entered.months[0].products.mini.handle).toBeCloseTo(50000 * 0.01 * 5 * 4, 6);
    expect(entered.months[23].products.mini.handle).toBeCloseTo(50000 * 0.01 * 5 * 4, 6);
  });

  it('core head-to-head runs per location on its own inputs; mini head-to-head runs on the app base', () => {
    const s = venue({ includeH2H: true, core: { h2h: { engagement: 10, playsPerUser: 20, spendPerPlay: 2, feeRate: 10 } } });
    const r = TPcalculate(s);
    // 8,000 x 10% x 20 x $2 x 10% = $3,200 per location.
    expect(r.months[0].products.core.h2hFee).toBeCloseTo(3200, 6);
    expect(r.months[23].products.core.h2hFee).toBeCloseTo(3200 * 3, 6);
    const app = base({ customerType: 'app', includeTournaments: false, includeH2H: false, mau: 100000, annualFees: [60000],
      mini: { on: true, tournamentsOn: false, h2hOn: true, h2h: { engagement: 5, playsPerUser: 10, spendPerPlay: 1, feeRate: 20 } } });
    const ra = TPcalculate(app);
    expect(ra.months[0].products.mini.h2hFee).toBeCloseTo(100000 * 0.05 * 10 * 1 * 0.2, 6);
    expect(ra.months[0].products.core.h2hFee).toBe(0);
    // The Mini Game tab's config overrides the mini inputs, never the core ones.
    const cfg = { engagement: 10, playsPerUser: 20, spendPerPlay: 2, feeRate: 10, rewardGames: 0, winRate: 0, redeemRate: 0, valuePerRedemption: 0 };
    expect(TPcalculate(app, cfg).months[0].products.mini.h2hFee).toBeCloseTo(100000 * 0.1 * 20 * 2 * 0.1, 6);
    expect(TPcalculate(s, cfg).months[0].products.core.h2hFee).toBeCloseTo(3200, 6);
  });

  it('a customer type sets defaults for the products and the location model', () => {
    expect(TPcustomerDefaults('app')).toEqual({ core: false, mini: true, singleLocation: true });
    expect(TPcustomerDefaults('venues')).toEqual({ core: true, mini: false, singleLocation: false });
    expect(TPcustomerDefaults('both')).toEqual({ core: true, mini: true, singleLocation: false });
    // A digital platform with its own game is core at a single location.
    const digitalCore = base({ customerType: 'app', includeTournaments: true, includeH2H: true, mau: 40000, locations: [1, 4, 4, 4, 4], termYears: 2, annualFees: [60000, 60000] });
    const r = TPcalculate(digitalCore);
    expect(r.months[23].locationsOpen).toBe(1);
    expect(r.months[23].prizeCost).toBe(800);
    expect(r.months[0].products.core.h2hFee).toBeCloseTo(40000 * 0.1 * 20 * 2 * 0.1, 6);
  });

  it('needs at least one product with something in it, and a base for each product that uses one', () => {
    expect(TPvalidate(base({ includeTournaments: false, includeH2H: false })).join(' ')).toMatch(/at least one product/i);
    expect(TPvalidate(base({ includeTournaments: false, includeH2H: false, mini: { on: true, tournamentsOn: false, h2hOn: true }, mau: 0 })).join(' ')).toMatch(/app or site users/i);
    expect(TPvalidate(base({ includeTournaments: false, includeH2H: false, customerType: 'app', mau: 50000, mini: { on: true, tournamentsOn: true, h2hOn: false, tournaments: [] } })).join(' ')).toMatch(/mini games/i);
  });
});

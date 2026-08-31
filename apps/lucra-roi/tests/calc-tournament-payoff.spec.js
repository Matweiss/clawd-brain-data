import { describe, it, expect } from 'vitest';
import calc from './calc-functions.js';

const { TPcalculate, TPparticipants, TPsplitRates, TPvalidate, TPcustomerProjection, TPstate, TPtypeParticipants, TPentriesPerEvent, TP_DEFAULTS } = calc;
const TPstateFromLegacy = (o) => TPstate(o);

// One tournament: 100 participants, no rebuys, $10 entry, 4 events, $200 cash
// cost per event -> handle 4000, prize 800, net 3200.
const base = (o = {}) => Object.assign(JSON.parse(JSON.stringify(TP_DEFAULTS)), {
  termYears: 1,
  annualFees: [60000],
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
    // Wording changed to satisfy the lucra-model-onepager blocked-vocabulary rule.
    expect(TPcustomerProjection(s).tournaments[0].rewardLabel).toBe('$300 prize pool');
  });

  it('a non-cash tournament advertises face value but charges cash cost', () => {
    const p = TPcustomerProjection(base());
    expect(p.tournaments[0].rewardLabel).toBe('$500 value reward');
    expect(TPcalculate(base()).months[0].prizeCost).toBe(800);
  });
});

describe('Prize cost is deducted before the split', () => {
  it('net revenue is handle minus prize cost', () => {
    expect(TPcalculate(base({ annualFees: [1e6] })).months[0].netRevenue).toBe(3200);
  });

  it('all three parties fund prizes pro rata', () => {
    const m = TPcalculate(base({ annualFees: [1e6] })).months[0];
    expect(m.toLicense).toBe(1600);
    expect(m.toOperator).toBe(1280);
    expect(m.toLucra).toBe(320);
  });

  it('a loss-making month floors net at zero but still reports raw handle and cost', () => {
    const s = base({ annualFees: [1e6], tournaments: [{ name: 'L', entryPrice: 1, eventsPerMonth: 1, rebuys: 0, customerCashCost: 5000 }] });
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
    const m = TPcalculate(base({ splitMode: 'sweep', annualFees: [1e6] })).months[0];
    expect(m.toLicense).toBeCloseTo(2880, 9);
    expect(m.toOperator).toBe(0);
    expect(m.toLucra).toBeCloseTo(320, 9);
  });

  it('custom percentages are honoured', () => {
    const m = TPcalculate(base({ splitMode: 'custom', custom: { credit: 60, operator: 25, lucra: 15 }, annualFees: [1e6] })).months[0];
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
  const r = () => TPcalculate(base({ annualFees: [4000] }));

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
  const r = () => TPcalculate(base({ annualFees: [500000] }));

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
    const json = JSON.stringify(TPcustomerProjection(base({ annualFees: [987654], splitMode: 'sweep' })));
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
    expect(TPvalidate(base({ annualFees: [0] })).join(' ')).toMatch(/licence fee/i);
  });

  it('requires at least one tournament type', () => {
    expect(TPvalidate(base({ tournaments: [] })).join(' ')).toMatch(/at least one tournament/i);
  });

  it('rejects a post-payoff split that does not sum to 100', () => {
    expect(TPvalidate(base({ post: { operator: 80, lucra: 10 } })).join(' ')).toMatch(/Post-payoff split/);
  });
});

describe('Multi-year terms with custom fees per year', () => {
  // 3200 net per month, standard 50% credit -> 1600 of licence credit per month.
  const multi = (o = {}) => base(Object.assign({ termYears: 3, annualFees: [12000, 48000, 48000] }, o));

  it('runs twelve months per contract year', () => {
    expect(TPcalculate(multi()).months).toHaveLength(36);
    expect(TPcalculate(base({ termYears: 2, annualFees: [1000, 2000] })).months).toHaveLength(24);
  });

  it('numbers months within their year and tags the year', () => {
    const m = TPcalculate(multi()).months;
    expect(m[12]).toMatchObject({ month: 13, year: 2, monthInYear: 1 });
    expect(m[35]).toMatchObject({ month: 36, year: 3, monthInYear: 12 });
  });

  it('accepts a different custom amount for every year', () => {
    const r = TPcalculate(multi());
    expect(r.years.map((y) => y.fee)).toEqual([12000, 48000, 48000]);
    expect(r.totalContract).toBe(108000);
  });

  it('only uses as many fees as the term has years', () => {
    const r = TPcalculate(base({ termYears: 2, annualFees: [10000, 20000, 999999] }));
    expect(r.totalContract).toBe(30000);
    expect(r.years).toHaveLength(2);
  });

  describe('whole-term basis', () => {
    const r = () => TPcalculate(multi({ payoffBasis: 'term', annualFees: [12000, 12000, 12000] }));

    it('treats every year as one cumulative balance', () => {
      // 36000 total at 1600 of credit per month clears halfway through month 23.
      expect(r().payoffMonth).toBeCloseTo(22.5, 6);
      expect(r().balanceDue).toBe(0);
    });

    it('redirects to the operator for the rest of the term once cleared', () => {
      const months = r().months;
      expect(months[35].split).toBe('Post-payoff');
      expect(months[35].toOperator).toBeCloseTo(3200 * 0.9, 6);
      expect(months[35].toLicense).toBe(0);
    });

    it('charges no cash true-up', () => {
      expect(r().trueUpTotal).toBe(0);
    });

    it('lets a strong year one pay down later years', () => {
      const r2 = TPcalculate(multi({ payoffBasis: 'term', annualFees: [1000, 1000, 34000] }));
      // Year one activity credits against the whole contract, not just year one's fee.
      expect(r2.years[0].credited).toBeCloseTo(1600 * 12, 6);
    });
  });

  describe('per-year basis', () => {
    it('opens a fresh balance at each step-up', () => {
      const r = TPcalculate(multi({ payoffBasis: 'annual', annualFees: [12000, 12000, 12000] }));
      expect(r.years[0].opening).toBe(12000);
      expect(r.years[1].opening).toBe(12000);
      // 12000 at 1600/mo clears part-way through month 8 of each year.
      expect(r.years[0].clearMonth).toBeGreaterThan(7);
      expect(r.years[0].clearMonth).toBeLessThan(8);
      expect(r.years[1].clearMonth).toBeGreaterThan(19);
      expect(r.years[1].clearMonth).toBeLessThan(20);
    });

    it('drops back to the payoff split when the next year opens', () => {
      const m = TPcalculate(multi({ payoffBasis: 'annual', annualFees: [12000, 12000, 12000] })).months;
      expect(m[11].split).toBe('Post-payoff');   // month 12, year one already cleared
      expect(m[12].split).toBe('Payoff');        // month 13, year two balance opens
      expect(m[12].toLicense).toBeCloseTo(1600, 6);
    });

    it('rolls an unretired balance into the next year when set to roll', () => {
      const r = TPcalculate(multi({ payoffBasis: 'annual', shortfall: 'roll', annualFees: [30000, 10000, 10000] }));
      // Year one credits 19200 of 30000, leaving 10800 to carry.
      expect(r.years[0].credited).toBeCloseTo(19200, 6);
      expect(r.years[0].closing).toBeCloseTo(10800, 6);
      expect(r.years[0].trueUp).toBe(0);
      expect(r.years[1].opening).toBeCloseTo(10800 + 10000, 6);
      expect(r.trueUpTotal).toBe(0);
    });

    it('charges a cash true-up at year end when set to cash', () => {
      const r = TPcalculate(multi({ payoffBasis: 'annual', shortfall: 'cash', annualFees: [30000, 10000, 10000] }));
      expect(r.years[0].trueUp).toBeCloseTo(10800, 6);
      expect(r.years[1].opening).toBe(10000);
      expect(r.trueUpTotal).toBeCloseTo(10800, 6);
    });

    it('reports a per-year clear month or none', () => {
      const r = TPcalculate(multi({ payoffBasis: 'annual', shortfall: 'cash', annualFees: [30000, 10000, 10000] }));
      expect(r.years[0].clearMonth).toBeNull();
      expect(r.years[1].clearMonth).not.toBeNull();
    });
  });

  it('reconciles every month across the whole term in both bases', () => {
    ['term', 'annual'].forEach((payoffBasis) => {
      TPcalculate(multi({ payoffBasis })).months.forEach((m) => {
        expect(m.toLicense + m.toOperator + m.toLucra).toBeCloseTo(m.netRevenue, 6);
      });
    });
  });

  it('never credits more than the contract is worth', () => {
    const r = TPcalculate(multi({ payoffBasis: 'term', annualFees: [1000, 1000, 1000] }));
    expect(r.cumulativeLicense).toBeCloseTo(3000, 6);
  });

  it('a free licence ignores the fee schedule entirely', () => {
    const r = TPcalculate(multi({ freeLicense: true }));
    expect(r.totalContract).toBe(0);
    expect(r.months).toHaveLength(36);
    r.months.forEach((m) => expect(m.toLicense).toBe(0));
  });

  it('migrates single-fee state saved by the first release', () => {
    const legacy = TPstateFromLegacy({ licenseFee: 25000, participants: 100 });
    expect(legacy.annualFees[0]).toBe(25000);
    expect(legacy.termYears).toBe(1);
  });

  it('rejects a fee schedule that is entirely zero', () => {
    expect(TPvalidate(base({ termYears: 2, annualFees: [0, 0] })).join(' ')).toMatch(/licence fee for at least one year/i);
  });

  it('caps the term at five years', () => {
    expect(TPcalculate(base({ termYears: 9, annualFees: [1, 1, 1, 1, 1] })).months).toHaveLength(60);
  });
});

describe('MAU-based participation', () => {
  const mauBase = (o = {}) => base(Object.assign({
    participantBasis: 'mau', mau: 20000, participantPct: 1,
    tournaments: [{ id: 't', name: 'Open', entryPrice: 10, eventsPerMonth: 4, rebuys: 0, rebuyMode: 'avg', participationMode: 'shared', customerCashCost: 200 }],
  }, o));

  it('derives participants from MAU times the participation rate', () => {
    expect(TPparticipants(mauBase(), 1)).toBe(200);
    expect(TPcalculate(mauBase()).months[0].detail[0].entriesPerEvent).toBe(200);
  });

  it('scales with MAU', () => {
    expect(TPparticipants(mauBase({ mau: 50000 }), 1)).toBe(500);
    expect(TPparticipants(mauBase({ participantPct: 2.5 }), 1)).toBe(500);
  });

  it('ramps the percentage, not just the headcount', () => {
    const s = mauBase({ volumeMode: 'ramp', rampStartPct: 1, rampPlateauPct: 5, rampMonths: 5 });
    expect(TPparticipants(s, 1)).toBe(200);
    expect(TPparticipants(s, 5)).toBe(1000);
    expect(TPparticipants(s, 12)).toBe(1000);
    expect(TPparticipants(s, 3)).toBeCloseTo(20000 * (1 + 4 * 2 / 4) / 100, 6);
  });

  it('requires MAU when the basis is a share of it', () => {
    expect(TPvalidate(mauBase({ mau: 0 })).join(' ')).toMatch(/monthly active users/i);
  });

  it('leaves the headcount basis untouched', () => {
    expect(TPvalidate(base({ mau: 0 }))).toEqual([]);
    expect(TPparticipants(base(), 1)).toBe(100);
  });
});

describe('Per-tournament participation', () => {
  const two = (o = {}) => base(Object.assign({
    participants: 100,
    tournaments: [
      { id: 'a', name: 'Dollar open', entryPrice: 1, eventsPerMonth: 4, participationMode: 'custom', participantsCustom: 400, rebuyMode: 'avg', rebuys: 0, customerCashCost: 0 },
      { id: 'b', name: 'Headline', entryPrice: 20, eventsPerMonth: 1, participationMode: 'shared', rebuyMode: 'avg', rebuys: 0, customerCashCost: 0 },
    ],
  }, o));

  it('lets a cheap tournament draw its own crowd', () => {
    const d = TPcalculate(two()).months[0].detail;
    expect(d[0].participants).toBe(400);
    expect(d[1].participants).toBe(100);
    expect(d[0].handle).toBe(400 * 1 * 4);
    expect(d[1].handle).toBe(100 * 20 * 1);
  });

  it('falls back to the shared number when not overridden', () => {
    const shared = two({ tournaments: [{ id: 'a', name: 'A', entryPrice: 1, eventsPerMonth: 1, participationMode: 'shared', rebuyMode: 'avg', customerCashCost: 0 }] });
    expect(TPcalculate(shared).months[0].detail[0].participants).toBe(100);
  });

  it('reads a custom count as the number at full ramp and ramps it too', () => {
    const s = two({ volumeMode: 'ramp', rampStart: 50, rampPlateau: 200, rampMonths: 5 });
    const m1 = TPcalculate(s).months[0].detail[0];
    const m5 = TPcalculate(s).months[4].detail[0];
    expect(m5.participants).toBe(400);
    expect(m1.participants).toBeCloseTo(400 * (50 / 200), 6);
  });

  it('supports a custom share of MAU per tournament', () => {
    const s = two({
      participantBasis: 'mau', mau: 20000, participantPct: 1,
      tournaments: [{ id: 'a', name: 'A', entryPrice: 1, eventsPerMonth: 1, participationMode: 'custom', participantPctCustom: 4, rebuyMode: 'avg', customerCashCost: 0 }],
    });
    expect(TPcalculate(s).months[0].detail[0].participants).toBe(800);
  });
});

describe('Percentage-based rebuys', () => {
  const withRebuy = (t) => base({
    participants: 100,
    tournaments: [Object.assign({ id: 'a', name: 'A', entryPrice: 10, eventsPerMonth: 1, participationMode: 'shared', customerCashCost: 0 }, t)],
  });

  it('treats the rate as extra entries as a share of participants', () => {
    expect(TPcalculate(withRebuy({ rebuyMode: 'pct', rebuyPct: 40 })).months[0].detail[0].entriesPerEvent).toBe(140);
    expect(TPcalculate(withRebuy({ rebuyMode: 'pct', rebuyPct: 0 })).months[0].detail[0].entriesPerEvent).toBe(100);
  });

  it('allows more than one rebuy each above 100%', () => {
    expect(TPcalculate(withRebuy({ rebuyMode: 'pct', rebuyPct: 250 })).months[0].detail[0].entriesPerEvent).toBe(350);
  });

  it('matches the average mode at equivalent settings', () => {
    const pct = TPcalculate(withRebuy({ rebuyMode: 'pct', rebuyPct: 150 })).months[0].handle;
    const avg = TPcalculate(withRebuy({ rebuyMode: 'avg', rebuys: 1.5 })).months[0].handle;
    expect(pct).toBe(avg);
  });

  it('ignores the unused field when switching modes', () => {
    expect(TPcalculate(withRebuy({ rebuyMode: 'pct', rebuyPct: 40, rebuys: 9 })).months[0].detail[0].entriesPerEvent).toBe(140);
    expect(TPcalculate(withRebuy({ rebuyMode: 'avg', rebuys: 1, rebuyPct: 900 })).months[0].detail[0].entriesPerEvent).toBe(200);
  });

  it('describes a percentage rebuy to customers without publishing the estimate', () => {
    const p = TPcustomerProjection(withRebuy({ rebuyMode: 'pct', rebuyPct: 40 }));
    expect(p.tournaments[0].rebuyLabel).toBe('Rebuys available');
    expect(JSON.stringify(p)).not.toContain('40');
  });
});

describe('Loss visibility', () => {
  it('counts months where prize cost exceeds handle', () => {
    const s = base({ tournaments: [{ id: 'a', name: 'A', entryPrice: 1, eventsPerMonth: 1, participationMode: 'shared', rebuyMode: 'avg', customerCashCost: 5000 }] });
    const r = TPcalculate(s);
    expect(r.lossMonths).toBe(12);
    expect(r.months[0].grossMargin).toBe(-4900);
    expect(r.months[0].netRevenue).toBe(0);
  });

  it('flags the losing tournament type in the month detail', () => {
    const s = base({ tournaments: [{ id: 'a', name: 'A', entryPrice: 1, eventsPerMonth: 1, participationMode: 'shared', rebuyMode: 'avg', customerCashCost: 5000 }] });
    expect(TPcalculate(s).months[0].detail[0].loss).toBe(true);
  });
});

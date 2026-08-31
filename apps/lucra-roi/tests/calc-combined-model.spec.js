import { describe, it, expect } from 'vitest';
import calc from './calc-functions.js';

const { TPCcase, TPCcases, TPheatMap, TPscaled, TPcalculate, TPvalidate, TP_DEFAULTS } = calc;

// Head-to-head is off by default, so the combined fixtures opt in explicitly.
const tournament = (o = {}) => Object.assign(JSON.parse(JSON.stringify(TP_DEFAULTS)), {
  annualFees: [60000], termYears: 1, participants: 100,
  includeTournaments: true, includeH2H: true,
  tournaments: [{ id: 't', name: 'Open', entryPrice: 10, eventsPerMonth: 4, participationMode: 'shared', rebuyMode: 'avg', rebuys: 0, isCash: false, rewardFaceValue: 500, customerCashCost: 200 }],
}, o);

const cfg = (o = {}) => Object.assign({
  mau: 1000000, engagement: 10, playsPerUser: 20, spendPerPlay: 2, feeRate: 10,
  tournament: tournament(),
}, o);

describe('Combined revenue model', () => {
  it('reports revenue generated before any split', () => {
    const r = TPCcase(cfg());
    // 1,000,000 x 10% = 100,000 engaged; x20 plays x $2 = $4,000,000 volume; x10% = $400,000 fee.
    expect(r.engaged).toBe(100000);
    expect(r.paidVolume).toBe(4000000);
    expect(r.p2pFee).toBe(400000);
    // Tournament net: 100 participants x $10 x 4 events = 4,000 less 800 prize cost.
    expect(r.tournamentNet).toBeCloseTo(3200, 6);
    expect(r.revenueGenerated).toBeCloseTo(403200, 6);
    expect(r.annualRevenueGenerated).toBeCloseTo(403200 * 12, 6);
  });

  it('drives both products from one monthly active base', () => {
    const doubled = TPCcase(cfg({ mau: 2000000 }));
    expect(doubled.p2pFee).toBe(800000);
    // Tournaments only follow MAU when their basis is a share of it.
    expect(doubled.tournamentNet).toBeCloseTo(3200, 6);

    const share = TPCcase(cfg({ tournament: tournament({ participantBasis: 'mau', mau: 0, participantPct: 0.01 }) , mau: 2000000 }));
    expect(share.tournamentParticipants).toBeCloseTo(200, 6);
  });

  it('reports the combined engaged share so an implausible total is visible', () => {
    const r = TPCcase(cfg({ engagement: 60, tournament: tournament({ participantBasis: 'mau', participantPct: 30 }) }));
    expect(r.combinedShare).toBeGreaterThan(60);
    expect(r.engagement).toBe(60);
  });

  it('never lets an engagement multiplier push participation past 100%', () => {
    expect(TPCcase(cfg({ engagement: 80 }), 1.5).engagement).toBe(100);
  });

  it('produces three cases with the low one below the entered rate', () => {
    const cases = TPCcases(cfg());
    expect(cases.map((c) => c.key)).toEqual(['conservative', 'expected', 'best']);
    expect(cases[0].result.factor).toBe(0.5);
    expect(cases[1].result.factor).toBe(1);
    expect(cases[2].result.factor).toBe(1.5);
    expect(cases[0].result.revenueGenerated).toBeLessThan(cases[1].result.revenueGenerated);
    expect(cases[2].result.revenueGenerated).toBeGreaterThan(cases[1].result.revenueGenerated);
  });

  it('scales the cases off the entered assumption, not a fixed benchmark', () => {
    const low = TPCcases(cfg({ engagement: 4 }));
    const high = TPCcases(cfg({ engagement: 20 }));
    expect(low[2].result.engagement).toBeCloseTo(6, 6);
    expect(high[2].result.engagement).toBeCloseTo(30, 6);
  });

  it('reports zero tournament revenue rather than throwing when tournaments are invalid', () => {
    const r = TPCcase(cfg({ tournament: tournament({ tournaments: [] }) }));
    expect(r.tournamentNet).toBe(0);
    expect(r.p2pFee).toBe(400000);
  });
});

describe('Break-even heat map', () => {
  it('builds a five by five grid around the current setting', () => {
    const m = TPheatMap(tournament());
    expect(m.prices).toEqual([5, 7.5, 10, 12.5, 15]);
    expect(m.participation).toEqual([50, 75, 100, 125, 150]);
    expect(m.cells).toHaveLength(5);
    expect(m.cells[0]).toHaveLength(5);
  });

  it('the centre cell matches the unscaled model', () => {
    const s = tournament({ annualFees: [4000] });
    const direct = TPcalculate(s);
    const centre = TPheatMap(s).cells[2][2];
    expect(centre.status).toBe('clear');
    expect(centre.month).toBeCloseTo(direct.payoffMonth, 6);
  });

  it('reports how far a missing cell got instead of hiding it', () => {
    const m = TPheatMap(tournament({ annualFees: [500000] }));
    const centre = m.cells[2][2];
    expect(centre.status).toBe('miss');
    expect(centre.month).toBeNull();
    expect(centre.retired).toBeGreaterThan(0);
    expect(centre.retired).toBeLessThan(1);
  });

  it('more participation and higher prices retire the licence sooner', () => {
    const m = TPheatMap(tournament({ annualFees: [40000] }));
    const low = m.cells[0][0], high = m.cells[4][4];
    if (low.status === 'clear' && high.status === 'clear') {
      expect(high.month).toBeLessThan(low.month);
    } else {
      expect(high.retired).toBeGreaterThan(low.retired);
    }
  });

  it('scales percentage participation on the MAU basis', () => {
    const m = TPheatMap(tournament({ participantBasis: 'mau', mau: 20000, participantPct: 2 }));
    expect(m.basisMau).toBe(true);
    expect(m.participation).toEqual([1, 1.5, 2, 2.5, 3]);
  });
});

describe('TPscaled', () => {
  it('scales participation and price without mutating the input', () => {
    const s = tournament();
    const scaled = TPscaled(s, 2, 3);
    expect(scaled.participants).toBe(200);
    expect(scaled.tournaments[0].entryPrice).toBe(30);
    expect(s.participants).toBe(100);
    expect(s.tournaments[0].entryPrice).toBe(10);
  });

  it('leaves fees, splits and prize costs alone', () => {
    const scaled = TPscaled(tournament(), 2, 2);
    expect(scaled.annualFees[0]).toBe(60000);
    expect(scaled.splitMode).toBe('standard');
    expect(scaled.tournaments[0].customerCashCost).toBe(200);
  });
});

describe('Product selection', () => {
  const only = (flags) => tournament(flags);

  it('tournaments only drops head-to-head from the total', () => {
    const r = TPCcase(cfg({ tournament: only({ includeH2H: false }) }));
    expect(r.includeH2H).toBe(false);
    expect(r.p2pFee).toBe(0);
    expect(r.tournamentNet).toBeCloseTo(3200, 6);
    expect(r.revenueGenerated).toBeCloseTo(3200, 6);
    expect(r.engagement).toBe(0);
  });

  it('head-to-head only drops tournaments from the total', () => {
    const r = TPCcase(cfg({ tournament: only({ includeTournaments: false }) }));
    expect(r.includeTournaments).toBe(false);
    expect(r.tournamentNet).toBe(0);
    expect(r.tournamentParticipants).toBe(0);
    expect(r.p2pFee).toBe(400000);
    expect(r.revenueGenerated).toBe(400000);
  });

  it('both selected is the sum of the two', () => {
    const both = TPCcase(cfg());
    const t = TPCcase(cfg({ tournament: only({ includeH2H: false }) }));
    const h = TPCcase(cfg({ tournament: only({ includeTournaments: false }) }));
    expect(both.revenueGenerated).toBeCloseTo(t.revenueGenerated + h.revenueGenerated, 6);
  });

  it('head-to-head only skips the tournament validation entirely', () => {
    // No tournament types and no licence fee, which would otherwise error.
    const s = only({ includeTournaments: false, tournaments: [], annualFees: [0] });
    expect(TPvalidate(s)).toEqual([]);
    expect(TPCcase(cfg({ tournament: s })).revenueGenerated).toBe(400000);
  });

  it('selecting nothing is an error rather than a silent zero', () => {
    const s = only({ includeTournaments: false, includeH2H: false });
    expect(TPvalidate(s).join(' ')).toMatch(/at least one product/i);
  });

  it('the engaged share reflects only the selected products', () => {
    const tOnly = TPCcase(cfg({ tournament: only({ includeH2H: false, participantBasis: 'mau', participantPct: 2 }) }));
    expect(tOnly.engagement).toBe(0);
    expect(tOnly.combinedShare).toBeCloseTo(tOnly.tournamentShare, 6);
  });
});

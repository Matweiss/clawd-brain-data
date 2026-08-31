import { describe, it, expect } from 'vitest';
import calc from './calc-functions.js';

const { TPh2h, TPCcase, TPCcases, TPheatMap, TPscaled, TPcalculate, TPvalidate, TPstate, TPpitchH2H, TPpitchTournaments, TP_DEFAULTS } = calc;

// Tournaments: 100 participants, $10 entry, 4 events, $200 cost per event
// -> 4,000 entries value less 800 prize cost = 3,200 net a month.
const deal = (o = {}) => Object.assign(JSON.parse(JSON.stringify(TP_DEFAULTS)), {
  termYears: 1, annualFees: [60000], mau: 1000000,
  includeTournaments: true, includeH2H: true,
  tournaments: [{ id: 't', name: 'Open', entryPrice: 10, eventsPerMonth: 4, basis: 'count', participants: 100, rebuyMode: 'avg', rebuys: 0, isCash: false, rewardFaceValue: 500, customerCashCost: 200 }],
}, o);

// Head-to-head inputs come from the Mini Game state, passed in as config.
const cfg = (o = {}) => Object.assign({
  engagement: 10, playsPerUser: 20, spendPerPlay: 2, feeRate: 10,
  rewardGames: 8, winRate: 50, redeemRate: 25, valuePerRedemption: 8,
  tournament: deal(),
}, o);

describe('Head-to-head on its own', () => {
  it('runs the paid-play funnel to a platform fee', () => {
    const h = TPh2h(deal(), cfg(), 1);
    expect(h.engaged).toBe(100000);
    expect(h.paidVolume).toBe(4000000);
    expect(h.platformFee).toBe(400000);
    expect(h.revenueGenerated).toBe(400000);
  });

  it('runs the reward funnel to redeemed venue value', () => {
    const h = TPh2h(deal(), cfg(), 1);
    expect(h.rewardRedemptions).toBe(100000);
    expect(h.rewardValue).toBe(800000);
    // Reward value is never part of revenue generated.
    expect(h.revenueGenerated).toBe(h.platformFee);
  });

  it('paid play only drops the reward funnel', () => {
    const h = TPh2h(deal({ h2hMode: 'wagering' }), cfg(), 1);
    expect(h.wagering).toBe(true);
    expect(h.rewards).toBe(false);
    expect(h.rewardValue).toBe(0);
    expect(h.platformFee).toBe(400000);
  });

  it('rewards only drops the paid-play funnel', () => {
    const h = TPh2h(deal({ h2hMode: 'rewards' }), cfg(), 1);
    expect(h.wagering).toBe(false);
    expect(h.paidVolume).toBe(0);
    expect(h.platformFee).toBe(0);
    expect(h.rewardValue).toBe(800000);
  });

  it('uses the head-to-head reach when it is set', () => {
    expect(TPh2h(deal({ h2hReach: 200000 }), cfg(), 1).engaged).toBe(20000);
  });

  it('takes Lucra share from the deal split rather than a head-to-head field', () => {
    expect(TPh2h(deal(), cfg(), 1).lucraShare).toBeCloseTo(400000 * 0.1, 6);
    const swept = TPh2h(deal({ splitMode: 'custom', custom: { credit: 50, operator: 30, lucra: 20 } }), cfg(), 1);
    expect(swept.lucraShare).toBeCloseTo(400000 * 0.2, 6);
  });

  it('a free licence on this tab waives the Lucra licence whatever other tabs hold', () => {
    const paid = TPh2h(deal({ annualFees: [120000] }), cfg(), 1);
    expect(paid.licenseMonthly).toBe(10000);
    const free = TPh2h(deal({ annualFees: [120000], freeLicense: true }), cfg(), 1);
    expect(free.licenseMonthly).toBe(0);
    expect(free.licenseWaived).toBe(true);
  });

  it('averages the launch ramp into the monthly figure', () => {
    const flat = TPh2h(deal(), cfg(), 1);
    const ramped = TPh2h(deal({ rampOn: true, rampStartPct: 0, rampMonths: 12 }), cfg(), 1);
    expect(ramped.engaged).toBeLessThan(flat.engaged);
    expect(ramped.platformFee).toBeLessThan(flat.platformFee);
  });

  it('reports nothing when head-to-head is not selected', () => {
    const h = TPh2h(deal({ includeH2H: false }), cfg(), 1);
    expect(h.on).toBe(false);
    expect(h.platformFee).toBe(0);
    expect(h.rewardValue).toBe(0);
  });
});

describe('Combined revenue model', () => {
  it('adds the two products without touching either', () => {
    const r = TPCcase(cfg());
    expect(r.p2pFee).toBe(400000);
    expect(r.tournamentNet).toBeCloseTo(3200, 6);
    expect(r.revenueGenerated).toBeCloseTo(403200, 6);
    expect(r.annualRevenueGenerated).toBeCloseTo(403200 * 12, 6);
  });

  it('tournaments only drops head-to-head from the total', () => {
    const r = TPCcase(cfg({ tournament: deal({ includeH2H: false }) }));
    expect(r.p2pFee).toBe(0);
    expect(r.revenueGenerated).toBeCloseTo(3200, 6);
  });

  it('head-to-head only drops tournaments from the total', () => {
    const r = TPCcase(cfg({ tournament: deal({ includeTournaments: false }) }));
    expect(r.tournamentNet).toBe(0);
    expect(r.revenueGenerated).toBe(400000);
  });

  it('the two halves sum to the whole', () => {
    const both = TPCcase(cfg()).revenueGenerated;
    const t = TPCcase(cfg({ tournament: deal({ includeH2H: false }) })).revenueGenerated;
    const h = TPCcase(cfg({ tournament: deal({ includeTournaments: false }) })).revenueGenerated;
    expect(both).toBeCloseTo(t + h, 6);
  });

  it('head-to-head only skips the tournament validation entirely', () => {
    const s = deal({ includeTournaments: false, tournaments: [], annualFees: [0] });
    expect(TPvalidate(s)).toEqual([]);
    expect(TPCcase(cfg({ tournament: s })).revenueGenerated).toBe(400000);
  });

  it('selecting nothing is an error, not a silent zero', () => {
    expect(TPvalidate(deal({ includeTournaments: false, includeH2H: false })).join(' ')).toMatch(/at least one product/i);
  });

  it('keeps reward value and the Lucra split out of revenue generated', () => {
    const withRewards = TPCcase(cfg());
    const without = TPCcase(cfg({ rewardGames: 0 }));
    expect(withRewards.rewardValue).toBeGreaterThan(0);
    expect(withRewards.revenueGenerated).toBe(without.revenueGenerated);
    const swept = TPCcase(cfg({ tournament: deal({ splitMode: 'sweep' }) }));
    expect(swept.p2pFee).toBe(withRewards.p2pFee);
  });

  it('reports the combined engaged share so an implausible total is visible', () => {
    const r = TPCcase(cfg({ engagement: 60, tournament: deal({ mau: 1000, tournaments: [{ id: 'a', name: 'A', entryPrice: 1, eventsPerMonth: 1, basis: 'mau', participantPct: 30, customerCashCost: 0 }] }) }));
    expect(r.combinedShare).toBeGreaterThan(60);
  });

  it('never lets a multiplier push engagement past 100%', () => {
    expect(TPCcase(cfg({ engagement: 80 }), 1.5).engagement).toBe(100);
  });

  it('produces three cases with the low one below the entered rate', () => {
    const cases = TPCcases(cfg());
    expect(cases.map((c) => c.key)).toEqual(['conservative', 'expected', 'best']);
    expect(cases[0].result.revenueGenerated).toBeLessThan(cases[1].result.revenueGenerated);
    expect(cases[2].result.revenueGenerated).toBeGreaterThan(cases[1].result.revenueGenerated);
  });

  it('scales both products in every case', () => {
    const cases = TPCcases(cfg());
    // Head-to-head is linear in engagement, so the fee scales exactly.
    expect(cases[0].result.p2pFee).toBeCloseTo(cases[1].result.p2pFee * 0.5, 6);
    expect(cases[2].result.p2pFee).toBeCloseTo(cases[1].result.p2pFee * 1.5, 6);
    // Tournaments are not linear: prize cost is fixed per event, so halving
    // participation more than halves net revenue. 100 participants gives
    // 4,000 less 800 = 3,200; 50 gives 2,000 less the same 800 = 1,200.
    expect(cases[0].result.tournamentNet).toBeCloseTo(1200, 6);
    expect(cases[1].result.tournamentNet).toBeCloseTo(3200, 6);
    expect(cases[2].result.tournamentNet).toBeCloseTo(5200, 6);
    expect(cases[0].result.tournamentNet).toBeLessThan(cases[1].result.tournamentNet * 0.5);
  });

  it('scales off the entered assumption, not a fixed benchmark', () => {
    expect(TPCcases(cfg({ engagement: 4 }))[2].result.engagement).toBeCloseTo(6, 6);
    expect(TPCcases(cfg({ engagement: 20 }))[2].result.engagement).toBeCloseTo(30, 6);
  });

  it('reports zero tournament revenue rather than throwing on invalid tournaments', () => {
    const r = TPCcase(cfg({ tournament: deal({ tournaments: [] }) }));
    expect(r.tournamentNet).toBe(0);
    expect(r.p2pFee).toBe(400000);
  });
});

describe('Break-even heat map', () => {
  const t = (o = {}) => deal(Object.assign({ includeH2H: false }, o));

  it('builds a five by five grid around the first tournament type', () => {
    const m = TPheatMap(t());
    expect(m.prices).toEqual([5, 7.5, 10, 12.5, 15]);
    expect(m.participation).toEqual([50, 75, 100, 125, 150]);
    expect(m.cells).toHaveLength(5);
  });

  it('the centre cell matches the unscaled model', () => {
    const s = t({ annualFees: [4000] });
    expect(TPheatMap(s).cells[2][2].month).toBeCloseTo(TPcalculate(s).payoffMonth, 6);
  });

  it('reports how far a missing cell got', () => {
    const c = TPheatMap(t({ annualFees: [500000] })).cells[2][2];
    expect(c.status).toBe('miss');
    expect(c.retired).toBeGreaterThan(0);
    expect(c.retired).toBeLessThan(1);
  });

  it('scales a percentage basis in percentage terms', () => {
    const m = TPheatMap(t({ mau: 20000, tournaments: [{ id: 'a', name: 'A', entryPrice: 10, eventsPerMonth: 1, basis: 'mau', participantPct: 2, customerCashCost: 0 }] }));
    expect(m.basisMau).toBe(true);
    expect(m.participation).toEqual([1, 1.5, 2, 2.5, 3]);
  });
});

describe('TPscaled', () => {
  it('scales participation and price without mutating the input', () => {
    const s = deal();
    const scaled = TPscaled(s, 2, 3);
    expect(scaled.tournaments[0].participants).toBe(200);
    expect(scaled.tournaments[0].entryPrice).toBe(30);
    expect(s.tournaments[0].participants).toBe(100);
    expect(s.tournaments[0].entryPrice).toBe(10);
  });

  it('leaves fees, splits and prize costs alone', () => {
    const scaled = TPscaled(deal(), 2, 2);
    expect(scaled.annualFees[0]).toBe(60000);
    expect(scaled.tournaments[0].customerCashCost).toBe(200);
  });
});

describe('Pitches', () => {
  const BLOCKED = /cash|wager|betting|\bbet\b|gambl|casino|prize money|stakes|buy-in|payout|\brake\b|\bhandle\b/i;

  it('the head-to-head pitch describes the funnel it actually ran', () => {
    const p = TPpitchH2H(deal(), cfg());
    expect(p).toContain('1,000,000 addressable users');
    expect(p).toContain('100,000 active players');
    expect(p).toContain('paid-game volume');
    expect(p).toContain('platform fee');
  });

  it('the head-to-head pitch drops the half that is switched off', () => {
    expect(TPpitchH2H(deal({ h2hMode: 'wagering' }), cfg())).not.toContain('reward games');
    expect(TPpitchH2H(deal({ h2hMode: 'rewards' }), cfg())).not.toContain('platform fee');
  });

  it('the head-to-head pitch says the licence is waived when it is', () => {
    expect(TPpitchH2H(deal({ freeLicense: true }), cfg())).toContain('licence waived');
  });

  it('the tournament pitch covers volume, prize cost and the licence outcome', () => {
    const p = TPpitchTournaments(deal({ annualFees: [4000] }));
    expect(p).toContain('tournament format');
    expect(p).toContain('prize cost');
    expect(p).toMatch(/retired by month/);
  });

  it('the tournament pitch reports a shortfall rather than implying payoff', () => {
    expect(TPpitchTournaments(deal({ annualFees: [500000] }))).toMatch(/outstanding at the end/);
  });

  it('the tournament pitch says so when activity does not pay the licence down', () => {
    expect(TPpitchTournaments(deal({ recapture: false }))).toMatch(/does not pay the licence down/);
  });

  it('neither pitch uses blocked vocabulary', () => {
    [TPpitchH2H(deal(), cfg()), TPpitchTournaments(deal()), TPpitchTournaments(deal({ freeLicense: true }))]
      .forEach((p) => {
        const hit = p.match(BLOCKED);
        expect(hit, hit ? `blocked term "${hit[0]}" in: ${p}` : '').toBeNull();
      });
  });

  it('returns nothing for a product that is not selected', () => {
    expect(TPpitchH2H(deal({ includeH2H: false }), cfg())).toBe('');
    expect(TPpitchTournaments(deal({ includeTournaments: false }))).toBe('');
  });
});

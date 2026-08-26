import { describe, it, expect } from 'vitest';
import calc from './calc-functions.js';

const { FTPcalc, FTPmatrix, FTPramp, FTP_DEFAULTS, BQcalc } = calc;

describe('Free-to-Play Value', () => {
  it('scales location-based audience and preserves the reward funnel', () => {
    const r = FTPcalc({ ...FTP_DEFAULTS, audience: 10000, locations: 3, audienceBasis: 'location', engagement: 10, claimRate: 40, redemptionRate: 30 });
    expect(r.audience).toBe(30000);
    expect(r.engaged).toBe(3000);
    expect(r.claimed).toBe(1200);
    expect(r.redeemed).toBe(360);
  });

  it('uses actual reward and fulfillment cost and keeps negative value visible', () => {
    const r = FTPcalc({ ...FTP_DEFAULTS, audience: 1000, engagement: 100, license: 0, implementation: 0, opex: 0, rewardCost: 20, fulfillmentCost: 5, outcomeRate: 0, outcomeValue: 0 });
    expect(r.rewardsCost).toBe(3000);
    expect(r.netPrimary).toBe(-3000);
  });

  it('treats sponsor funding as a cost offset, not duplicated benefit', () => {
    const base = { ...FTP_DEFAULTS, audience: 10000, engagement: 10, license: 10000, implementation: 0, opex: 0, rewardCost: 0, outcomeRate: 20, outcomeValue: 100, incrementality: 50 };
    const without = FTPcalc(base);
    const withSponsor = FTPcalc({ ...base, sponsorFunding: 2500 });
    expect(withSponsor.fullBenefit).toBe(without.fullBenefit);
    expect(withSponsor.customerCost).toBe(without.customerCost - 2500);
  });

  it('uses acquisition-equivalence as a guardrail', () => {
    const r = FTPcalc({ ...FTP_DEFAULTS, audience: 10000, engagement: 10, registrationRate: 50, identifiedRate: 20, valuePerProfile: 10, acquisitionEquivalence: 25, objective: 'acquisition' });
    expect(r.newProfiles).toBe(400);
    expect(r.audienceBenefit).toBe(1000);
    expect(r.primaryBenefit).toBe(1000);
  });

  it('builds a 5×5 break-even map with credible state labels', () => {
    const map = FTPmatrix({ ...FTP_DEFAULTS, audience: 100000, license: 5000, implementation: 0, opex: 0, rewardCost: 0, outcomeRate: 50, outcomeValue: 20, incrementality: 100 });
    expect(map.cells.flat()).toHaveLength(25);
    expect(map.cells.flat().some(c => c.status === 'miss')).toBe(true);
    expect(map.cells.flat().some(c => c.status !== 'miss')).toBe(true);
  });

  it('retains distinct month-one and month-twelve ramp states', () => {
    const rows = FTPramp({ ...FTP_DEFAULTS, audience: 100000, m1Activation: 5, targetActivation: 15, targetMonth: 6, outcomeRate: 50, outcomeValue: 20 });
    expect(rows).toHaveLength(12);
    expect(rows[0].activation).toBe(5);
    expect(rows[11].activation).toBe(15);
  });
});

describe('BDR Quick Estimate', () => {
  it('keeps tournament entries separate from prize cost and never applies rake', () => {
    const r = BQcalc({ mode: 'paid', paidFormat: 'tournament', participants: 100, frequency: 2, price: 10, prizeCost: 500, rake: 1 });
    expect(r.paidGross).toBe(2000);
    expect(r.paidNet).toBe(1500);
  });

  it('applies rake only to peer-to-peer handle', () => {
    const r = BQcalc({ mode: 'paid', paidFormat: 'p2p', participants: 100, frequency: 2, price: 50, rake: 20 });
    expect(r.paidGross).toBe(2000);
  });
});

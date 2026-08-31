import { describe, it, expect } from 'vitest';
import calc from './calc-functions.js';

const { DMcalc, DM_DEFAULTS } = calc;

describe('Digital Media ROI', () => {
  it('calculates the documented expected case', () => {
    const r = DMcalc({ ...DM_DEFAULTS, mu: 100000, aov: 55, grossMargin: 40, valuePerProfile: 3.5, rpm: 8, acquisitionEquivalence: 50, traffic: true });
    expect(r.EP).toBe(10000);
    expect(r.TC).toBeCloseTo(11333.333333, 5);
    expect(r.redeemed).toBe(1400);
    expect(r.redeemOrders).toBeCloseTo(588, 8);
    expect(r.liftOrders).toBe(86);
    expect(r.orders).toBeCloseTo(674, 8);
    expect(r.newProfiles).toBe(1750);
    expect(r.deltaPV).toBeCloseTo(20500, 8);
    expect(r.netBenefit).toBeCloseTo(r.grossBenefit - r.TC, 8);
  });

  it('returns null rather than Infinity for unavailable ratios', () => {
    const r = DMcalc({ mu: 0, er: 0, license: 0, implementation: 0, opex: 0, rpm: 0, aov: 0, grossMargin: 0, acquisitionEquivalence: null, campaignsPerYear: 0 });
    for (const key of ['roi','multiple','costEngaged','costProfile','costOrder','costViews','bePV','bePVpct','beOrders','beProfiles','beEngaged']) {
      expect(r[key]).toBeNull();
    }
  });

  it('preserves negative commerce value', () => {
    const r = DMcalc({ mu: 1000, er: 100, aov: 0, rewardUnitCost: 100, fulfillment: 20, publisherFundedShare: 100 });
    expect(r.netCommerce).toBeLessThan(0);
  });

  it('uses non-redeemers for lift orders', () => {
    const r = DMcalc({ mu: 1000, er: 100, rewardsIssued: 1, claimRate: 100, redemptionRate: 50, deltaConversion: 10, attachRate: 0 });
    expect(r.redeemed).toBe(500);
    expect(r.liftOrders).toBe(50);
  });

  it('uses the full page-view cross-term formula', () => {
    const r = DMcalc({ mu: 1000, er: 100, traffic: true, s0: 2, p0: 3, deltaSessions: 1, deltaPages: 2 });
    expect(r.deltaPV).toBe(9000);
  });

  it('cost-per-outcome rows are fully loaded alternative lenses', () => {
    const r = DMcalc({ ...DM_DEFAULTS, mu: 100000, aov: 55, grossMargin: 40, valuePerProfile: 3.5, rpm: 8, acquisitionEquivalence: 50, traffic: true });
    expect(r.costEngaged).toBeCloseTo(r.TC / r.EP, 10);
    expect(r.costProfile).toBeCloseTo(r.TC / r.newProfiles, 10);
    expect(r.costOrder).toBeCloseTo(r.TC / r.orders, 10);
    expect(r.costViews).toBeCloseTo(r.TC / (r.deltaPV / 1000), 10);
  });

  it('maintains net benefit identity across varied states', () => {
    for (let i = 1; i <= 100; i++) {
      const r = DMcalc({ mu: i * 1234, er: i % 101, acquisitionEquivalence: i % 101, publisherFundedShare: i % 101, traffic: i % 2 === 0 });
      expect(r.netBenefit).toBeCloseTo(r.grossBenefit - r.TC, 8);
    }
  });

  it('ships customer facts blank and no hidden sponsorship benefit', () => {
    expect(DM_DEFAULTS.mu).toBe('');
    expect(DM_DEFAULTS.aov).toBe('');
    expect(DM_DEFAULTS.grossMargin).toBe('');
    expect(DM_DEFAULTS.valuePerProfile).toBe('');
    expect(DM_DEFAULTS.rpm).toBe('');
    const r = DMcalc({ ...DM_DEFAULTS, license: 0, implementation: 0, opex: 0, campaignsPerYear: 4, avgCampaignRevenue: 15000, sponsorAttrib: 50 });
    expect(r.sponsorContribution).toBe(0);
    expect(r.grossBenefit).toBe(0);
  });

  it('applies discount mechanics without double-subtracting reward cost', () => {
    const r = DMcalc({ ...DM_DEFAULTS, mu: 1000, er: 100, aov: 100, grossMargin: 50, mechanic: 'discount', discountPct: 20, rewardUnitCost: 50, publisherFundedShare: 100 });
    expect(r.aovEffective).toBe(80);
    expect(r.rewardCost).toBe(0);
    expect(r.commerceRevenue).toBeCloseTo(r.orders * 80, 8);
  });
});

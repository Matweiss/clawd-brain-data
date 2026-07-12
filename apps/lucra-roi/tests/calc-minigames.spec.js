import { describe, it, expect } from 'vitest';
const { MGcalc } = require('./calc-functions.js');

describe('Mini Games ROI — MGcalc()', () => {
  // Golden fixture 3: Mini games case study
  // 1M TAU, 20% engagement, 40 plays, $2 wager, 15% rake, 25% rev share
  it('case study: 1M TAU, 20% eng, 40 plays, $2 wager, 15% rake, 25% rs', () => {
    const r = MGcalc(1000000, 20, 40, 2, 15, 25, 0, {
      rewardGames: 8, win: 50, redeem: 25, rewardValue: 8
    });
    expect(r.engaged).toBe(200000);
    expect(r.monthlyPlays).toBe(8000000);
    expect(r.monthlyWager).toBe(16000000);
    expect(r.monthlyRake).toBe(2400000);
    expect(r.revshareMo).toBe(600000);
    expect(r.clientMo).toBe(1800000);
    expect(r.monthlyRewardPlays).toBe(1600000);
    expect(r.monthlyRewardWins).toBe(800000);
    expect(r.monthlyRedemptions).toBe(200000);
    expect(r.rewardMo).toBe(1600000);
    expect(r.grossBrandMo).toBe(4000000);
    expect(r.netBrandMo).toBe(3400000);
    expect(r.rakeAnn).toBe(28800000);
    expect(r.grossBrandAnn).toBe(48000000);
    expect(r.netBrandAnn).toBe(40800000);
  });

  // Default inputs: 1M TAU, 10% eng, 20 plays, $2 wager, 10% rake, 25% rs
  it('default scenario: 1M TAU, 10% eng, 20 plays, $2 wager, 10% rake, 25% rs', () => {
    const r = MGcalc(1000000, 10, 20, 2, 10, 25, 0, {
      rewardGames: 8, win: 50, redeem: 25, rewardValue: 8
    });
    expect(r.engaged).toBe(100000);
    expect(r.monthlyPlays).toBe(2000000);
    expect(r.monthlyWager).toBe(4000000);
    expect(r.monthlyRake).toBe(400000);
    expect(r.revshareMo).toBe(100000);
    expect(r.clientMo).toBe(300000);
    expect(r.rewardMo).toBe(800000);
    expect(r.grossBrandMo).toBe(1200000);
    expect(r.netBrandMo).toBe(1100000);
  });

  // Edge: 0 engagement
  it('handles 0% engagement', () => {
    const r = MGcalc(1000000, 0, 20, 2, 10, 25, 0, {
      rewardGames: 8, win: 50, redeem: 25, rewardValue: 8
    });
    expect(r.engaged).toBe(0);
    expect(r.monthlyPlays).toBe(0);
    expect(r.monthlyRake).toBe(0);
    expect(r.grossBrandMo).toBe(0);
  });

  // With license fee
  it('includes license fee in Lucra cost', () => {
    const r = MGcalc(1000000, 10, 20, 2, 10, 25, 5000, {
      rewardGames: 8, win: 50, redeem: 25, rewardValue: 8
    });
    expect(r.licenseMo).toBe(5000);
    expect(r.lucraMo).toBe(105000); // 100000 revshare + 5000 license
    expect(r.lucraAnn).toBe(1260000);
  });

  // No rewards
  it('works without reward parameters', () => {
    const r = MGcalc(1000000, 10, 20, 2, 10, 25, 0);
    expect(r.engaged).toBe(100000);
    expect(r.rewardMo).toBe(0);
    expect(r.grossBrandMo).toBe(r.monthlyRake);
    expect(r.netBrandMo).toBe(r.monthlyRake - r.lucraMo);
  });

  it('supports revenue-share-only cash games with no license or reward value', () => {
    const r = MGcalc(100000, 10, 20, 2, 10, 25, 0, {
      rewardGames: 0, win: 0, redeem: 0, rewardValue: 0
    });
    expect(r.licenseMo).toBe(0);
    expect(r.revshareMo).toBe(10000);
    expect(r.rewardMo).toBe(0);
    expect(r.lucraMo).toBe(r.revshareMo);
  });

  it('supports F2P rewards-only games with no wager, rake, or revenue share', () => {
    const r = MGcalc(100000, 10, 20, 0, 0, 0, 15000, {
      rewardGames: 8, win: 50, redeem: 25, rewardValue: 8
    });
    expect(r.monthlyWager).toBe(0);
    expect(r.monthlyRake).toBe(0);
    expect(r.revshareMo).toBe(0);
    expect(r.rewardMo).toBe(80000);
    expect(r.lucraMo).toBe(15000);
  });

  it('supports cash-only games with reward value fully excluded', () => {
    const r = MGcalc(100000, 10, 20, 2, 10, 25, 0, {
      rewardGames: 0, win: 0, redeem: 0, rewardValue: 0
    });
    expect(r.rewardMo).toBe(0);
    expect(r.grossBrandMo).toBe(r.monthlyRake);
  });
});

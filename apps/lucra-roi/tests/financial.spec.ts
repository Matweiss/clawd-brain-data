import { describe, expect, it } from 'vitest';
import { buildCashFlow, buildSensitivity, monthlyGrossLift, normalizedProfile } from '../src/financial';

const inputs = { dailyVisitors: 1000, arpu: 40, monthlyFee: 2500, optInPct: 10, liftPct: 15, locations: 1 };

describe('financial intelligence', () => {
  it('preserves the current flat monthly gross-lift calculation', () => {
    expect(monthlyGrossLift(inputs)).toBe(18000);
  });

  it('normalizes seasonal profiles to the same annual baseline', () => {
    const profile = normalizedProfile('venue');
    expect(profile).toHaveLength(12);
    expect(profile.reduce((sum, value) => sum + value, 0)).toBeCloseTo(12, 8);
  });

  it('models upfront investment and cumulative monthly cash flow', () => {
    const flow = buildCashFlow(inputs, 'flat', 20000);
    expect(flow[0]?.cumulative).toBe(-4500);
    expect(flow[1]?.cumulative).toBe(11000);
    expect(flow.at(-1)?.cumulative).toBe(166000);
  });

  it('ranks sensitivity drivers and brackets the base case', () => {
    const points = buildSensitivity(inputs);
    expect(points).toHaveLength(4);
    points.forEach((point) => {
      expect(point.low).toBeLessThan(point.base);
      expect(point.high).toBeGreaterThan(point.base);
    });
  });
});

import { describe, it, expect } from 'vitest';
const { tmCompute } = require('./calc-functions.js');

describe('Trackman pricing — tmCompute()', () => {
  // Golden fixture 4: 10 bays, 2yr term, full package, 0% impl discount
  it('10-bay full package, 2yr, 0% impl discount', () => {
    const TM = { bays: 10, term: 2, package: 'full', implDisc: 0, custom: { active: false, perBay: null } };
    const r = tmCompute(TM);
    expect(r.full).toBe(true);
    expect(r.perBay).toBe(350);
    expect(r.custom).toBe(false);
    expect(r.monthly).toBe(3500);
    expect(r.annual).toBe(42000);
    expect(r.impl).toBe(5000);
    expect(r.implWaived).toBe(false);
    expect(r.tcv).toBe(89000); // 42000*2 + 5000
    expect(r.addOns).toHaveLength(3);
  });

  // Core only package
  it('10-bay core only, 2yr', () => {
    const TM = { bays: 10, term: 2, package: 'core', implDisc: 0, custom: { active: false, perBay: null } };
    const r = tmCompute(TM);
    expect(r.full).toBe(false);
    expect(r.perBay).toBe(250);
    expect(r.monthly).toBe(2500);
    expect(r.annual).toBe(30000);
    expect(r.tcv).toBe(65000); // 30000*2 + 5000
    expect(r.addOns).toHaveLength(0);
  });

  // 100% impl discount (waived)
  it('implementation fully discounted is waived', () => {
    const TM = { bays: 5, term: 1, package: 'core', implDisc: 100, custom: { active: false, perBay: null } };
    const r = tmCompute(TM);
    expect(r.impl).toBe(0);
    expect(r.implWaived).toBe(true);
    expect(r.tcv).toBe(15000); // 250*5*12 + 0
  });

  // 50% impl discount
  it('50% implementation discount', () => {
    const TM = { bays: 10, term: 2, package: 'full', implDisc: 50, custom: { active: false, perBay: null } };
    const r = tmCompute(TM);
    expect(r.impl).toBe(2500);
    expect(r.tcv).toBe(86500); // 42000*2 + 2500
  });

  // Custom per-bay override
  it('custom per-bay override', () => {
    const TM = { bays: 10, term: 2, package: 'core', implDisc: 0, custom: { active: true, perBay: 200 } };
    const r = tmCompute(TM);
    expect(r.custom).toBe(true);
    expect(r.perBay).toBe(200);
    expect(r.monthly).toBe(2000);
    expect(r.annual).toBe(24000);
    expect(r.tcv).toBe(53000); // 24000*2 + 5000
  });

  // 1-bay minimum
  it('1-bay 1yr core', () => {
    const TM = { bays: 1, term: 1, package: 'core', implDisc: 0, custom: { active: false, perBay: null } };
    const r = tmCompute(TM);
    expect(r.monthly).toBe(250);
    expect(r.annual).toBe(3000);
    expect(r.tcv).toBe(8000); // 3000 + 5000
  });

  // 3-year term
  it('3-year term', () => {
    const TM = { bays: 10, term: 3, package: 'full', implDisc: 0, custom: { active: false, perBay: null } };
    const r = tmCompute(TM);
    expect(r.tcv).toBe(131000); // 42000*3 + 5000
  });
});

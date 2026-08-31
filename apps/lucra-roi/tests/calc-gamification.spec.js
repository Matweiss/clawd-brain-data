import { describe, it, expect } from 'vitest';
const { gmCompute } = require('./calc-functions.js');

describe('Gamification deal math — gmCompute()', () => {
  const defaultGM = () => ({
    tpl: 'core',
    pkgs: { A: false, B: false, C: false, D: false, E: false, F: false },
    waived: { A: false, B: false, C: false, D: false, E: false, F: false },
    prices: {},
    impl: '',
    disc: 0,
    discMode: 'pct',
    implDisc: 0,
    implDiscMode: 'pct',
    term: 2,
  });

  // Golden fixture 5: Core template, packages A+B+D, 10% discount, 2yr term
  it('A+B+D selected, 10% discount, 2yr term', () => {
    const gm = defaultGM();
    gm.pkgs.A = true;
    gm.pkgs.B = true;
    gm.pkgs.D = true;
    gm.disc = 10;
    gm.discMode = 'pct';
    gm.term = 2;
    const r = gmCompute(gm);
    expect(r.monthly).toBe(25000); // A:10000 + B:10000 + D:5000
    expect(r.annual).toBe(300000);
    expect(r.discPct).toBe(10);
    expect(r.discAmt).toBeCloseTo(30000, 0);
    expect(r.amountDue).toBeCloseTo(270000, 0);
    expect(r.impl).toBe(0); // impl = '' → no impl
    expect(r.tcv).toBeCloseTo(540000, 0); // 270000 * 2
  });

  // No packages selected
  it('no packages selected → zero', () => {
    const gm = defaultGM();
    const r = gmCompute(gm);
    expect(r.monthly).toBe(0);
    expect(r.annual).toBe(0);
    expect(r.tcv).toBe(0);
  });

  // Waived package included in list but not in monthly
  it('waived package: A selected + waived', () => {
    const gm = defaultGM();
    gm.pkgs.A = true;
    gm.waived.A = true;
    gm.pkgs.B = true;
    const r = gmCompute(gm);
    expect(r.monthly).toBe(10000); // only B
    expect(r.listMonthly).toBe(20000); // A + B
    expect(r.waived).toHaveLength(1);
    expect(r.waived[0]).toContain('A:');
  });

  // Implementation tier G with discount
  it('impl G ($30k) with 20% discount', () => {
    const gm = defaultGM();
    gm.pkgs.A = true;
    gm.impl = 'G';
    gm.implDisc = 20;
    gm.implDiscMode = 'pct';
    gm.term = 1;
    const r = gmCompute(gm);
    expect(r.implGross).toBe(30000);
    expect(r.implDiscPct).toBe(20);
    expect(r.impl).toBe(24000);
    expect(r.implWaived).toBe(false);
    expect(r.tcv).toBe(120000 + 24000); // 10000*12 + 24000
  });

  // Waived implementation
  it('impl waived', () => {
    const gm = defaultGM();
    gm.pkgs.A = true;
    gm.impl = 'waived';
    gm.term = 1;
    const r = gmCompute(gm);
    expect(r.implWaived).toBe(true);
    expect(r.impl).toBe(0);
    expect(r.implGross).toBe(10000); // GM_IMPL.I
    expect(r.implDiscPct).toBe(100);
  });

  // Custom pricing
  it('custom pricing on product A', () => {
    const gm = defaultGM();
    gm.pkgs.A = true;
    gm.prices.A = 7500;
    gm.term = 1;
    const r = gmCompute(gm);
    expect(r.monthly).toBe(7500);
    expect(r.annual).toBe(90000);
    expect(r.custom).toHaveLength(1);
    expect(r.custom[0]).toContain('A:');
  });

  // Flat discount mode
  it('flat $ discount', () => {
    const gm = defaultGM();
    gm.pkgs.A = true;
    gm.pkgs.B = true;
    gm.disc = 50000;
    gm.discMode = 'flat';
    gm.term = 1;
    const r = gmCompute(gm);
    expect(r.annual).toBe(240000);
    expect(r.discAmt).toBe(50000);
    expect(r.amountDue).toBe(190000);
  });

  // All packages selected
  it('all 6 packages, no discount', () => {
    const gm = defaultGM();
    Object.keys(gm.pkgs).forEach(k => gm.pkgs[k] = true);
    gm.term = 2;
    const r = gmCompute(gm);
    // A:10000 + B:10000 + C:15000 + D:5000 + E:5000 + F:5000 = 50000
    expect(r.monthly).toBe(50000);
    expect(r.annual).toBe(600000);
    expect(r.tcv).toBe(1200000);
  });

  // Impl flat discount mode
  it('impl flat discount $5000 on G ($30k)', () => {
    const gm = defaultGM();
    gm.pkgs.A = true;
    gm.impl = 'G';
    gm.implDisc = 5000;
    gm.implDiscMode = 'flat';
    gm.term = 1;
    const r = gmCompute(gm);
    expect(r.impl).toBe(25000);
  });
});

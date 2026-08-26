import { describe, it, expect } from 'vitest';
const { C } = require('./calc-functions.js');

describe('Core ROI — C()', () => {
  // Golden fixture 1: Puttshack default
  it('Puttshack default: 1100 vis, $45 ARPU, $2500 fee, 10% opt-in, 15% lift', () => {
    const r = C(1100, 45, 2500, 10, 15);
    expect(r.arpu).toBe(45);
    expect(r.lucraARPU).toBeCloseTo(51.75, 2);
    expect(r.arpuLift).toBeCloseTo(6.75, 2);
    expect(r.dailyUsers).toBe(110);
    expect(r.moUsers).toBe(3300);
    expect(r.moRev).toBeCloseTo(22275, 0);
    expect(r.netMo).toBeCloseTo(19775, 0);
    expect(r.annROI).toBeCloseTo(237300, 0);
    expect(r.brkUsers).toBe(13);
    expect(r.brkVis).toBe(130);
    expect(r.roiX).toBe('8.9');
    expect(r.paybackDays).toBeCloseTo(3.4, 1);
  });

  // Golden fixture 2: Dave & Buster's multi-location
  it("D&B multi-location: 375 vis, $45 ARPU, $2000 fee, 20% opt, 12.5% lift", () => {
    const r = C(375, 45, 2000, 20, 12.5);
    expect(r.dailyUsers).toBe(75);
    expect(r.moUsers).toBe(2250);
    expect(r.arpuLift).toBeCloseTo(5.625, 3);
    expect(r.moRev).toBeCloseTo(12656.25, 2);
    expect(r.netMo).toBeCloseTo(10656.25, 2);
    expect(r.annROI).toBeCloseTo(127875, 0);
    expect(r.roiX).toBe('6.3');
  });

  // Edge case: 0 visitors
  it('handles 0 visitors', () => {
    const r = C(0, 45, 2500, 10, 15);
    expect(r.dailyUsers).toBe(0);
    expect(r.moUsers).toBe(0);
    expect(r.moRev).toBe(0);
    expect(r.netMo).toBe(-2500);
    expect(r.annROI).toBe(-30000);
    expect(r.paybackDays).toBe(Infinity);
  });

  // Edge case: 0 fee
  it('handles 0 fee', () => {
    const r = C(1100, 45, 0, 10, 15);
    expect(r.netMo).toBe(r.moRev);
    expect(r.roiX).toBe('0');
    expect(r.brkUsers).toBe(0);
    expect(r.paybackDays).toBe(0);
  });

  // Edge case: 0 lift
  it('handles 0% ARPU lift', () => {
    const r = C(1100, 45, 2500, 10, 0);
    expect(r.arpuLift).toBe(0);
    expect(r.moRev).toBe(0);
    expect(r.brkUsers).toBe(Infinity);
    expect(r.paybackDays).toBe(Infinity);
  });

  // Edge case: 0 opt-in
  it('handles 0% opt-in', () => {
    const r = C(1100, 45, 2500, 0, 15);
    expect(r.dailyUsers).toBe(0);
    expect(r.moRev).toBe(0);
    expect(r.brkVis).toBe(Infinity);
  });

  // Scenario: conservative (5% opt, 10% lift)
  it('conservative scenario: 5% opt, 10% lift', () => {
    const r = C(1100, 45, 2500, 5, 10);
    expect(r.dailyUsers).toBe(55);
    expect(r.arpuLift).toBeCloseTo(4.5, 2);
    expect(r.moRev).toBeCloseTo(7425, 0);
    expect(r.netMo).toBeCloseTo(4925, 0);
    expect(r.roiX).toBe('3.0');
  });

  // Scenario: case study (15% opt, 20% lift)
  it('case study scenario: 15% opt, 20% lift', () => {
    const r = C(1100, 45, 2500, 15, 20);
    expect(r.dailyUsers).toBe(165);
    expect(r.arpuLift).toBe(9);
    expect(r.moRev).toBeCloseTo(44550, 0);
    expect(r.roiX).toBe('17.8');
  });
});

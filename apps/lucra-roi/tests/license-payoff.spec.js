import { describe, it, expect } from 'vitest';
import calc from './calc-functions.js';

const { LPcalculate, LPbreakEvenMap, LPvalidate, LP_DEFAULTS } = calc;

function base(overrides = {}) {
  return Object.assign({}, JSON.parse(JSON.stringify(LP_DEFAULTS)), overrides);
}

describe('Licence Payoff Engine', () => {
  it('uses the full tournament entry pool without applying a rake', () => {
    const s = base({termYears:1, annualFees:[100000], audience:1000, engagement:10, rebuy:1, growthRate:0,
      tournaments:[{name:'Open',entryPrice:10,entriesPerEvent:100,eventsPerMonth:1,prizeCost:200}], h2hOn:false, miniOn:false, sponsorOn:false});
    const r = LPcalculate(s);
    expect(r.months[0].tournamentGross).toBe(1000);
    expect(r.months[0].prizeCost).toBe(200);
    expect(r.months[0].licenceCredit).toBe(500);
  });

  it('repeats audience demand per event and responds to entry capacity', () => {
    const shared = {termYears:1, annualFees:[100000], audience:1000, engagement:10, rebuy:1, growthRate:0,
      h2hOn:false, miniOn:false, sponsorOn:false};
    const limited = LPcalculate(base({...shared,
      tournaments:[{name:'Open',entryPrice:10,entriesPerEvent:50,eventsPerMonth:1,prizeCost:0}]}));
    const moreEntries = LPcalculate(base({...shared,
      tournaments:[{name:'Open',entryPrice:10,entriesPerEvent:100,eventsPerMonth:1,prizeCost:0}]}));
    const moreEvents = LPcalculate(base({...shared,
      tournaments:[{name:'Open',entryPrice:10,entriesPerEvent:100,eventsPerMonth:2,prizeCost:0}]}));
    const unusedCapacity = LPcalculate(base({...shared,
      tournaments:[{name:'Open',entryPrice:10,entriesPerEvent:200,eventsPerMonth:2,prizeCost:0}]}));
    expect(limited.months[0].tournamentGross).toBe(500);
    expect(moreEntries.months[0].tournamentGross).toBe(1000);
    expect(moreEvents.months[0].tournamentGross).toBe(2000);
    expect(unusedCapacity.months[0].tournamentGross).toBe(2000);
  });

  it('applies rake only to peer-to-peer handle', () => {
    const s = base({termYears:1, annualFees:[100000], tournamentsOn:false, h2hOn:true,
      h2h:{players:100,monthlyWager:50,rake:20}, miniOn:false, sponsorOn:false});
    const r = LPcalculate(s);
    expect(r.months[0].h2hHandle).toBe(5000);
    expect(r.months[0].h2hGross).toBe(1000);
    expect(r.months[0].licenceCredit).toBe(500);
  });

  it('blocks invalid payoff and post-payoff splits', () => {
    const s = base({payoff:{customer:40,lucra:20,credit:50},post:{customer:80,lucra:10}});
    expect(LPvalidate(s)).toEqual(expect.arrayContaining([
      'Payoff split must sum to 100%',
      'Post-payoff split must sum to 100%'
    ]));
    expect(LPcalculate(s).months).toHaveLength(0);
  });

  it('splits the crossover month between payoff and post-payoff economics', () => {
    const s = base({termYears:1,annualFees:[750],audience:100,engagement:100,rebuy:1,
      tournaments:[{name:'Open',entryPrice:10,entriesPerEvent:100,eventsPerMonth:1,prizeCost:0}],
      payoff:{customer:40,lucra:10,credit:50},post:{customer:90,lucra:10},postMode:'term'});
    const r = LPcalculate(s);
    expect(r.months[0].licenceCredit).toBe(500);
    expect(r.months[1].split).toBe('Crossover');
    expect(r.months[1].licenceCredit).toBe(250);
    expect(r.months[1].customerShare).toBe(650);
  });

  it('flags prize boards that exceed the customer share during payoff', () => {
    const s = base({termYears:1,annualFees:[100000],audience:100,engagement:100,rebuy:1,
      tournaments:[{name:'Open',entryPrice:10,entriesPerEvent:100,eventsPerMonth:1,prizeCost:450}]});
    const r = LPcalculate(s);
    expect(r.months[0].customerShare).toBe(400);
    expect(r.months[0].cashNegative).toBe(true);
    expect(r.largestMonthlyShortfall).toBe(50);
  });

  it('does not label a post-payoff prize shortfall as a payoff-phase warning', () => {
    const s = base({termYears:1,annualFees:[0],audience:100,engagement:100,rebuy:1,
      tournaments:[{name:'Open',entryPrice:10,entriesPerEvent:100,eventsPerMonth:1,prizeCost:950}],
      post:{customer:90,lucra:10}});
    const r = LPcalculate(s);
    expect(r.months[0].split).toBe('Post-payoff');
    expect(r.months[0].customerNet).toBe(-50);
    expect(r.months[0].cashNegative).toBe(false);
    expect(r.warnings).toHaveLength(0);
  });

  it('shows the real year-end true-up when activity misses the annual obligation', () => {
    const s = base({termYears:1,annualFees:[12000],audience:100,engagement:10,rebuy:1,
      tournaments:[{name:'Open',entryPrice:10,entriesPerEvent:100,eventsPerMonth:1,prizeCost:0}]});
    const r = LPcalculate(s);
    expect(r.creditApplied).toBe(600);
    expect(r.trueUps[0].amount).toBe(11400);
    expect(r.fullClearMonth).toBe(null);
  });

  it('caps monthly growth at 30% and flattens after the selected month', () => {
    const s = base({termYears:1,annualFees:[100000],growthRate:80,growthMonths:2});
    const r = LPcalculate(s);
    expect(r.growthRateApplied).toBe(.3);
    expect(r.months[2].growth).toBeCloseTo(1.69,5);
    expect(r.months[8].growth).toBeCloseTo(1.69,5);
  });

  it('builds a price-by-engagement map with credible clear and miss states', () => {
    const s = base({termYears:1,annualFees:[6000],audience:1000,rebuy:1,
      tournaments:[{name:'Open',entryPrice:10,entriesPerEvent:1000,eventsPerMonth:1,prizeCost:0}]});
    const map = LPbreakEvenMap(s);
    expect(map.columns).toHaveLength(5);
    expect(map.columns[0].cells.some(c => c.status === 'miss')).toBe(true);
    expect(map.columns[4].cells.some(c => c.status !== 'miss')).toBe(true);
    expect(map.columns[4].required).not.toBe(null);
  });

  it('updates heat-map coverage when tournament entries or events add usable capacity', () => {
    const shared = {termYears:1,annualFees:[12000],audience:1000,rebuy:1,growthRate:0,
      h2hOn:false,miniOn:false,sponsorOn:false};
    const limited = LPbreakEvenMap(base({...shared,
      tournaments:[{name:'Open',entryPrice:10,entriesPerEvent:50,eventsPerMonth:1,prizeCost:0}]}));
    const expanded = LPbreakEvenMap(base({...shared,
      tournaments:[{name:'Open',entryPrice:10,entriesPerEvent:100,eventsPerMonth:4,prizeCost:0}]}));
    expect(limited.columns[2].cells[1].coverage).toBeCloseTo(.25, 5);
    expect(expanded.columns[2].cells[1].coverage).toBeCloseTo(2, 5);
    expect(expanded.monthlyCapacity).toBe(400);
    expect(expanded.eventCount).toBe(4);
  });
});

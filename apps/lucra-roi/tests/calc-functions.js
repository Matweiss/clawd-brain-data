// Extracted pure calculation functions from app.html for testing.
// These are exact copies — do not modify without updating app.html in sync.

/**
 * Core ROI calculation.
 * C(vis, arpu, fee, optPct, liftPct) → result object
 */
function C(vis, arpu, fee, optPct, liftPct) {
  var opt = optPct / 100, lift = liftPct / 100, al = arpu * lift, la = arpu + al,
    du = Math.round(vis * opt), mu = du * 30, mr = du * al * 30, nm = mr - fee,
    ar = nm * 12, bu = al > 0 ? Math.ceil(fee / (al * 30)) : Infinity,
    bv = opt > 0 ? Math.ceil(bu / opt) : Infinity,
    rx = fee > 0 ? (mr / fee).toFixed(1) : '0',
    pb = mr > 0 ? Math.round(fee / (mr / 30) * 10) / 10 : Infinity;
  return {
    arpu: arpu, lucraARPU: la, arpuLift: al, dailyUsers: du, moUsers: mu,
    moRev: mr, netMo: nm, annROI: ar, brkUsers: bu, brkVis: bv, roiX: rx,
    paybackDays: pb
  };
}

/**
 * Mini Games ROI calculation.
 * MGcalc(tau, eng, plays, wager, rake, rs, license, opts) → result object
 *
 * In app.html, MGcalc reads reward fields from the global MG object.
 * For testing, we accept them as an opts parameter.
 */
function MGcalc(tau, eng, plays, wager, rake, rs, license, opts) {
  opts = opts || {};
  var engaged = Math.round(tau * eng / 100);
  var monthlyPlays = engaged * plays;
  var monthlyWager = monthlyPlays * wager;
  var monthlyRake = monthlyWager * rake / 100;
  var revshareMo = monthlyRake * rs / 100;
  var licenseMo = license || 0;
  var lucraMo = licenseMo + revshareMo;
  var clientPaidMo = monthlyRake - revshareMo;
  var rewardGames = opts.rewardGames || 0, win = opts.win || 0,
    redeem = opts.redeem || 0, rewardValue = opts.rewardValue || 0;
  var monthlyRewardPlays = engaged * rewardGames;
  var monthlyRewardWins = monthlyRewardPlays * win / 100;
  var monthlyRedemptions = monthlyRewardWins * redeem / 100;
  var rewardMo = monthlyRedemptions * rewardValue;
  var grossBrandMo = monthlyRake + rewardMo;
  var netBrandMo = grossBrandMo - lucraMo;
  return {
    engaged, monthlyPlays, monthlyWager, monthlyRake,
    licenseMo, revshareMo, lucraMo, clientMo: clientPaidMo,
    monthlyRewardPlays, monthlyRewardWins, monthlyRedemptions,
    rewardMo, grossBrandMo, netBrandMo,
    licenseAnn: licenseMo * 12, revshareAnn: revshareMo * 12,
    lucraAnn: lucraMo * 12, clientAnn: clientPaidMo * 12,
    wagerAnn: monthlyWager * 12, rakeAnn: monthlyRake * 12,
    rewardAnn: rewardMo * 12, grossBrandAnn: grossBrandMo * 12,
    netBrandAnn: netBrandMo * 12
  };
}

/**
 * Trackman pricing calculation.
 * tmCompute(TM, TM_IMPL, TM_PKG) → result object
 */
function tmCompute(TM, TM_IMPL, TM_PKG) {
  TM_IMPL = TM_IMPL || 5000;
  TM_PKG = TM_PKG || { core: 250, full: 350 };
  var full = TM.package === 'full', perBay = TM_PKG[TM.package];
  var custom = TM.custom.active && TM.custom.perBay !== null;
  if (custom) perBay = TM.custom.perBay;
  var impl = Math.round(TM_IMPL * (1 - TM.implDisc / 100)), implWaived = impl === 0;
  var bays = TM.bays, term = TM.term, monthly = perBay * bays,
    annual = monthly * 12, tcv = annual * term + impl;
  var addOns = full ? [
    'Play-for-Rewards + loyalty integration',
    'Convert winnings to client gift cards',
    'Marketing analytics & data insights'
  ] : [];
  return {
    full, perBay, custom, impl, implWaived, implDisc: TM.implDisc,
    bays, term, monthly, annual, tcv, addOns
  };
}

/**
 * Gamification deal math.
 * gmCompute(GM, GM_PRICE, GM_IMPL) → result object
 */
function gmCompute(GM, GM_PRICE, GM_IMPL) {
  GM_PRICE = GM_PRICE || { A: 10000, B: 10000, C: 15000, D: 5000, E: 5000, F: 5000 };
  GM_IMPL = GM_IMPL || { G: 30000, H: 15000, I: 10000 };

  function GMprice(k) {
    var v = GM.prices && GM.prices[k];
    return (v !== undefined && v !== null && !isNaN(v)) ? Number(v) : GM_PRICE[k];
  }

  var monthly = 0, listMonthly = 0, customItems = [], waived = [];
  var GM_NAMES = {
    A: 'Recreational games + client-hosted tournaments',
    B: 'User-generated competitions',
    C: 'Gaming compliant wallet infrastructure',
    D: 'Play-for-Rewards + loyalty',
    E: 'Convert winnings to gift cards',
    F: 'Marketing analytics / data insights'
  };

  for (var k in GM.pkgs) {
    if (GM.pkgs[k]) {
      var price = GMprice(k);
      listMonthly += price;
      if (GM.waived[k]) {
        waived.push(k + ': ' + GM_NAMES[k] + ' waived at $' + Math.round(price).toLocaleString() + '/mo list');
      } else {
        monthly += price;
      }
      if (price !== GM_PRICE[k]) {
        customItems.push(k + ': $' + Math.round(price).toLocaleString() + '/mo');
      }
    }
  }

  var annual = monthly * 12, listAnnual = listMonthly * 12, discPct = 0, discAmt = 0;
  if (GM.disc > 0 && annual > 0) {
    if (GM.discMode === 'pct') {
      discPct = Math.round(GM.disc);
      discAmt = annual * GM.disc / 100;
    } else {
      discAmt = Math.min(annual, GM.disc);
      discPct = Math.round(discAmt / annual * 100);
    }
  }
  var amountDue = Math.max(0, annual - discAmt);
  var implGross = GM.impl && GM.impl !== 'waived' ? GM_IMPL[GM.impl] : 0;
  var implDiscAmt = 0, implDiscPct = 0;
  if (GM.impl === 'waived') {
    implGross = GM_IMPL.I;
    implDiscAmt = implGross;
    implDiscPct = 100;
  } else if (GM.implDisc > 0 && implGross > 0) {
    if (GM.implDiscMode === 'pct') {
      implDiscPct = Math.round(GM.implDisc);
      implDiscAmt = implGross * GM.implDisc / 100;
    } else {
      implDiscAmt = Math.min(implGross, GM.implDisc);
      implDiscPct = Math.round(implDiscAmt / implGross * 100);
    }
  }
  var impl = Math.max(0, Math.round(implGross - implDiscAmt));
  var tcv = amountDue * GM.term + impl;
  return {
    monthly, listMonthly, annual, listAnnual, discPct, discAmt,
    amountDue, implGross, impl, implDiscPct,
    implWaived: GM.impl === 'waived' || (implGross > 0 && impl === 0),
    term: GM.term, tcv, custom: customItems, waived
  };
}

var DM_DEFAULTS={mu:'',er:10,license:10000,implementation:10000,amortMonths:12,opex:500,revenueShareCost:0,rewardsIssued:1,claimRate:40,redemptionRate:35,attachRate:70,incrementality:60,deltaConversion:1,aov:'',grossMargin:'',rewardUnitCost:8,fulfillment:3,publisherFundedShare:50,mechanic:'credit',discountPct:10,regRate:35,identifiedRate:50,optInRate:70,valuePerProfile:'',acquisitionEquivalence:null,traffic:false,s0:2,p0:2.5,deltaSessions:.35,deltaPages:.5,rpm:'',sponsorship:false,campaignsPerYear:0,avgCampaignRevenue:'',sponsorAttrib:0,deliveryCost:10,lucraSponsorShare:0,m1Activation:10,targetActivation:30,targetMonth:6,mauGrowth:0,full:false};
function DMnum(v,lo,hi){v=Number(v);if(!isFinite(v))v=0;if(lo!==undefined)v=Math.max(lo,v);if(hi!==undefined)v=Math.min(hi,v);return v}
function DMdiv(a,b){return isFinite(a)&&isFinite(b)&&b>0?a/b:null}
function DMcalc(s){
 s=Object.assign({},DM_DEFAULTS,s||{});var pct=function(k){return DMnum(s[k],0,100)/100};
 var mu=DMnum(s.mu,0),er=pct('er'),EP=mu*er,amort=Math.max(1,DMnum(s.amortMonths,1)),TC=DMnum(s.license,0)+DMnum(s.implementation,0)/amort+DMnum(s.opex,0)+DMnum(s.revenueShareCost,0);
 var issued=EP*DMnum(s.rewardsIssued,0),claimed=issued*pct('claimRate'),redeemed=claimed*pct('redemptionRate');
 var redeemOrders=redeemed*pct('attachRate')*pct('incrementality'),liftOrders=Math.max(0,EP-redeemed)*pct('deltaConversion'),orders=redeemOrders+liftOrders;
 var aov=DMnum(s.aov,0),margin=pct('grossMargin'),isDiscount=s.mechanic==='discount',aovEffective=isDiscount?aov*(1-pct('discountPct')):aov,rewardCost=isDiscount?0:redeemed*DMnum(s.rewardUnitCost,0)*pct('publisherFundedShare'),fulfillment=orders*DMnum(s.fulfillment,0),commerceRevenue=orders*aovEffective,commerceContribution=commerceRevenue*margin,netCommerce=commerceContribution-rewardCost-fulfillment;
 var newProfiles=EP*pct('regRate')*(1-pct('identifiedRate')),optIns=newProfiles*pct('optInRate'),eq=s.acquisitionEquivalence===null||s.acquisitionEquivalence===''?null:pct('acquisitionEquivalence'),audienceValue=eq===null?null:newProfiles*eq*DMnum(s.valuePerProfile,0);
 var deltaPV=0,deltaSessions=0,adRevenue=0;if(s.traffic){deltaSessions=EP*DMnum(s.deltaSessions,0);deltaPV=EP*((DMnum(s.s0,0)+DMnum(s.deltaSessions,0))*(DMnum(s.p0,0)+DMnum(s.deltaPages,0))-DMnum(s.s0,0)*DMnum(s.p0,0));adRevenue=deltaPV/1000*DMnum(s.rpm,0)}
 var sponsorRevenue=s.sponsorship?DMnum(s.campaignsPerYear,0)*DMnum(s.avgCampaignRevenue,0)*pct('sponsorAttrib')/12:0,sponsorContribution=sponsorRevenue*(1-pct('deliveryCost'))*(1-pct('lucraSponsorShare'));
 var gross=adRevenue+netCommerce+(audienceValue||0)+sponsorContribution,net=gross-TC,roi=DMdiv(net,TC),multiple=DMdiv(gross,TC),recurring=DMnum(s.license,0)+DMnum(s.opex,0)+DMnum(s.revenueShareCost,0),payback=DMdiv(DMnum(s.implementation,0),gross-recurring);
 var valuePerOrder=orders>0?netCommerce/orders:null,basePV=mu*DMnum(s.s0,0)*DMnum(s.p0,0),bePVbase=DMdiv(TC,DMnum(s.rpm,0)),bePV=bePVbase===null?null:bePVbase*1000,bePVpct=DMdiv(bePV,basePV),beOrders=DMdiv(TC,valuePerOrder),profileUnit=eq===null?null:DMnum(s.valuePerProfile,0)*eq,beProfiles=DMdiv(TC,profileUnit),valuePerEngaged=DMdiv(adRevenue+netCommerce+(audienceValue||0),EP),beEngaged=TC<=0?null:(sponsorContribution>=TC?0:DMdiv(TC-sponsorContribution,valuePerEngaged));
 return{mu:mu,EP:EP,TC:TC,issued:issued,claimed:claimed,redeemed:redeemed,redeemOrders:redeemOrders,liftOrders:liftOrders,orders:orders,aovEffective:aovEffective,commerceRevenue:commerceRevenue,commerceContribution:commerceContribution,rewardCost:rewardCost,fulfillment:fulfillment,netCommerce:netCommerce,newProfiles:newProfiles,optIns:optIns,audienceValue:audienceValue,deltaPV:deltaPV,deltaSessions:deltaSessions,adRevenue:adRevenue,sponsorContribution:sponsorContribution,grossBenefit:gross,netBenefit:net,roi:roi,multiple:multiple,payback:payback,valuePerOrder:valuePerOrder,basePV:basePV,bePV:bePV,bePVpct:bePVpct,beOrders:beOrders,beProfiles:beProfiles,beEngaged:beEngaged,costEngaged:DMdiv(TC,EP),costProfile:DMdiv(TC,newProfiles),costOrder:DMdiv(TC,orders),costViews:DMdiv(TC,deltaPV/1000)}
}

/* TP-PURE-START — mirrored verbatim from api/app.html, guarded by tests/tp-drift.spec.js */
var TP_SPLITS = {
  standard: { credit: 50, operator: 40, lucra: 10 },
  sweep: { credit: 90, operator: 0, lucra: 10 }
};

var TP_MAX_YEARS = 5;

var TP_DEFAULTS = {
  dealName: '',
  termYears: 1,
  annualFees: [60000, 60000, 60000, 60000, 60000],
  payoffBasis: 'term',
  shortfall: 'roll',
  freeLicense: false,
  splitMode: 'standard',
  custom: { credit: 50, operator: 40, lucra: 10 },
  post: { operator: 90, lucra: 10 },
  volumeMode: 'flat',
  participantBasis: 'count',
  mau: 0,
  participants: 100,
  participantPct: 5,
  rampStart: 50,
  rampPlateau: 200,
  rampStartPct: 2,
  rampPlateauPct: 8,
  rampMonths: 6,
  tournaments: [
    { id: 't1', name: 'Weekly open', entryPrice: 10, eventsPerMonth: 4, participationMode: 'shared', participantsCustom: 100, participantPctCustom: 5, rebuyMode: 'avg', rebuys: 0, rebuyPct: 0, isCash: false, rewardFaceValue: 500, customerCashCost: 200, cashPrizeAmount: 500 },
    { id: 't2', name: 'Monthly headline', entryPrice: 25, eventsPerMonth: 1, participationMode: 'shared', participantsCustom: 50, participantPctCustom: 2, rebuyMode: 'avg', rebuys: 1, rebuyPct: 0, isCash: true, rewardFaceValue: 1000, customerCashCost: 1000, cashPrizeAmount: 1000 }
  ]
};

function TPnum(v, lo, hi) {
  v = Number(v);
  if (!isFinite(v)) v = 0;
  if (lo !== undefined) v = Math.max(lo, v);
  if (hi !== undefined) v = Math.min(hi, v);
  return v;
}

function TPterm(s) { return Math.max(1, Math.min(TP_MAX_YEARS, Math.round(TPnum(s.termYears, 1, TP_MAX_YEARS)))); }

/* Fee for each year of the term, custom per year. */
function TPfees(s) {
  var n = TPterm(s), src = s.annualFees || [], out = [];
  for (var i = 0; i < n; i++) out.push(TPnum(src[i], 0));
  return out;
}

function TPstate(s) {
  var out = JSON.parse(JSON.stringify(TP_DEFAULTS)), src = s || {};
  Object.keys(src).forEach(function (k) {
    out[k] = src[k] && typeof src[k] === 'object' && !Array.isArray(src[k])
      ? Object.assign({}, out[k] || {}, src[k])
      : src[k];
  });
  // Single-fee state from the first release migrates to a one-year term.
  if (src.licenseFee !== undefined && !Array.isArray(src.annualFees)) {
    out.annualFees = [TPnum(src.licenseFee, 0)];
    out.termYears = 1;
  }
  if (!Array.isArray(out.annualFees)) out.annualFees = [];
  out.annualFees = out.annualFees.slice(0, TP_MAX_YEARS).map(function (f) { return TPnum(f, 0); });
  while (out.annualFees.length < TP_MAX_YEARS) {
    out.annualFees.push(out.annualFees.length ? out.annualFees[out.annualFees.length - 1] : 0);
  }
  out.tournaments = (src.tournaments || out.tournaments).map(function (t) {
    var c = Object.assign({ participationMode: 'shared', rebuyMode: 'avg', rebuys: 0, rebuyPct: 0, participantsCustom: 0, participantPctCustom: 0 }, t);
    if (c.isCash) { c.rewardFaceValue = TPnum(c.cashPrizeAmount, 0); c.customerCashCost = TPnum(c.cashPrizeAmount, 0); }
    return c;
  });
  return out;
}

/* Active split. A free licence collapses to operator / Lucra with no credit bucket. */
function TPsplitRates(s) {
  var postOp = TPnum(s.post.operator, 0, 100) / 100, postLu = TPnum(s.post.lucra, 0, 100) / 100;
  if (s.freeLicense) {
    return { free: true, credit: 0, operator: postOp, lucra: postLu, postOperator: postOp, postLucra: postLu };
  }
  var p = s.splitMode === 'custom'
    ? { credit: TPnum(s.custom.credit, 0, 100), operator: TPnum(s.custom.operator, 0, 100), lucra: TPnum(s.custom.lucra, 0, 100) }
    : (TP_SPLITS[s.splitMode] || TP_SPLITS.standard);
  return {
    free: false, credit: p.credit / 100, operator: p.operator / 100, lucra: p.lucra / 100,
    postOperator: postOp, postLucra: postLu
  };
}

/* The month's value on the ramp, expressed in whatever unit the participant
   basis uses: a headcount, or a percentage of MAU. */
function TPrampValue(s, month) {
  var mau = s.participantBasis === 'mau',
    flat = mau ? TPnum(s.participantPct, 0) : TPnum(s.participants, 0);
  if (s.volumeMode !== 'ramp') return flat;
  var start = mau ? TPnum(s.rampStartPct, 0) : TPnum(s.rampStart, 0),
    plateau = mau ? TPnum(s.rampPlateauPct, 0) : TPnum(s.rampPlateau, 0),
    M = Math.max(1, Math.round(TPnum(s.rampMonths, 1)));
  if (M === 1 || month >= M) return plateau;
  return start + (plateau - start) * (month - 1) / (M - 1);
}

/* Where the ramp sits this month relative to its plateau, 0..1. Used to ramp a
   tournament type's own participation alongside the shared curve, so a custom
   entry count is read as the number at full ramp rather than from month one. */
function TPrampFactor(s, month) {
  if (s.volumeMode !== 'ramp') return 1;
  var plateau = s.participantBasis === 'mau' ? TPnum(s.rampPlateauPct, 0) : TPnum(s.rampPlateau, 0);
  return plateau > 0 ? TPrampValue(s, month) / plateau : 1;
}

/* Participants per event for a 1-based month, before any per-type override. */
function TPparticipants(s, month) {
  var v = TPrampValue(s, month);
  return s.participantBasis === 'mau' ? TPnum(s.mau, 0) * v / 100 : v;
}

/* Participants for one tournament type. A $1 open draws a different crowd from
   a $20 headline, so a type can carry its own number instead of the shared one. */
function TPtypeParticipants(s, t, month) {
  if (!t || t.participationMode !== 'custom') return TPparticipants(s, month);
  var full = s.participantBasis === 'mau'
    ? TPnum(s.mau, 0) * TPnum(t.participantPctCustom, 0) / 100
    : TPnum(t.participantsCustom, 0);
  return full * TPrampFactor(s, month);
}

/* Entries for one running of a tournament type. Rebuys are either an average
   number of extra entries per participant, or extra entries as a percentage of
   participants (over 100% is allowed, meaning more than one rebuy each). */
function TPentriesPerEvent(s, t, month) {
  var p = TPtypeParticipants(s, t, month);
  return p + (t.rebuyMode === 'pct' ? p * TPnum(t.rebuyPct, 0) / 100 : p * TPnum(t.rebuys, 0));
}

function TPvalidate(input) {
  var s = TPstate(input), errors = [];
  if (!s.freeLicense && s.splitMode === 'custom') {
    var sum = TPnum(s.custom.credit) + TPnum(s.custom.operator) + TPnum(s.custom.lucra);
    if (Math.abs(sum - 100) > 0.001) errors.push('Custom split must sum to 100%. It currently sums to ' + Math.round(sum * 10) / 10 + '%.');
    if (TPnum(s.custom.credit) <= 0) errors.push('Licence share must be above 0%. Use the free licence toggle for a waived licence.');
  }
  var post = TPnum(s.post.operator) + TPnum(s.post.lucra);
  if (Math.abs(post - 100) > 0.001) errors.push('Post-payoff split must sum to 100%.');
  if (!s.freeLicense) {
    var fees = TPfees(s);
    if (fees.reduce(function (a, b) { return a + b; }, 0) <= 0) errors.push('Enter a licence fee for at least one year, or switch the licence to free.');
    fees.forEach(function (f, i) { if (f < 0) errors.push('Year ' + (i + 1) + ' fee cannot be negative.'); });
  }
  if (s.participantBasis === 'mau' && TPnum(s.mau, 0) <= 0) errors.push('Enter monthly active users, or switch participants back to a headcount.');
  if (!(s.tournaments || []).length) errors.push('Add at least one tournament type.');
  return errors;
}

/* Month-by-month model across the whole term.

   Prize cost leaves the handle before the split, so the licence, operator and
   Lucra shares all fund prizes pro rata. When a balance retires mid-month the
   unused remainder of that month pays out at the post-payoff split rather than
   being lost.

   payoffBasis 'term'   — every year's fee is one cumulative balance. Once it
                          clears, the licence share redirects to the operator
                          for the rest of the term.
   payoffBasis 'annual' — each year's fee opens its own balance at that year's
                          first month. An unretired balance at year end either
                          rolls into the next year (shortfall 'roll') or is
                          charged as a cash true-up (shortfall 'cash'). */
function TPcalculate(input) {
  var s = TPstate(input), errors = TPvalidate(s);
  if (errors.length) return { errors: errors, months: [], years: [] };

  var rates = TPsplitRates(s),
    termYears = TPterm(s),
    totalMonths = termYears * 12,
    fees = s.freeLicense ? [] : TPfees(s),
    totalContract = fees.reduce(function (a, b) { return a + b; }, 0),
    annual = !s.freeLicense && s.payoffBasis === 'annual',
    remaining = s.freeLicense ? 0 : (annual ? fees[0] : totalContract),
    years = [], cumulativeLicense = 0, trueUpTotal = 0,
    totalOperator = 0, totalLucra = 0, totalHandle = 0, totalPrizeCost = 0, totalNet = 0,
    lossMonths = 0, payoffMonth = null, months = [];

  for (var y = 0; y < (s.freeLicense ? termYears : fees.length); y++) {
    years.push({ year: y + 1, fee: s.freeLicense ? 0 : fees[y], opening: 0, credited: 0, trueUp: 0, clearMonth: null, closing: 0 });
  }
  if (years[0]) years[0].opening = remaining;

  for (var month = 1; month <= totalMonths; month++) {
    var yi = Math.floor((month - 1) / 12), monthInYear = ((month - 1) % 12) + 1;

    if (annual && monthInYear === 1 && month > 1) {
      var prev = years[yi - 1];
      prev.closing = remaining;
      if (remaining > 1e-9 && s.shortfall === 'cash') {
        prev.trueUp = remaining;
        trueUpTotal += remaining;
        remaining = 0;
      }
      remaining += fees[yi];
      years[yi].opening = remaining;
    }

    var participants = TPparticipants(s, month), handle = 0, prizeCost = 0, detail = [];
    s.tournaments.forEach(function (t) {
      var events = TPnum(t.eventsPerMonth, 0),
        typeParticipants = TPtypeParticipants(s, t, month),
        entriesPerEvent = TPentriesPerEvent(s, t, month),
        tHandle = entriesPerEvent * TPnum(t.entryPrice, 0) * events,
        tPrize = TPnum(t.isCash ? t.cashPrizeAmount : t.customerCashCost, 0) * events;
      handle += tHandle;
      prizeCost += tPrize;
      detail.push({
        name: t.name, participants: typeParticipants, entriesPerEvent: entriesPerEvent,
        events: events, handle: tHandle, prizeCost: tPrize,
        loss: tPrize > tHandle
      });
    });

    var grossMargin = handle - prizeCost,
      netRevenue = Math.max(0, grossMargin),
      licenseGross = rates.credit > 0 ? Math.min(netRevenue, remaining / rates.credit) : 0,
      postGross = netRevenue - licenseGross,
      toLicense = Math.min(remaining, licenseGross * rates.credit),
      toOperator = licenseGross * rates.operator + postGross * rates.postOperator,
      toLucra = licenseGross * rates.lucra + postGross * rates.postLucra,
      openingRemaining = remaining;

    if (grossMargin < 0) lossMonths++;
    remaining = Math.max(0, remaining - toLicense);
    cumulativeLicense += toLicense;
    totalOperator += toOperator;
    totalLucra += toLucra;
    totalHandle += handle;
    totalPrizeCost += prizeCost;
    totalNet += netRevenue;
    if (years[yi]) years[yi].credited += toLicense;

    var fraction = netRevenue > 0 ? licenseGross / netRevenue : 1;
    if (years[yi] && years[yi].clearMonth === null && openingRemaining > 1e-9 && remaining <= 1e-9) {
      years[yi].clearMonth = month - 1 + fraction;
    }
    // Whole-term basis has a single balance, so payoff is the month it clears.
    // Per-year basis is resolved after the loop, since a later year re-opens one.
    if (!annual && payoffMonth === null && !rates.free && totalContract > 0 && openingRemaining > 1e-9 && remaining <= 1e-9) {
      payoffMonth = month - 1 + fraction;
    }

    months.push({
      month: month, year: yi + 1, monthInYear: monthInYear,
      participants: participants, handle: handle, prizeCost: prizeCost,
      grossMargin: grossMargin, netRevenue: netRevenue,
      toLicense: toLicense, cumulativeLicense: cumulativeLicense,
      toOperator: toOperator, toLucra: toLucra,
      split: licenseGross > 0 && postGross > 0 ? 'Crossover' : licenseGross > 0 ? 'Payoff' : 'Post-payoff',
      detail: detail
    });
  }

  if (years.length) years[years.length - 1].closing = remaining;
  if (annual && remaining > 1e-9 && s.shortfall === 'cash') {
    years[years.length - 1].trueUp = remaining;
    trueUpTotal += remaining;
    remaining = 0;
  }
  if (annual) {
    // The contract is only fully paid off when the final year clears on activity
    // alone, with nothing rolled past the end and no cash true-up charged.
    var lastYear = years[years.length - 1];
    payoffMonth = (trueUpTotal <= 1e-9 && lastYear && lastYear.closing <= 1e-9 && lastYear.clearMonth !== null)
      ? lastYear.clearMonth : null;
  }

  return {
    errors: [], months: months, years: years,
    termYears: termYears, annualBasis: annual, shortfallMode: s.shortfall,
    licenseFee: totalContract, totalContract: totalContract,
    payoffMonth: payoffMonth, cumulativeLicense: cumulativeLicense,
    trueUpTotal: trueUpTotal, balanceDue: Math.max(0, remaining),
    totalOwed: trueUpTotal + Math.max(0, remaining),
    totalOperator: totalOperator, totalLucra: totalLucra,
    totalHandle: totalHandle, totalPrizeCost: totalPrizeCost, totalNet: totalNet,
    lossMonths: lossMonths,
    free: rates.free
  };
}

/* Whitelisted customer-facing projection. Built key by key so internal
   economics cannot leak into the customer export even if state gains fields.
   A percentage rebuy rate is a planning estimate, so it is described rather
   than published as a number. */
function TPcustomerProjection(input) {
  var s = TPstate(input);
  return {
    dealName: String(s.dealName || ''),
    tournaments: s.tournaments.map(function (t) {
      var rebuys = TPnum(t.rebuys, 0), label;
      if (t.rebuyMode === 'pct') label = TPnum(t.rebuyPct, 0) > 0 ? 'Rebuys available' : 'Single entry';
      else label = rebuys > 0 ? 'Up to ' + (rebuys % 1 === 0 ? rebuys : rebuys.toFixed(2)) + ' rebuys' : 'Single entry';
      return {
        name: String(t.name || 'Tournament'),
        entryPrice: TPnum(t.entryPrice, 0),
        rebuyLabel: label,
        frequencyLabel: TPnum(t.eventsPerMonth, 0) + 'x per month',
        rewardLabel: t.isCash
          ? '$' + Math.round(TPnum(t.cashPrizeAmount, 0)).toLocaleString() + ' cash prize'
          : '$' + Math.round(TPnum(t.rewardFaceValue, 0)).toLocaleString() + ' value reward'
      };
    })
  };
}
/* TP-PURE-END */

module.exports = { C, MGcalc, tmCompute, gmCompute, DMcalc, DM_DEFAULTS,
  TPnum, TPstate, TPsplitRates, TPparticipants, TPvalidate, TPcalculate, TPcustomerProjection,
  TPterm, TPfees, TPrampValue, TPrampFactor, TPtypeParticipants, TPentriesPerEvent,
  TP_DEFAULTS, TP_SPLITS, TP_MAX_YEARS };


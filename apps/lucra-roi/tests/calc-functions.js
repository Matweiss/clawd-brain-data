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
  recapture: { credit: 50, operator: 40, lucra: 10 },
  sweep: { credit: 90, operator: 0, lucra: 10 }
};

var TP_MAX_YEARS = 5;

var TP_DEFAULTS = {
  dealName: '',
  heatH2H: true,
  partnerSite: '',
  presenter: '',
  presenterEmail: '',
  confidential: true,
  // What the customer is taking
  includeTournaments: true,
  includeH2H: false,
  mau: 0,
  // Deal and licence
  termYears: 1,
  annualFees: [60000, 60000, 60000, 60000, 60000],
  payoffBasis: 'term',
  shortfall: 'roll',
  freeLicense: false,
  // Revenue split
  recapture: true,
  splitMode: 'recapture',
  custom: { credit: 50, operator: 40, lucra: 10 },
  post: { operator: 90, lucra: 10 },
  // Launch ramp, applied to both products
  showLucra: true,
  rampOn: false,
  rampStartPct: 25,
  rampMonths: 6,
  // Head-to-head
  h2hReach: 0,
  h2hMode: 'both',
  // Tournaments
  tournaments: [
    { id: 't1', name: 'Weekly open', entryPrice: 10, eventsPerMonth: 4, basis: 'count', participants: 100, participantPct: 5, rebuyMode: 'avg', rebuys: 0, rebuyPct: 0, isCash: false, rewardFaceValue: 500, customerCashCost: 200, cashPrizeAmount: 500 },
    { id: 't2', name: 'Monthly headline', entryPrice: 25, eventsPerMonth: 1, basis: 'count', participants: 50, participantPct: 2, rebuyMode: 'avg', rebuys: 1, rebuyPct: 0, isCash: true, rewardFaceValue: 1000, customerCashCost: 1000, cashPrizeAmount: 1000 }
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

function TPfees(s) {
  var n = TPterm(s), src = s.annualFees || [], out = [];
  for (var i = 0; i < n; i++) out.push(TPnum(src[i], 0));
  return out;
}

/* Head-to-head reach defaults to the deal-level addressable base, and can be
   overridden when only part of that base is reachable for real-money play. */
function TPreach(s) {
  var own = TPnum(s.h2hReach, 0);
  return own > 0 ? own : TPnum(s.mau, 0);
}

function TPstate(s) {
  var out = JSON.parse(JSON.stringify(TP_DEFAULTS)), src = s || {};
  Object.keys(src).forEach(function (k) {
    out[k] = src[k] && typeof src[k] === 'object' && !Array.isArray(src[k])
      ? Object.assign({}, out[k] || {}, src[k])
      : src[k];
  });
  if (src.licenseFee !== undefined && !Array.isArray(src.annualFees)) {
    out.annualFees = [TPnum(src.licenseFee, 0)];
    out.termYears = 1;
  }
  if (!Array.isArray(out.annualFees)) out.annualFees = [];
  out.annualFees = out.annualFees.slice(0, TP_MAX_YEARS).map(function (f) { return TPnum(f, 0); });
  while (out.annualFees.length < TP_MAX_YEARS) {
    out.annualFees.push(out.annualFees.length ? out.annualFees[out.annualFees.length - 1] : 0);
  }
  if (out.splitMode === 'standard') out.splitMode = 'recapture';

  // Participation moved from one shared field onto each tournament type.
  var sharedCount = TPnum(src.participants, 0), sharedPct = TPnum(src.participantPct, 0),
    sharedBasis = src.participantBasis === 'mau' ? 'mau' : 'count';
  out.tournaments = (src.tournaments || out.tournaments).map(function (t) {
    var c = Object.assign({ basis: 'count', participants: 0, participantPct: 0, rebuyMode: 'avg', rebuys: 0, rebuyPct: 0 }, t);
    if (t && t.basis === undefined) {
      var wasCustom = t.participationMode === 'custom';
      c.basis = sharedBasis;
      c.participants = wasCustom ? TPnum(t.participantsCustom, 0) : sharedCount;
      c.participantPct = wasCustom ? TPnum(t.participantPctCustom, 0) : sharedPct;
    }
    if (c.isCash) { c.rewardFaceValue = TPnum(c.cashPrizeAmount, 0); c.customerCashCost = TPnum(c.cashPrizeAmount, 0); }
    return c;
  });
  return out;
}

/* The active split.
   A free licence, or recapture switched off, means no licence bucket: activity
   splits between operator and Lucra only. Recapture off differs from a free
   licence in that the fee still exists, it is simply not paid down by play. */
function TPsplitRates(s) {
  var postOp = TPnum(s.post.operator, 0, 100) / 100, postLu = TPnum(s.post.lucra, 0, 100) / 100;
  if (s.freeLicense || !s.recapture) {
    return {
      free: !!s.freeLicense, recapturing: false, credit: 0,
      operator: postOp, lucra: postLu, postOperator: postOp, postLucra: postLu
    };
  }
  var p = s.splitMode === 'custom'
    ? { credit: TPnum(s.custom.credit, 0, 100), operator: TPnum(s.custom.operator, 0, 100), lucra: TPnum(s.custom.lucra, 0, 100) }
    : (TP_SPLITS[s.splitMode] || TP_SPLITS.recapture);
  return {
    free: false, recapturing: true,
    credit: p.credit / 100, operator: p.operator / 100, lucra: p.lucra / 100,
    postOperator: postOp, postLucra: postLu
  };
}

/* Launch ramp, 0..1, applied to both products so a venue that is still
   building an audience is not modelled at full volume from month one. */
function TPrampFactor(s, month) {
  if (!s.rampOn) return 1;
  var start = TPnum(s.rampStartPct, 0, 100) / 100,
    M = Math.max(1, Math.round(TPnum(s.rampMonths, 1)));
  if (M === 1 || month >= M) return 1;
  return start + (1 - start) * (month - 1) / (M - 1);
}

function TPavgRamp(s, months) {
  var n = months || TPterm(s) * 12, total = 0;
  for (var m = 1; m <= n; m++) total += TPrampFactor(s, m);
  return n > 0 ? total / n : 1;
}

/* Participants for one tournament type: its own headcount, or its own share of
   the addressable base, scaled by the ramp. */
function TPtypeParticipants(s, t, month) {
  var full = t.basis === 'mau'
    ? TPnum(s.mau, 0) * TPnum(t.participantPct, 0) / 100
    : TPnum(t.participants, 0);
  return full * TPrampFactor(s, month);
}

function TPentriesPerEvent(s, t, month) {
  var p = TPtypeParticipants(s, t, month);
  return p + (t.rebuyMode === 'pct' ? p * TPnum(t.rebuyPct, 0) / 100 : p * TPnum(t.rebuys, 0));
}

function TPvalidate(input) {
  var s = TPstate(input), errors = [];
  if (!s.includeTournaments && !s.includeH2H) errors.push('Select at least one product: tournaments, head-to-head, or both.');

  if (s.includeH2H && TPreach(s) <= 0) errors.push('Enter addressable users, or a head-to-head reach.');

  if (!s.includeTournaments) return errors;

  var post = TPnum(s.post.operator) + TPnum(s.post.lucra);
  if (Math.abs(post - 100) > 0.001) errors.push('Operator and Lucra split must sum to 100%.');

  if (!s.freeLicense) {
    var fees = TPfees(s);
    if (fees.reduce(function (a, b) { return a + b; }, 0) <= 0) errors.push('Enter a licence fee for at least one year, or switch the licence to free.');
  }
  if (!s.freeLicense && s.recapture && s.splitMode === 'custom') {
    var sum = TPnum(s.custom.credit) + TPnum(s.custom.operator) + TPnum(s.custom.lucra);
    if (Math.abs(sum - 100) > 0.001) errors.push('Recapture split must sum to 100%. It currently sums to ' + Math.round(sum * 10) / 10 + '%.');
    if (TPnum(s.custom.credit) <= 0) errors.push('Licence share must be above 0%. Switch recapture off if activity should not pay the licence down.');
  }
  if (!(s.tournaments || []).length) errors.push('Add at least one tournament type.');
  if ((s.tournaments || []).some(function (t) { return t.basis === 'mau'; }) && TPnum(s.mau, 0) <= 0) {
    errors.push('Enter addressable users, or set tournament participation as a headcount.');
  }
  return errors;
}

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
    totalOperator = 0, totalOperatorGross = 0, totalLucra = 0,
    totalHandle = 0, totalPrizeCost = 0, totalSplitBase = 0,
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
        prev.trueUp = remaining; trueUpTotal += remaining; remaining = 0;
      }
      remaining += fees[yi];
      years[yi].opening = remaining;
    }

    var handle = 0, prizeCost = 0, detail = [], participants = 0;
    s.tournaments.forEach(function (t) {
      var events = TPnum(t.eventsPerMonth, 0),
        typeParticipants = TPtypeParticipants(s, t, month),
        entriesPerEvent = TPentriesPerEvent(s, t, month),
        tHandle = entriesPerEvent * TPnum(t.entryPrice, 0) * events,
        tPrize = TPnum(t.isCash ? t.cashPrizeAmount : t.customerCashCost, 0) * events;
      handle += tHandle;
      prizeCost += tPrize;
      participants += typeParticipants;
      detail.push({
        name: t.name, participants: typeParticipants, entriesPerEvent: entriesPerEvent,
        events: events, handle: tHandle, prizeCost: tPrize, loss: tPrize > tHandle
      });
    });

    // The commercial splits gross entries. The partner funds the prize pool out of
    // their own share afterwards, so prize cost never reduces the pool being split:
    // $10,000 raised -> partner $9,000 -> their $1,000 prize cost -> partner nets $8,000.
    var splitBase = handle,
      licenseGross = rates.credit > 0 ? Math.min(splitBase, remaining / rates.credit) : 0,
      postGross = splitBase - licenseGross,
      toLicense = Math.min(remaining, licenseGross * rates.credit),
      operatorGross = licenseGross * rates.operator + postGross * rates.postOperator,
      toLucra = licenseGross * rates.lucra + postGross * rates.postLucra,
      toOperator = operatorGross - prizeCost,
      grossMargin = handle - prizeCost,
      openingRemaining = remaining;

    // A month is a loss when the partner's share does not cover the prizes they fund.
    if (toOperator < 0) lossMonths++;
    remaining = Math.max(0, remaining - toLicense);
    cumulativeLicense += toLicense;
    totalOperator += toOperator; totalOperatorGross += operatorGross; totalLucra += toLucra;
    totalHandle += handle; totalPrizeCost += prizeCost; totalSplitBase += splitBase;
    if (years[yi]) years[yi].credited += toLicense;

    var fraction = splitBase > 0 ? licenseGross / splitBase : 1;
    if (years[yi] && years[yi].clearMonth === null && openingRemaining > 1e-9 && remaining <= 1e-9) {
      years[yi].clearMonth = month - 1 + fraction;
    }
    if (!annual && payoffMonth === null && !rates.free && totalContract > 0 && openingRemaining > 1e-9 && remaining <= 1e-9) {
      payoffMonth = month - 1 + fraction;
    }

    months.push({
      month: month, year: yi + 1, monthInYear: monthInYear,
      participants: participants, handle: handle, prizeCost: prizeCost,
      grossMargin: grossMargin, splitBase: splitBase,
      toLicense: toLicense, cumulativeLicense: cumulativeLicense,
      operatorGross: operatorGross, toOperator: toOperator, toLucra: toLucra,
      split: licenseGross > 0 && postGross > 0 ? 'Crossover' : licenseGross > 0 ? 'Payoff' : 'Post-payoff',
      detail: detail
    });
  }

  if (years.length) years[years.length - 1].closing = remaining;
  if (annual && remaining > 1e-9 && s.shortfall === 'cash') {
    years[years.length - 1].trueUp = remaining; trueUpTotal += remaining; remaining = 0;
  }
  if (annual) {
    var lastYear = years[years.length - 1];
    payoffMonth = (trueUpTotal <= 1e-9 && lastYear && lastYear.closing <= 1e-9 && lastYear.clearMonth !== null)
      ? lastYear.clearMonth : null;
  }

  return {
    errors: [], months: months, years: years,
    termYears: termYears, annualBasis: annual, shortfallMode: s.shortfall,
    recapturing: rates.recapturing,
    licenseFee: totalContract, totalContract: totalContract,
    payoffMonth: payoffMonth, cumulativeLicense: cumulativeLicense,
    trueUpTotal: trueUpTotal, balanceDue: Math.max(0, remaining),
    totalOwed: trueUpTotal + Math.max(0, remaining),
    totalOperator: totalOperator, totalOperatorGross: totalOperatorGross, totalLucra: totalLucra,
    totalHandle: totalHandle, totalPrizeCost: totalPrizeCost, totalSplitBase: totalSplitBase,
    lossMonths: lossMonths, free: rates.free
  };
}

/* Head-to-head on its own. Wagering produces the platform fee; rewards are free
   to play and produce venue value through redeemed visits, never a fee. */
function TPh2h(input, cfg, factor) {
  var s = TPstate(input), f = factor === undefined ? 1 : TPnum(factor, 0),
    on = !!s.includeH2H,
    wagering = on && s.h2hMode !== 'rewards',
    rewards = on && s.h2hMode !== 'wagering',
    reach = TPreach(s),
    engagement = on ? Math.min(100, TPnum(cfg.engagement, 0, 100) * f) : 0,
    ramp = TPavgRamp(s),
    engaged = reach * engagement / 100 * ramp,
    paidPlays = wagering ? engaged * TPnum(cfg.playsPerUser, 0) : 0,
    paidVolume = paidPlays * TPnum(cfg.spendPerPlay, 0),
    feeRate = TPnum(cfg.feeRate, 0, 100) / 100,
    platformFee = paidVolume * feeRate,
    rewardPlays = rewards ? engaged * TPnum(cfg.rewardGames, 0) : 0,
    rewardWins = rewardPlays * TPnum(cfg.winRate, 0, 100) / 100,
    rewardRedemptions = rewardWins * TPnum(cfg.redeemRate, 0, 100) / 100,
    rewardValue = rewardRedemptions * TPnum(cfg.valuePerRedemption, 0),
    rates = TPsplitRates(s),
    lucraShare = platformFee * rates.lucra,
    // The Revenue Model tab is authoritative: a free licence waives Lucra's fee
    // whatever any other tab holds.
    licenseMonthly = s.freeLicense ? 0 : TPfees(s)[0] / 12,
    operatorShare = platformFee - lucraShare;

  return {
    on: on, wagering: wagering, rewards: rewards,
    reach: reach, engagement: engagement, engaged: engaged, ramp: ramp,
    paidPlays: paidPlays, paidVolume: paidVolume, feeRate: feeRate * 100,
    platformFee: platformFee, lucraShare: lucraShare, operatorShare: operatorShare,
    licenseMonthly: licenseMonthly, licenseWaived: !!s.freeLicense,
    rewardPlays: rewardPlays, rewardWins: rewardWins,
    rewardRedemptions: rewardRedemptions, rewardValue: rewardValue,
    revenueGenerated: platformFee
  };
}

function TPCcase(cfg, factor) {
  var f = factor === undefined ? 1 : TPnum(factor, 0),
    s = TPstate(cfg.tournament),
    onTournaments = !!s.includeTournaments,
    h = TPh2h(s, cfg, f),
    tState = TPscaled(s, f, 1),
    tResult = TPcalculate(tState),
    months = tResult.months.length || 12,
    usable = onTournaments && !tResult.errors.length,
    // Both products contribute the pool their split is taken from: the head-to-head
    // platform fee, and gross tournament entries. Prize funding is the partner's own
    // cost out of their share, so it is reported separately, never netted off here.
    tournamentMonthly = usable ? tResult.totalSplitBase / months : 0,
    prizeFundingMonthly = usable ? tResult.totalPrizeCost / months : 0,
    operatorNetMonthly = usable ? tResult.totalOperator / months : 0,
    tournamentParticipants = usable ? (tResult.months[months - 1] || {}).participants || 0 : 0,
    mau = TPnum(s.mau, 0),
    tournamentShare = mau > 0 ? tournamentParticipants / mau * 100 : 0;

  return {
    factor: f,
    includeH2H: h.on, includeTournaments: onTournaments,
    mau: mau, h2h: h,
    engagement: h.engagement, engaged: h.engaged,
    paidVolume: h.paidVolume, p2pFee: h.platformFee,
    rewardRedemptions: h.rewardRedemptions, rewardValue: h.rewardValue,
    lucraShare: h.lucraShare + (h.on ? h.licenseMonthly : 0),
    tournamentParticipants: tournamentParticipants,
    tournamentShare: tournamentShare,
    tournamentEntries: tournamentMonthly,
    prizeFunding: prizeFundingMonthly,
    operatorNet: operatorNetMonthly,
    tournamentResult: tResult,
    revenueGenerated: h.platformFee + tournamentMonthly,
    annualRevenueGenerated: (h.platformFee + tournamentMonthly) * 12,
    combinedShare: h.engagement + tournamentShare
  };
}

function TPCcases(cfg) {
  return [
    { key: 'conservative', label: 'Conservative', note: 'Half the entered participation', result: TPCcase(cfg, 0.5) },
    { key: 'expected', label: 'Expected', note: 'Participation as entered', result: TPCcase(cfg, 1) },
    { key: 'best', label: 'Best case', note: '1.5x the entered participation', result: TPCcase(cfg, 1.5) }
  ];
}

/* Scale participation and entry price. Used by the case band and the map. */
function TPscaled(input, participationFactor, priceFactor) {
  var s = TPstate(input), p = TPnum(participationFactor, 0), q = priceFactor === undefined ? 1 : TPnum(priceFactor, 0);
  s.tournaments = s.tournaments.map(function (t) {
    var c = Object.assign({}, t);
    c.participants = TPnum(c.participants, 0) * p;
    c.participantPct = TPnum(c.participantPct, 0) * p;
    c.entryPrice = TPnum(c.entryPrice, 0) * q;
    return c;
  });
  return s;
}

function TPheatMap(input, h2hCfg) {
  var s = TPstate(input), factors = [0.5, 0.75, 1, 1.25, 1.5],
    first = (s.tournaments && s.tournaments[0]) || {},
    basisMau = first.basis === 'mau',
    baseParticipation = basisMau ? TPnum(first.participantPct, 0) : TPnum(first.participants, 0),
    primaryPrice = TPnum(first.entryPrice, 0),
    totalMonths = TPterm(s) * 12;

  var prices = factors.map(function (f) { return Math.round(primaryPrice * f * 100) / 100; }),
    rows = factors.map(function (f) { return Math.round(baseParticipation * f * 1000) / 1000; });

  var cells = rows.map(function (participation, ri) {
    return prices.map(function (price, ci) {
      var c = TPscaled(s, factors[ri], factors[ci]), r = TPcalculate(c);
      if (r.errors.length) return { status: 'error', month: null, retired: 0, share: null, lucra: 0 };
      var retired = r.totalContract > 0 ? r.cumulativeLicense / r.totalContract : 1;
      return {
        status: r.payoffMonth === null ? 'miss' : 'clear',
        month: r.payoffMonth, retired: retired,
        share: r.payoffMonth === null ? null : r.payoffMonth / totalMonths,
        lucra: r.totalLucra / (r.months.length || 1)
      };
    });
  });

  /* Volume behind each row, at the entered entry price, so the money driving a
     cell is visible rather than implied. Both products scale with the row
     factor, the same way the three cases do. */
  var volumes = rows.map(function (participation, ri) {
    var c = TPscaled(s, factors[ri], 1), r = TPcalculate(c),
      h = h2hCfg ? TPh2h(s, h2hCfg, factors[ri]) : null;
    return {
      entriesValue: r.errors.length ? 0 : (r.totalHandle / (r.months.length || 1)),
      paidGameVolume: h ? h.paidVolume : 0,
      h2hFee: h ? h.platformFee : 0
    };
  });

  return {
    basisMau: basisMau, prices: prices, participation: rows, cells: cells, volumes: volumes,
    totalMonths: totalMonths, baseParticipation: baseParticipation, primaryPrice: primaryPrice,
    showLucra: !!s.showLucra, includeH2H: !!s.includeH2H && s.heatH2H !== false
  };
}

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
          ? '$' + Math.round(TPnum(t.cashPrizeAmount, 0)).toLocaleString() + ' prize pool'
          : '$' + Math.round(TPnum(t.rewardFaceValue, 0)).toLocaleString() + ' value reward'
      };
    })
  };
}

/* ---- pitches ----
   Plain-language summaries of each product on its own. Written to the
   lucra-model-onepager vocabulary rules, so no blocked betting jargon. */
function TPmoney0(n) { return '$' + Math.round(TPnum(n, 0)).toLocaleString(); }

function TPpitchH2H(input, cfg) {
  var s = TPstate(input), h = TPh2h(s, cfg, 1);
  if (!h.on) return '';
  if (h.reach <= 0) return 'Enter addressable users to build the head-to-head pitch.';
  var out = TPmoney0(h.reach).replace('$', '') + ' addressable users at ' + (Math.round(h.engagement * 100) / 100) +
    '% engagement gives ' + Math.round(h.engaged).toLocaleString() + ' active players' +
    (s.rampOn ? ' averaged across the ramp' : '') + '.';
  if (h.wagering) {
    out += ' They play ' + (Math.round(TPnum(cfg.playsPerUser, 0) * 100) / 100) + ' paid games a month at ' +
      TPmoney0(TPnum(cfg.spendPerPlay, 0)) + ' an entry, which is ' + TPmoney0(h.paidVolume) +
      ' of paid-game volume a month and ' + TPmoney0(h.platformFee) + ' of platform fee at ' +
      (Math.round(h.feeRate * 100) / 100) + '%. Across a year that is ' + TPmoney0(h.platformFee * 12) + '.';
    out += ' The operator keeps ' + TPmoney0(h.operatorShare * 12) + ' of that a year';
    out += h.licenseWaived
      ? ', with the licence waived.'
      : ', against a licence of ' + TPmoney0(h.licenseMonthly) + ' a month.';
  }
  if (h.rewards && h.rewardValue > 0) {
    out += ' Free-to-play reward games add about ' + Math.round(h.rewardRedemptions).toLocaleString() +
      ' redemptions a month, worth ' + TPmoney0(h.rewardValue) +
      ' of venue value. That is a benefit, not revenue, so it is counted separately.';
  }
  return out;
}

function TPpitchTournaments(input) {
  var s = TPstate(input), r = TPcalculate(s);
  if (!s.includeTournaments) return '';
  if (r.errors.length) return 'Complete the tournament inputs to build the pitch.';
  var m1 = r.months[0] || {}, perYear = r.totalSplitBase / TPterm(s),
    types = s.tournaments.length,
    events = s.tournaments.reduce(function (a, t) { return a + TPnum(t.eventsPerMonth, 0); }, 0);
  var out = types + ' tournament format' + (types === 1 ? '' : 's') + ' running ' + Math.round(events) +
    ' event' + (Math.round(events) === 1 ? '' : 's') + ' a month draws ' + Math.round(m1.participants || 0).toLocaleString() +
    ' participants in month one, generating ' + TPmoney0(m1.splitBase || 0) + ' of entries to split. ' +
    'The operator funds ' + TPmoney0(m1.prizeCost || 0) + ' of prizes out of their own share.';
  out += ' Over the term that is ' + TPmoney0(perYear) + ' a year.';
  if (r.free) {
    out += ' The licence is waived, so the operator and Lucra split it from month one.';
  } else if (!r.recapturing) {
    out += ' Activity does not pay the licence down, so the ' + TPmoney0(r.totalContract) + ' fee stays payable.';
  } else if (r.payoffMonth !== null) {
    out += ' The ' + TPmoney0(r.totalContract) + ' licence is retired by month ' +
      (Math.round(r.payoffMonth * 10) / 10).toFixed(1) + ', after which the licence share redirects to the operator.';
  } else {
    out += ' That retires ' + TPmoney0(r.cumulativeLicense) + ' of the ' + TPmoney0(r.totalContract) +
      ' licence, leaving ' + TPmoney0(r.balanceDue) + ' outstanding at the end of the term.';
  }
  out += s.showLucra
    ? ' The operator earns ' + TPmoney0(r.totalOperator) + ' across the term and Lucra ' + TPmoney0(r.totalLucra) + '.'
    : ' The operator earns ' + TPmoney0(r.totalOperator) + ' across the term.';
  return out;
}
/* TP-PURE-END */

module.exports = { C, MGcalc, tmCompute, gmCompute, DMcalc, DM_DEFAULTS,
  TPnum, TPstate, TPsplitRates, TPvalidate, TPcalculate, TPcustomerProjection,
  TPterm, TPfees, TPreach, TPrampFactor, TPavgRamp, TPtypeParticipants, TPentriesPerEvent,
  TPheatMap, TPscaled, TPh2h, TPCcase, TPCcases, TPpitchH2H, TPpitchTournaments,
  TP_DEFAULTS, TP_SPLITS, TP_MAX_YEARS };

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

var DM_DEFAULTS={mu:100000,er:10,license:10000,implementation:10000,amortMonths:12,opex:500,revenueShareCost:0,rewardsIssued:1,claimRate:40,redemptionRate:35,attachRate:70,incrementality:60,deltaConversion:1,aov:55,grossMargin:40,rewardUnitCost:8,fulfillment:3,publisherFundedShare:50,regRate:35,identifiedRate:50,optInRate:70,valuePerProfile:3.5,acquisitionEquivalence:null,traffic:false,s0:2,p0:2.5,deltaSessions:.35,deltaPages:.5,rpm:8,campaignsPerYear:4,avgCampaignRevenue:15000,sponsorAttrib:50,deliveryCost:10,lucraSponsorShare:0,m1Activation:25,targetActivation:100,targetMonth:6,mauGrowth:0,full:false};
function DMnum(v,lo,hi){v=Number(v);if(!isFinite(v))v=0;if(lo!==undefined)v=Math.max(lo,v);if(hi!==undefined)v=Math.min(hi,v);return v}
function DMdiv(a,b){return isFinite(a)&&isFinite(b)&&b>0?a/b:null}
function DMcalc(s){
 s=Object.assign({},DM_DEFAULTS,s||{});var pct=function(k){return DMnum(s[k],0,100)/100};
 var mu=DMnum(s.mu,0),er=pct('er'),EP=mu*er,amort=Math.max(1,DMnum(s.amortMonths,1)),TC=DMnum(s.license,0)+DMnum(s.implementation,0)/amort+DMnum(s.opex,0)+DMnum(s.revenueShareCost,0);
 var issued=EP*DMnum(s.rewardsIssued,0),claimed=issued*pct('claimRate'),redeemed=claimed*pct('redemptionRate');
 var redeemOrders=redeemed*pct('attachRate')*pct('incrementality'),liftOrders=Math.max(0,EP-redeemed)*pct('deltaConversion'),orders=redeemOrders+liftOrders;
 var aov=DMnum(s.aov,0),margin=pct('grossMargin'),rewardCost=redeemed*DMnum(s.rewardUnitCost,0)*pct('publisherFundedShare'),fulfillment=orders*DMnum(s.fulfillment,0),commerceRevenue=orders*aov,commerceContribution=commerceRevenue*margin,netCommerce=commerceContribution-rewardCost-fulfillment;
 var newProfiles=EP*pct('regRate')*(1-pct('identifiedRate')),optIns=newProfiles*pct('optInRate'),eq=s.acquisitionEquivalence===null||s.acquisitionEquivalence===''?null:pct('acquisitionEquivalence'),audienceValue=eq===null?null:newProfiles*eq*DMnum(s.valuePerProfile,0);
 var deltaPV=0,deltaSessions=0,adRevenue=0;if(s.traffic){deltaSessions=EP*DMnum(s.deltaSessions,0);deltaPV=EP*((DMnum(s.s0,0)+DMnum(s.deltaSessions,0))*(DMnum(s.p0,0)+DMnum(s.deltaPages,0))-DMnum(s.s0,0)*DMnum(s.p0,0));adRevenue=deltaPV/1000*DMnum(s.rpm,0)}
 var sponsorRevenue=DMnum(s.campaignsPerYear,0)*DMnum(s.avgCampaignRevenue,0)*pct('sponsorAttrib')/12,sponsorContribution=sponsorRevenue*(1-pct('deliveryCost'))*(1-pct('lucraSponsorShare'));
 var gross=adRevenue+netCommerce+(audienceValue||0)+sponsorContribution,net=gross-TC,roi=DMdiv(net,TC),multiple=DMdiv(gross,TC),recurring=DMnum(s.license,0)+DMnum(s.opex,0)+DMnum(s.revenueShareCost,0),payback=DMdiv(DMnum(s.implementation,0),gross-recurring);
 var valuePerOrder=orders>0?netCommerce/orders:null,basePV=mu*DMnum(s.s0,0)*DMnum(s.p0,0),bePVbase=DMdiv(TC,DMnum(s.rpm,0)),bePV=bePVbase===null?null:bePVbase*1000,bePVpct=DMdiv(bePV,basePV),beOrders=DMdiv(TC,valuePerOrder),profileUnit=eq===null?null:DMnum(s.valuePerProfile,0)*eq,beProfiles=DMdiv(TC,profileUnit),valuePerEngaged=DMdiv(adRevenue+netCommerce+(audienceValue||0),EP),beEngaged=TC<=0?null:(sponsorContribution>=TC?0:DMdiv(TC-sponsorContribution,valuePerEngaged));
 return{mu:mu,EP:EP,TC:TC,issued:issued,claimed:claimed,redeemed:redeemed,redeemOrders:redeemOrders,liftOrders:liftOrders,orders:orders,commerceRevenue:commerceRevenue,commerceContribution:commerceContribution,rewardCost:rewardCost,fulfillment:fulfillment,netCommerce:netCommerce,newProfiles:newProfiles,optIns:optIns,audienceValue:audienceValue,deltaPV:deltaPV,deltaSessions:deltaSessions,adRevenue:adRevenue,sponsorContribution:sponsorContribution,grossBenefit:gross,netBenefit:net,roi:roi,multiple:multiple,payback:payback,valuePerOrder:valuePerOrder,basePV:basePV,bePV:bePV,bePVpct:bePVpct,beOrders:beOrders,beProfiles:beProfiles,beEngaged:beEngaged,costEngaged:DMdiv(TC,EP),costProfile:DMdiv(TC,newProfiles),costOrder:DMdiv(TC,orders),costViews:DMdiv(TC,deltaPV/1000)}
}

module.exports = { C, MGcalc, tmCompute, gmCompute, DMcalc, DM_DEFAULTS };

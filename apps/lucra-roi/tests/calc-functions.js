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

var FTP_DEFAULTS={customer:'',audience:'',locations:1,audienceBasis:'total',engagement:10,license:10000,implementation:10000,amortMonths:12,opex:500,sponsorFunding:0,rewardsPerPlayer:1,claimRate:40,redemptionRate:30,rewardCost:'',fulfillmentCost:0,objective:'retention',outcomeRate:'',outcomeValue:'',incrementality:50,measurement:'linked',registrationRate:40,identifiedRate:'',valuePerProfile:'',acquisitionEquivalence:'',impressionsPerPlayer:'',mediaCPM:'',m1Activation:5,targetActivation:10,targetMonth:6,growth:0,full:false,view:'build'};
function FTPnum(v,lo,hi){v=Number(v);if(!isFinite(v))v=0;if(lo!==undefined)v=Math.max(lo,v);if(hi!==undefined)v=Math.min(hi,v);return v}
function FTPpct(v){return FTPnum(v,0,100)/100}
function FTPdiv(a,b){return isFinite(a)&&isFinite(b)&&b>0?a/b:null}
function FTPcalcNoSearch(input,overrides){var s=Object.assign({},FTP_DEFAULTS,input||{},overrides||{}),audience=FTPnum(s.audience,0)*(s.audienceBasis==='location'?Math.max(1,FTPnum(s.locations,1)):1),engaged=audience*FTPpct(s.engagement),claimed=engaged*FTPnum(s.rewardsPerPlayer,0)*FTPpct(s.claimRate),redeemed=claimed*FTPpct(s.redemptionRate),outcomes=redeemed*FTPpct(s.outcomeRate)*FTPpct(s.incrementality),profiles=engaged*FTPpct(s.registrationRate)*(1-FTPpct(s.identifiedRate)),impressions=engaged*FTPnum(s.impressionsPerPlayer,0),cost=FTPnum(s.license,0)+FTPnum(s.implementation,0)/Math.max(1,FTPnum(s.amortMonths,1))+FTPnum(s.opex,0)+redeemed*(FTPnum(s.rewardCost,0)+FTPnum(s.fulfillmentCost,0))-FTPnum(s.sponsorFunding,0),eq=s.acquisitionEquivalence===''||s.acquisitionEquivalence===null?0:FTPpct(s.acquisitionEquivalence),benefit=s.objective==='acquisition'?profiles*eq*FTPnum(s.valuePerProfile,0):s.objective==='media'?impressions/1000*FTPnum(s.mediaCPM,0):outcomes*FTPnum(s.outcomeValue,0);return{primaryBenefit:benefit,customerCost:cost}}
function FTPcalc(input,overrides){var s=Object.assign({},FTP_DEFAULTS,input||{},overrides||{}),audience=FTPnum(s.audience,0)*(s.audienceBasis==='location'?Math.max(1,FTPnum(s.locations,1)):1),engaged=audience*FTPpct(s.engagement),issued=engaged*FTPnum(s.rewardsPerPlayer,0),claimed=issued*FTPpct(s.claimRate),redeemed=claimed*FTPpct(s.redemptionRate),outcomes=redeemed*FTPpct(s.outcomeRate)*FTPpct(s.incrementality),newProfiles=engaged*FTPpct(s.registrationRate)*(1-FTPpct(s.identifiedRate)),impressions=engaged*FTPnum(s.impressionsPerPlayer,0),baseCost=FTPnum(s.license,0)+FTPnum(s.implementation,0)/Math.max(1,FTPnum(s.amortMonths,1))+FTPnum(s.opex,0),rewardsCost=redeemed*(FTPnum(s.rewardCost,0)+FTPnum(s.fulfillmentCost,0)),sponsor=FTPnum(s.sponsorFunding,0),customerCost=baseCost+rewardsCost-sponsor,outcomeBenefit=outcomes*FTPnum(s.outcomeValue,0),eq=s.acquisitionEquivalence===''||s.acquisitionEquivalence===null?null:FTPpct(s.acquisitionEquivalence),audienceBenefit=eq===null?null:newProfiles*eq*FTPnum(s.valuePerProfile,0),mediaBenefit=impressions/1000*FTPnum(s.mediaCPM,0),primaryBenefit=s.objective==='acquisition'?(audienceBenefit||0):s.objective==='media'?mediaBenefit:outcomeBenefit,fullBenefit=outcomeBenefit+(audienceBenefit||0)+mediaBenefit,netPrimary=primaryBenefit-customerCost,netFull=fullBenefit-customerCost,primaryMultiple=FTPdiv(primaryBenefit,customerCost),fullMultiple=FTPdiv(fullBenefit,customerCost),unitOutcome=FTPnum(s.outcomeValue,0),unitProfile=eq===null?0:FTPnum(s.valuePerProfile,0)*eq,unitMedia=FTPnum(s.mediaCPM,0),requiredOutcomes=FTPdiv(customerCost,unitOutcome),requiredProfiles=FTPdiv(customerCost,unitProfile),requiredImpressions=unitMedia>0?customerCost/unitMedia*1000:null,requiredRedeemed=FTPpct(s.outcomeRate)*FTPpct(s.incrementality)*unitOutcome>0?customerCost/(FTPpct(s.outcomeRate)*FTPpct(s.incrementality)*unitOutcome):null,lo=0,hi=100,requiredEngagement=null;if(s._skipSearch)requiredEngagement=null;else if(customerCost<=0)requiredEngagement=0;else{for(var i=0;i<18;i++){var mid=(lo+hi)/2,r=FTPcalcNoSearch(s,{engagement:mid});if(r.primaryBenefit>=r.customerCost)hi=mid;else lo=mid}if(FTPcalcNoSearch(s,{engagement:100}).primaryBenefit>=FTPcalcNoSearch(s,{engagement:100}).customerCost)requiredEngagement=Math.ceil(hi*10)/10}return{state:s,audience:audience,engaged:engaged,issued:issued,claimed:claimed,redeemed:redeemed,outcomes:outcomes,newProfiles:newProfiles,impressions:impressions,baseCost:baseCost,rewardsCost:rewardsCost,sponsorFunding:sponsor,customerCost:customerCost,outcomeBenefit:outcomeBenefit,audienceBenefit:audienceBenefit,mediaBenefit:mediaBenefit,primaryBenefit:primaryBenefit,fullBenefit:fullBenefit,netPrimary:netPrimary,netFull:netFull,primaryMultiple:primaryMultiple,fullMultiple:fullMultiple,requiredOutcomes:requiredOutcomes,requiredProfiles:requiredProfiles,requiredImpressions:requiredImpressions,requiredRedeemed:requiredRedeemed,requiredEngagement:requiredEngagement,costEngaged:FTPdiv(customerCost,engaged),costRedeemed:FTPdiv(customerCost,redeemed),costProfile:FTPdiv(customerCost,newProfiles),costOutcome:FTPdiv(customerCost,outcomes),costMedia:FTPdiv(customerCost,impressions/1000)}}
function FTPmatrix(input){var engagements=[3,5,10,15,20],redemptions=[15,30,45,60,75];return{engagements:engagements,redemptions:redemptions,cells:engagements.map(function(e){return redemptions.map(function(rd){var r=FTPcalcNoSearch(input,{engagement:e,redemptionRate:rd}),multiple=FTPdiv(r.primaryBenefit,r.customerCost);return{engagement:e,redemption:rd,multiple:multiple,status:multiple!==null&&multiple>=1.2?'comfortable':multiple!==null&&multiple>=1?'tight':'miss'}})})}}
function FTPramp(input){var s=Object.assign({},FTP_DEFAULTS,input||{}),rows=[];for(var m=1;m<=12;m++){var p=Math.min(1,(m-1)/Math.max(1,FTPnum(s.targetMonth,1,12)-1)),activation=FTPnum(s.m1Activation,0,100)+(FTPnum(s.targetActivation,0,100)-FTPnum(s.m1Activation,0,100))*p,audience=FTPnum(s.audience,0)*Math.pow(1+FTPnum(s.growth,-100,100)/100,m-1),r=FTPcalc(s,{audience:audience,engagement:activation,_skipSearch:true});rows.push({month:m,activation:activation,audience:audience,net:r.netFull})}return rows}
var BQ_DEFAULTS={customer:'',mode:'f2p',audience:'',locations:1,audienceBasis:'total',objective:'retention',outcomeValue:'',measurement:'linked',license:10000,implementation:10000,amortMonths:12,opex:0,rewardCost:'',engagement:10,paidFormat:'tournament',participants:'',price:'',frequency:4,prizeCost:'',rake:20,claimRate:40,redemptionRate:30,outcomeRate:20,incrementality:50};
function BQcalc(input){var s=Object.assign({},BQ_DEFAULTS,input||{}),audience=FTPnum(s.audience,0)*(s.audienceBasis==='location'?Math.max(1,FTPnum(s.locations,1)):1),engaged=audience*FTPpct(s.engagement),f2pOn=s.mode!=='paid',paidOn=s.mode!=='f2p',baseMonthlyCost=FTPnum(s.license,0)+FTPnum(s.implementation,0)/Math.max(1,FTPnum(s.amortMonths,1))+FTPnum(s.opex,0),f2p=f2pOn?FTPcalc({audience:audience,engagement:s.engagement,license:s.license,implementation:s.implementation,amortMonths:s.amortMonths,opex:s.opex,rewardCost:s.rewardCost,claimRate:s.claimRate,redemptionRate:s.redemptionRate,outcomeRate:s.outcomeRate,outcomeValue:s.outcomeValue,incrementality:s.incrementality,objective:s.objective,measurement:s.measurement}):null,participants=FTPnum(s.participants,0),frequency=Math.max(1,FTPnum(s.frequency,1)),price=FTPnum(s.price,0),prizePerTournament=FTPnum(s.prizeCost,0),monthlyPrize=s.paidFormat==='tournament'?prizePerTournament*frequency:0,paidGross=paidOn?(s.paidFormat==='tournament'?participants*frequency*price:participants*price*FTPpct(s.rake)):0,paidNet=paidGross-monthlyPrize,requiredPaidParticipants=null,requiredMonthlyEntries=null,requiredTournaments=null,requiredEngagement=null;if(s.paidFormat==='tournament'&&price>0){requiredMonthlyEntries=(baseMonthlyCost+monthlyPrize)/price;requiredPaidParticipants=requiredMonthlyEntries/frequency;var netPerEvent=participants*price-prizePerTournament;if(netPerEvent>0)requiredTournaments=baseMonthlyCost/netPerEvent;if(audience>0)requiredEngagement=requiredMonthlyEntries/audience*100}else if(s.paidFormat==='p2p'&&price*FTPpct(s.rake)>0){requiredPaidParticipants=baseMonthlyCost/(price*FTPpct(s.rake));if(audience>0)requiredEngagement=requiredPaidParticipants/audience*100}return{state:s,audience:audience,engaged:engaged,baseMonthlyCost:baseMonthlyCost,f2p:f2p,paidGross:paidGross,paidNet:paidNet,monthlyPrize:monthlyPrize,requiredPaidParticipants:requiredPaidParticipants,requiredMonthlyEntries:requiredMonthlyEntries,requiredTournaments:requiredTournaments,requiredEngagement:requiredEngagement}}

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
  // 'A reward worth $X costs us $Y': the venue's cost as a share of face value,
  // used by the recommender's reward-cost lever. Blank means take it from the
  // tournaments as entered; never an assumed discount.
  rewardCostRatio: '',
  // Adjustments applied to the recommended tournament programme by the levers:
  // extra weekly events a month, an entry-price multiplier, and whether prizes
  // are in-kind at the venue's cost ratio. They travel with the deal so the
  // recommender rebuilds the same programme when the base changes.
  recAdjust: { events: 0, priceMult: 1, rewardAtRatio: false },
  // Customer view hides every internal figure at once; inputs stay live.
  customerMode: false,
  retargetValue: 0,
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
  // Locations running in each contract year. The base above is one location.
  locations: [1, 1, 1, 1, 1],
  // Year-over-year engagement decay, off unless chosen. 95 means each contract
  // year runs at 95% of the year before.
  decayOn: false,
  decayRate: 95,
  // Seasonality, off unless chosen. A twelve-month shape normalised so the year
  // still sums to the same total; seasonStart is the calendar month the contract
  // begins in, 1 = January.
  seasonOn: false,
  seasonPreset: 'flat',
  seasonProfile: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  seasonStart: 1,
  // Sponsors credit the licence directly in the month paid, before any split.
  sponsors: [],
  // A payment at signing, credited against the licence in month 1 before any
  // activity. 'amount' is dollars; 'pct' is a share of the year-1 fee. Ported
  // from the retired Licence Payoff engine.
  upfrontMode: 'none',
  upfrontValue: 0,
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

/* Locations running in each contract year, never fewer than the year before
   and never fewer than one. The base is entered for one location. */
function TPlocations(s) {
  var n = TPterm(s), raw = Array.isArray(s.locations) ? s.locations : [], out = [], prev = 1;
  for (var i = 0; i < n; i++) {
    var v = Math.max(1, prev, Math.round(TPnum(raw[i], 0)));
    out.push(v); prev = v;
  }
  return out;
}

/* The month each location opens. Year-one locations are open from month one.
   A year's additions are spread evenly through that year rather than all
   landing on its first day, because that is how openings actually happen. */
function TPopenings(s) {
  var counts = TPlocations(s), open = [], prev = 0;
  counts.forEach(function (count, y) {
    var added = count - prev;
    for (var k = 0; k < added; k++) {
      open.push(y === 0 ? 1 : y * 12 + 1 + Math.floor(k * 12 / added));
    }
    prev = count;
  });
  return open;
}

/* Volume in a month as a multiple of one fully ramped location: every location
   open by then, each on its own launch ramp from the month it opened. */
function TPvolumeFactor(s, month) {
  var total = 0;
  TPopenings(s).forEach(function (opened) {
    if (month >= opened) total += TPrampFactor(s, month - opened + 1);
  });
  return total;
}

function TPavgVolume(s, months) {
  var n = months || TPterm(s) * 12, total = 0;
  for (var m = 1; m <= n; m++) total += TPvolumeFactor(s, m);
  return n > 0 ? total / n : 1;
}

/* Seasonal shapes. These are illustrative in-season / off-season shapes, not
   measured data, and every profile is editable. They are normalised to a mean
   of one so a season changes when volume lands, never how much lands in a year. */
var TP_SEASONS = {
  flat:   { label: 'Flat, no season', profile: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
  nfl:    { label: 'NFL (Sep-Feb)', profile: [1.3, 1.2, 0.6, 0.5, 0.5, 0.5, 0.6, 0.8, 1.4, 1.5, 1.5, 1.5] },
  nbanhl: { label: 'NBA / NHL (Oct-Jun)', profile: [1.3, 1.3, 1.3, 1.4, 1.3, 1.1, 0.4, 0.4, 0.5, 1.2, 1.3, 1.4] },
  mlb:    { label: 'MLB (Apr-Oct)', profile: [0.4, 0.5, 0.8, 1.3, 1.4, 1.4, 1.4, 1.4, 1.4, 1.3, 0.5, 0.4] },
  venue:  { label: 'Venue / family entertainment', profile: [0.8, 0.9, 1.0, 1.0, 1.0, 1.3, 1.4, 1.3, 0.9, 0.9, 1.0, 1.5] },
  custom: { label: 'Custom', profile: null }
};

function TPseasonProfile(s) {
  var flat = TP_SEASONS.flat.profile;
  if (!s.seasonOn) return flat;
  var raw = s.seasonPreset === 'custom'
    ? (Array.isArray(s.seasonProfile) && s.seasonProfile.length === 12 ? s.seasonProfile : flat)
    : ((TP_SEASONS[s.seasonPreset] || TP_SEASONS.flat).profile || flat);
  var arr = raw.map(function (v) { return TPnum(v, 0); }),
    mean = arr.reduce(function (a, b) { return a + b; }, 0) / 12;
  return mean > 0 ? arr.map(function (v) { return v / mean; }) : flat;
}

function TPseasonFactor(s, month) {
  var start = Math.max(1, Math.min(12, Math.round(TPnum(s.seasonStart, 1))));
  return TPseasonProfile(s)[(start - 1 + month - 1) % 12];
}

/* Engagement decay by contract year: year one is untouched, each later year
   runs at the chosen share of the year before. */
function TPdecayFactor(s, month) {
  if (!s.decayOn) return 1;
  var rate = TPnum(s.decayRate, 0, 100) / 100, year = Math.floor((month - 1) / 12);
  return Math.pow(rate, year);
}

/* Everything that scales the audience in a month, as one factor: locations open
   and ramping, engagement decay by year, and where in the season the month falls. */
function TPaudienceFactor(s, month) {
  return TPvolumeFactor(s, month) * TPdecayFactor(s, month) * TPseasonFactor(s, month);
}

function TPavgAudience(s, months) {
  var n = months || TPterm(s) * 12, total = 0;
  for (var m = 1; m <= n; m++) total += TPaudienceFactor(s, m);
  return n > 0 ? total / n : 1;
}

/* Sponsor money landing in a given contract month. */
function TPsponsorsInMonth(s, month) {
  return (s.sponsors || []).reduce(function (a, sp) {
    return a + (Math.round(TPnum(sp.month, 1)) === month ? Math.max(0, TPnum(sp.amount, 0)) : 0);
  }, 0);
}

/* The upfront payment, in dollars, credited at signing. Nothing on a waived
   licence, and never more than the year-1 fee on a percentage basis. */
function TPupfront(s) {
  if (s.freeLicense) return 0;
  var v = TPnum(s.upfrontValue, 0);
  if (s.upfrontMode === 'amount') return v;
  if (s.upfrontMode === 'pct') return TPnum(v, 0, 100) / 100 * (TPfees(s)[0] || 0);
  return 0;
}

/* Participants for one tournament type: its own headcount, or its own share of
   the addressable base, per location, scaled by the locations open and their
   ramps that month. */
function TPtypeParticipants(s, t, month) {
  var full = t.basis === 'mau'
    ? TPnum(s.mau, 0) * TPnum(t.participantPct, 0) / 100
    : TPnum(t.participants, 0);
  return full * TPaudienceFactor(s, month);
}

function TPentriesPerEvent(s, t, month) {
  var p = TPtypeParticipants(s, t, month);
  return p + (t.rebuyMode === 'pct' ? p * TPnum(t.rebuyPct, 0) / 100 : p * TPnum(t.rebuys, 0));
}

function TPvalidate(input) {
  var s = TPstate(input), errors = [];
  if (!s.includeTournaments && !s.includeH2H) errors.push('Select at least one product: tournaments, head-to-head, or both.');

  if (s.includeH2H && TPreach(s) <= 0) errors.push('Enter addressable users, or a head-to-head reach.');

  // Head-to-head is paid out of this split too, so it is checked for either product.
  var post = TPnum(s.post.operator) + TPnum(s.post.lucra);
  if (Math.abs(post - 100) > 0.001) errors.push('Operator and Lucra split must sum to 100%.');

  if (!s.includeTournaments) return errors;

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

/* The whole deal, month by month. Tournament entries and the head-to-head
   platform fee form one pool that is split at the same rates and credits the
   licence at the same share. Sponsors credit the licence directly, before the
   split, in the month they pay. cfg carries the head-to-head inputs; without it
   only tournaments are modelled. factor scales engagement, for the case band. */
function TPcalculate(input, cfg, factor) {
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
    totalH2HFee = 0, totalH2HVolume = 0, totalRewardValue = 0,
    totalSponsorCredited = 0, totalSponsorUnapplied = 0,
    upfront = TPupfront(s), totalUpfrontCredited = 0,
    useH2H = !!s.includeH2H && !!cfg,
    tournamentsOn = s.includeTournaments ? s.tournaments : [],
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

    // The upfront payment lands at signing, then sponsors; both go straight
    // against the licence before any activity.
    var openingRemaining = remaining,
      upfrontCredit = month === 1 ? Math.min(remaining, upfront) : 0;
    remaining = Math.max(0, remaining - upfrontCredit);
    cumulativeLicense += upfrontCredit;
    totalUpfrontCredited += upfrontCredit;
    if (years[yi]) years[yi].credited += upfrontCredit;
    var sponsorPaid = TPsponsorsInMonth(s, month),
      sponsorCredit = Math.min(remaining, sponsorPaid);
    remaining = Math.max(0, remaining - sponsorCredit);
    cumulativeLicense += sponsorCredit;
    totalSponsorCredited += sponsorCredit;
    totalSponsorUnapplied += sponsorPaid - sponsorCredit;
    if (years[yi]) years[yi].credited += sponsorCredit;

    var handle = 0, prizeCost = 0, detail = [], participants = 0;
    tournamentsOn.forEach(function (t) {
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
    var hm = useH2H ? TPmonthlyH2H(s, cfg, month, factor) : null,
      h2hFee = hm ? hm.platformFee : 0,
      splitBase = handle + h2hFee,
      licenseGross = rates.credit > 0 ? Math.min(splitBase, remaining / rates.credit) : 0,
      postGross = splitBase - licenseGross,
      toLicense = Math.min(remaining, licenseGross * rates.credit),
      operatorGross = licenseGross * rates.operator + postGross * rates.postOperator,
      toLucra = licenseGross * rates.lucra + postGross * rates.postLucra,
      toOperator = operatorGross - prizeCost,
      grossMargin = handle - prizeCost;
    if (hm) { totalH2HFee += h2hFee; totalH2HVolume += hm.paidVolume; totalRewardValue += hm.rewardValue; }

    // A month is a loss when the partner's share does not cover the prizes they fund.
    if (toOperator < 0) lossMonths++;
    remaining = Math.max(0, remaining - toLicense);
    cumulativeLicense += toLicense;
    totalOperator += toOperator; totalOperatorGross += operatorGross; totalLucra += toLucra;
    totalHandle += handle; totalPrizeCost += prizeCost; totalSplitBase += splitBase;
    if (years[yi]) years[yi].credited += toLicense;

    // If the signing payment or a sponsor cleared it before any activity, the
    // month is done at its start.
    var fraction = splitBase > 0 ? licenseGross / splitBase : (sponsorCredit + upfrontCredit > 0 && remaining <= 1e-9 ? 0 : 1);
    if (years[yi] && years[yi].clearMonth === null && openingRemaining > 1e-9 && remaining <= 1e-9) {
      years[yi].clearMonth = month - 1 + fraction;
    }
    if (!annual && payoffMonth === null && !rates.free && totalContract > 0 && openingRemaining > 1e-9 && remaining <= 1e-9) {
      payoffMonth = month - 1 + fraction;
    }

    months.push({
      month: month, year: yi + 1, monthInYear: monthInYear,
      participants: participants, handle: handle, prizeCost: prizeCost,
      h2hFee: h2hFee, h2hVolume: hm ? hm.paidVolume : 0, h2hEngaged: hm ? hm.engaged : 0,
      rewardValue: hm ? hm.rewardValue : 0,
      sponsorPaid: sponsorPaid, sponsorCredit: sponsorCredit, upfrontCredit: upfrontCredit,
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
    totalH2HFee: totalH2HFee, totalH2HVolume: totalH2HVolume, totalRewardValue: totalRewardValue,
    totalSponsorCredited: totalSponsorCredited, totalSponsorUnapplied: totalSponsorUnapplied,
    upfront: upfront, totalUpfrontCredited: totalUpfrontCredited,
    includesH2H: useH2H,
    lossMonths: lossMonths, free: rates.free
  };
}

/* Head-to-head in one month. Wagering produces the platform fee; rewards are free
   to play and produce venue value through redeemed visits, never a fee. */
function TPmonthlyH2H(s, cfg, month, factor) {
  var f = factor === undefined ? 1 : TPnum(factor, 0), c = cfg || {},
    on = !!s.includeH2H,
    wagering = on && s.h2hMode !== 'rewards',
    rewards = on && s.h2hMode !== 'wagering',
    reach = TPreach(s),
    engagement = on ? Math.min(100, TPnum(c.engagement, 0, 100) * f) : 0,
    aud = TPaudienceFactor(s, month),
    engaged = reach * engagement / 100 * aud,
    paidPlays = wagering ? engaged * TPnum(c.playsPerUser, 0) : 0,
    paidVolume = paidPlays * TPnum(c.spendPerPlay, 0),
    feeRate = TPnum(c.feeRate, 0, 100) / 100,
    platformFee = paidVolume * feeRate,
    rewardPlays = rewards ? engaged * TPnum(c.rewardGames, 0) : 0,
    rewardWins = rewardPlays * TPnum(c.winRate, 0, 100) / 100,
    rewardRedemptions = rewardWins * TPnum(c.redeemRate, 0, 100) / 100,
    rewardValue = rewardRedemptions * TPnum(c.valuePerRedemption, 0);
  return {
    on: on, wagering: wagering, rewards: rewards, reach: reach, engagement: engagement,
    audience: aud, engaged: engaged, paidPlays: paidPlays, paidVolume: paidVolume,
    feeRate: feeRate * 100, platformFee: platformFee,
    rewardPlays: rewardPlays, rewardWins: rewardWins,
    rewardRedemptions: rewardRedemptions, rewardValue: rewardValue
  };
}

/* Head-to-head averaged across the term, for readouts. The split of its fee is
   worked out month by month inside TPcalculate, alongside tournament entries. */
function TPh2h(input, cfg, factor) {
  var s = TPstate(input), n = TPterm(s) * 12 || 12, sum = null, keys = [
    'engaged', 'paidPlays', 'paidVolume', 'platformFee', 'rewardPlays', 'rewardWins', 'rewardRedemptions', 'rewardValue', 'audience'
  ];
  for (var m = 1; m <= n; m++) {
    var x = TPmonthlyH2H(s, cfg, m, factor);
    if (!sum) { sum = Object.assign({}, x); keys.forEach(function (k) { sum[k] = 0; }); }
    keys.forEach(function (k) { sum[k] += x[k]; });
  }
  keys.forEach(function (k) { sum[k] = sum[k] / n; });
  var rates = TPsplitRates(s);
  sum.ramp = sum.audience;
  // Indicative split of the average fee. The real month-by-month split, where the
  // fee also credits the licence, lives in TPcalculate.
  sum.lucraShare = sum.platformFee * rates.lucra;
  sum.operatorShare = sum.platformFee - sum.lucraShare;
  // The Revenue Model tab is authoritative: a free licence waives Lucra's fee
  // whatever any other tab holds.
  sum.licenseMonthly = s.freeLicense ? 0 : TPfees(s)[0] / 12;
  sum.licenseWaived = !!s.freeLicense;
  sum.revenueGenerated = sum.platformFee;
  return sum;
}

function TPCcase(cfg, factor) {
  var f = factor === undefined ? 1 : TPnum(factor, 0),
    s = TPstate(cfg.tournament),
    onTournaments = !!s.includeTournaments,
    h = TPh2h(s, cfg, f),
    tState = TPscaled(s, f, 1),
    r = TPcalculate(tState, cfg, f),
    months = r.months.length || 12,
    usable = !r.errors.length,
    // Both products contribute the pool their split is taken from: the head-to-head
    // platform fee, and gross tournament entries. Prize funding is the partner's own
    // cost out of their share, so it is reported separately, never netted off here.
    tournamentMonthly = usable && onTournaments ? r.totalHandle / months : 0,
    feeMonthly = usable ? r.totalH2HFee / months : 0,
    prizeFundingMonthly = usable ? r.totalPrizeCost / months : 0,
    operatorNetMonthly = usable ? r.totalOperator / months : 0,
    lucraMonthly = usable ? r.totalLucra / months : 0,
    tournamentParticipants = usable && onTournaments ? (r.months[months - 1] || {}).participants || 0 : 0,
    mau = TPnum(s.mau, 0),
    tournamentShare = mau > 0 ? tournamentParticipants / mau * 100 : 0;

  return {
    factor: f,
    includeH2H: h.on, includeTournaments: onTournaments,
    mau: mau, h2h: h,
    engagement: h.engagement, engaged: h.engaged,
    paidVolume: h.paidVolume, p2pFee: feeMonthly,
    rewardRedemptions: h.rewardRedemptions, rewardValue: h.rewardValue,
    // Lucra's share of both products, split month by month, plus the licence
    // fee itself when one is paid.
    lucraShare: lucraMonthly + (r.free ? 0 : (r.totalContract || 0) / months),
    tournamentParticipants: tournamentParticipants,
    tournamentShare: tournamentShare,
    tournamentEntries: tournamentMonthly,
    prizeFunding: prizeFundingMonthly,
    operatorNet: operatorNetMonthly,
    tournamentResult: r,
    revenueGenerated: feeMonthly + tournamentMonthly,
    annualRevenueGenerated: (feeMonthly + tournamentMonthly) * 12,
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
      var c = TPscaled(s, factors[ri], factors[ci]), r = TPcalculate(c, h2hCfg, factors[ri]);
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
    var c = TPscaled(s, factors[ri], 1), r = TPcalculate(c, h2hCfg, factors[ri]),
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
    (s.rampOn || TPlocations(s).slice(-1)[0] > 1 ? ' averaged across the ramp and openings' : '') + '.';
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

function TPpitchTournaments(input, cfg) {
  var s = TPstate(input), r = TPcalculate(s, cfg);
  if (!s.includeTournaments) return '';
  if (r.errors.length) return 'Complete the tournament inputs to build the pitch.';
  var m1 = r.months[0] || {}, perYear = r.totalSplitBase / TPterm(s),
    types = s.tournaments.length,
    events = s.tournaments.reduce(function (a, t) { return a + TPnum(t.eventsPerMonth, 0); }, 0);
  var out = types + ' tournament format' + (types === 1 ? '' : 's') + ' running ' + Math.round(events) +
    ' event' + (Math.round(events) === 1 ? '' : 's') + ' a month draws ' + Math.round(m1.participants || 0).toLocaleString() +
    ' participants in month one, generating ' + TPmoney0(m1.handle || 0) + ' of entries to split. ' +
    'The operator funds ' + TPmoney0(m1.prizeCost || 0) + ' of prizes out of their own share.';
  out += ' Over the term that is ' + TPmoney0(r.totalHandle / TPterm(s)) + ' a year' +
    (r.includesH2H && r.totalH2HFee > 0 ? ', and with the head-to-head fee alongside it the pool is ' + TPmoney0(perYear) + ' a year' : '') + '.';
  if (r.totalUpfrontCredited > 0) out += ' ' + TPmoney0(r.totalUpfrontCredited) + ' paid at signing came off the licence first.';
  if (r.totalSponsorCredited > 0) out += ' Sponsors put ' + TPmoney0(r.totalSponsorCredited) + ' straight against the licence.';
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

/* ---------- configuration recommender ----------
   Takes a monthly active base and proposes a programme that clears the licence.
   Every band below is anchored to one of exactly two things: the reference deals
   that already ship in this tool, or a published figure that can be cited. Where
   no public benchmark exists the band stays a Lucra assumption and says so.
   Nothing is modelled above the published ceiling: if the deal does not clear
   there, the recommender reports the gap rather than inflating participation. */

var TP_BANDS = {
  engagement: {
    anchors: [[100000, 15], [500000, 10], [5000000, 8], [25000000, 2]],
    source: 'Lucra reference deals in this tool, interpolated by base size',
    mid: 14.5, midSource: 'Skillz FY2024, 118k paying MAU of 816k MAU (SEC-filed)',
    ceiling: 21, ceilingSource: 'Skillz FY2025, 141k paying MAU of 658k MAU (SEC-filed)'
  },
  takeFee: {
    floor: 10, floorSource: 'Lucra reference deals',
    ceiling: 19, ceilingSource: 'Skillz FY2025, $61.70 monthly revenue per paying user against ~$320 of entry volume'
  },
  spend: {
    base: 40, baseSource: 'Lucra reference deals, 20 plays at $2',
    published: 320, publishedSource: 'Skillz FY2025, $541.9m entry volume over 141k paying users'
  },
  redemption: {
    base: 25, baseSource: 'Lucra reference deals',
    ceiling: 49.8, ceilingSource: 'Antavo Global Customer Loyalty Report 2024, average reward redemption across 600 programmes'
  },
  rewardValue: {
    base: 8, baseSource: 'Lucra reference deals',
    context: 'Sits inside NFL concession pricing: $5.94 a hot dog, $9.67 a beer (Team Marketing Report Fan Cost Index 2024)'
  },
  participation: {
    source: 'Lucra assumption. No public benchmark exists for tournament participation as a share of a host app base, so this one is not claimed as an industry figure.'
  }
};

/* Engagement by base size, interpolated on a log scale between the reference
   deals, because a bigger base engages a smaller share of itself. */
function TPengCurve(mau) {
  var m = TPnum(mau, 0), a = TP_BANDS.engagement.anchors;
  if (m <= a[0][0]) return a[0][1];
  if (m >= a[a.length - 1][0]) return a[a.length - 1][1];
  for (var i = 1; i < a.length; i++) {
    if (m <= a[i][0]) {
      var t = (Math.log(m) - Math.log(a[i - 1][0])) / (Math.log(a[i][0]) - Math.log(a[i - 1][0]));
      return Math.round((a[i - 1][1] + (a[i][1] - a[i - 1][1]) * t) * 10) / 10;
    }
  }
  return a[a.length - 1][1];
}

/* The ladder. Step 0 is what the reference deals already say; the last step is
   the highest published figure for this vertical. There is deliberately no
   step beyond it. */
function TPrecSteps() {
  return [
    { key: 'conservative', label: 'Lucra reference, conservative', engMin: 0, plays: 20, wager: 2, rake: 10,
      basis: 'The reference deals in this tool, at their low end.' },
    { key: 'reference-upper', label: 'Lucra reference, upper end', engMin: 0, plays: 25, wager: 3, rake: 12.5,
      basis: 'Still inside the reference deals, at their upper end.' },
    { key: 'published-2024', label: 'Engagement at the FY2024 published figure', engMin: 14.5, plays: 25, wager: 3, rake: 15,
      basis: 'Paying share lifted to Skillz FY2024, the same vertical, SEC-filed.' },
    { key: 'published-2025', label: 'Ceiling: the FY2025 published figure', engMin: 21, plays: 25, wager: 5, rake: 19,
      basis: 'The highest published figures for this vertical. Nothing above this is modelled.' }
  ];
}

/* A programme scaled to the base. Prize funding is sized against the share the
   operator actually receives, not against gross entries: they fund the prize out
   of their own share, so a pool bigger than that share loses them money every
   month. A structural choice, not a benchmark. */
function TPrecPrizeShare(s) {
  var rates = TPsplitRates(TPstate(s));
  return Math.max(0.15, Math.min(0.5, rates.operator * 0.8));
}

function TPrecTournaments(mau, prizeShare) {
  var m = TPnum(mau, 0), ps = prizeShare === undefined ? 0.32 : prizeShare,
    mk = function (id, name, price, events, pct) {
      var prize = Math.round(m * pct / 100 * price * ps);
    return { id: id, name: name, entryPrice: price, eventsPerMonth: events, basis: 'mau',
      participants: 0, participantPct: pct, rebuyMode: 'avg', rebuys: 0, rebuyPct: 0,
      isCash: false, rewardFaceValue: prize, customerCashCost: prize, cashPrizeAmount: prize };
    };
  return [mk('rec-weekly', 'Weekly open', 5, 4, 1), mk('rec-major', 'Monthly major', 25, 1, 0.3)];
}

/* The programme adjustments carried on the deal, normalised. */
function TPrecAdjust(s) {
  var a = (s && s.recAdjust) || {};
  return {
    events: Math.max(0, Math.round(TPnum(a.events, 0))),
    priceMult: TPnum(a.priceMult, 1) || 1,
    rewardAtRatio: !!a.rewardAtRatio
  };
}

/* The recommended programme for this deal: the scaled programme with the
   deal's own adjustments applied, so an applied lever survives a change of
   base instead of being regenerated away. */
function TPrecProgramme(base, mau) {
  var a = TPrecAdjust(base), ratio = TPrewardCostRatio(base);
  return TPrecTournaments(mau, TPrecPrizeShare(base)).map(function (t) {
    var c = Object.assign({}, t);
    if (c.id === 'rec-weekly') c.eventsPerMonth = c.eventsPerMonth + a.events;
    if (a.priceMult !== 1) {
      c.entryPrice = c.entryPrice * a.priceMult;
      c.rewardFaceValue = Math.round(c.rewardFaceValue * a.priceMult);
      c.customerCashCost = Math.round(c.customerCashCost * a.priceMult);
      c.cashPrizeAmount = Math.round(c.cashPrizeAmount * a.priceMult);
    }
    if (a.rewardAtRatio) { c.isCash = false; c.customerCashCost = Math.round(c.rewardFaceValue * ratio); }
    return c;
  });
}

/* The take fee is a commercial term the seller sets inside the 5-25% band, not
   a benchmark: a deal that already carries a higher fee than a ladder step is
   never recommended a lower one. opts.rakeFloor is the deal's current fee. */
function TPrecStepFor(step, opts) {
  var floor = opts && opts.rakeFloor !== undefined && opts.rakeFloor !== null && isFinite(Number(opts.rakeFloor))
    ? TPnum(opts.rakeFloor, 0, 25) : 0;
  return floor > step.rake ? Object.assign({}, step, { rake: floor, rakeFromDeal: true }) : step;
}

function TPrecCandidate(base, step, mau, tournaments, opts) {
  var m = TPnum(mau, 0);
  step = TPrecStepFor(step, opts);
  var eng = Math.max(TPengCurve(m), step.engMin),
    s = TPstate(Object.assign({}, base, {
      mau: m, h2hReach: m, rampOn: false,
      tournaments: base.includeTournaments ? (tournaments || TPrecProgramme(base, m)) : (base.tournaments || [])
    })),
    cfg = { mau: m, engagement: eng, playsPerUser: step.plays, spendPerPlay: step.wager,
      feeRate: step.rake, rewardGames: 8, winRate: 50,
      redeemRate: TP_BANDS.redemption.base, valuePerRedemption: TP_BANDS.rewardValue.base,
      tournament: s };
  return { step: step, engagement: eng, state: s, cfg: cfg };
}

function TPrecMeasure(cand) {
  var s = cand.state, r = TPcalculate(s, cand.cfg, 1), h = TPh2h(s, cand.cfg, 1),
    term = TPterm(s) || 1, onH = !!s.includeH2H, onT = !!s.includeTournaments,
    ok = !r.errors.length,
    lucraYear = ok ? r.totalLucra / term : 0,
    operatorYear = ok ? r.totalOperator / term : 0,
    licenceYear = r.free ? 0 : (r.totalContract || 0) / term;
  return {
    errors: r.errors, result: r, h2h: h,
    state: s, cfg: cand.cfg,
    engagement: cand.engagement, step: cand.step,
    licenceYear: licenceYear, lucraYear: lucraYear, operatorYear: operatorYear,
    revenueYear: ok ? r.totalSplitBase / term : 0,
    prizeYear: ok && onT ? r.totalPrizeCost / term : 0,
    rewardValueYear: ok && onH ? r.totalRewardValue / term : 0,
    payoffMonth: r.payoffMonth,
    tests: {
      licenceRetired: r.free || (!r.errors.length && r.payoffMonth !== null),
      lucraCoversLicence: r.free ? lucraYear > 0 : lucraYear >= licenceYear - 1e-6,
      operatorPositive: operatorYear > 0
    }
  };
}

/* The verdict. On a paid licence Lucra is paid the fee whether or not the split
   share would have covered it, so that test is informational there and gates
   only a waived deal, where the share is all Lucra earns. */
function TPrecPasses(m) {
  return m.tests.licenceRetired && m.tests.operatorPositive && (m.result.free ? m.tests.lucraCoversLicence : true);
}

/* The money gap someone still has to find, in dollars a year: an unretired
   licence, or an operator who ends the year negative after prize funding. */
function TPrecGapYear(m, term) {
  var t = term || 1,
    licenceGap = m.result.free ? 0 : Math.max(0, (m.result.balanceDue || 0) / t),
    operatorGap = Math.max(0, -m.operatorYear);
  return { licenceGap: licenceGap, operatorGap: operatorGap, gap: Math.max(licenceGap, operatorGap) };
}

/* Walk the ladder and stop at the first step that clears every test. If the
   ceiling still does not clear, return the ceiling and the size of the gap. */
function TPrecommend(input, mau, opts) {
  var base = TPstate(input), m = TPnum(mau, 0), steps = TPrecSteps(), tried = [], chosen = null;
  if (m <= 0) return { ok: false, reason: 'Enter a monthly active base to build a recommendation.', tried: [] };
  for (var i = 0; i < steps.length; i++) {
    var measured = TPrecMeasure(TPrecCandidate(base, steps[i], m, null, opts));
    tried.push(measured);
    if (!chosen && TPrecPasses(measured)) chosen = measured;
  }
  var final = chosen || tried[tried.length - 1],
    term = TPterm(base) || 1,
    gaps = TPrecGapYear(final, term),
    licenceGap = gaps.licenceGap,
    lucraGap = Math.max(0, final.licenceYear - final.lucraYear),
    gap = gaps.gap,
    sponsorsTotal = (base.sponsors || []).reduce(function (a, sp) { return a + Math.max(0, TPnum(sp.amount, 0)); }, 0);
  // Sponsors are already inside the result: they credited the licence before
  // any split, so licenceGap is what remains after them.
  return {
    ok: true, mau: m, cleared: !!chosen, chosen: final, tried: tried,
    licenceGapYear: licenceGap, lucraGapYear: lucraGap, operatorGapYear: gaps.operatorGap, shortfallYear: gap,
    sponsorsTotal: sponsorsTotal, sponsorsPerYear: sponsorsTotal / term,
    retargetValue: TPnum(base.retargetValue, 0)
  };
}


/* ---------- levers that close a gap ----------
   When a deal is short, what single change closes it. Tried in the order that
   matters commercially: the tournament programme first, because every customer
   has one and a reward that costs less than it is worth lifts the operator's
   net without touching entries; then the take fee, which is really a
   head-to-head lever; then more locations, only for a customer that already
   has more than one. The licence structure is not a lever. */

/* The venue's cost for a reward as a share of its face value. Taken from the
   deal if entered, otherwise from the tournaments as configured. Never an
   assumed discount. */
function TPrewardCostRatio(s) {
  var entered = s.rewardCostRatio;
  if (entered !== '' && entered !== null && entered !== undefined && isFinite(Number(entered))) {
    return Math.max(0, Math.min(1, TPnum(entered, 0) / 100));
  }
  var face = 0, cost = 0;
  (s.tournaments || []).forEach(function (t) {
    if (t.isCash) return;
    face += TPnum(t.rewardFaceValue, 0); cost += TPnum(t.customerCashCost, 0);
  });
  return face > 0 ? Math.max(0, Math.min(1, cost / face)) : 1;
}

function TPrecGapOf(base, cfg, mau, opts) {
  var m = TPrecMeasure(TPrecCandidate(base, cfg.step, mau, cfg.tournaments, opts));
  return { clears: TPrecPasses(m), gap: TPrecGapYear(m, TPterm(TPstate(base)) || 1).gap, measure: m };
}

/* Each lever is expressed as a patch to the deal (recAdjust, locations) or to
   the take fee, so applying it changes the deal and the recommender then
   rebuilds from the changed deal and agrees with itself. */
function TPrecLevers(input, mau, step, opts) {
  var base = TPstate(input), m = TPnum(mau, 0), levers = [];
  if (m <= 0 || !step) return levers;
  step = TPrecStepFor(step, opts);
  var current = TPrecGapOf(base, { step: step }, m);
  if (current.clears) return levers;
  var tryLever = function (key, label, detail, patchedBase, patchedStep, apply) {
    var out = TPrecGapOf(patchedBase, { step: patchedStep || step }, m);
    levers.push({ key: key, label: label, detail: detail, clears: out.clears, gapAfter: out.gap, gapBefore: current.gap, apply: apply });
    return out.clears;
  };
  var withAdjust = function (patch) { return Object.assign({}, base, { recAdjust: Object.assign({}, TPrecAdjust(base), patch) }); };

  // 1. Tournament programme.
  if (base.includeTournaments) {
    var adj = TPrecAdjust(base), tours = TPrecProgramme(base, m), ratio = TPrewardCostRatio(base);

    // a. one more weekly event a month
    var eventsNow = tours[0].eventsPerMonth, eventsPatch = { events: adj.events + 1 };
    tryLever('events', 'One more weekly event a month', 'Weekly open runs ' + (eventsNow + 1) + ' times a month instead of ' + eventsNow + '.',
      withAdjust(eventsPatch), null, { adjust: eventsPatch });

    // b. entry price doubled, once: beyond that is outside the reference range
    if (adj.priceMult < 2) {
      var pricePatch = { priceMult: adj.priceMult * 2 };
      tryLever('price', 'Entry prices doubled', '$' + tours[0].entryPrice + ' becomes $' + (tours[0].entryPrice * 2) + ' and $' + tours[1].entryPrice + ' becomes $' + (tours[1].entryPrice * 2) + ', prizes scaled with them.',
        withAdjust(pricePatch), null, { adjust: pricePatch });
    }

    // c. rewards that cost less than they are worth, at the venue's own ratio
    if (ratio < 0.999 && !adj.rewardAtRatio) {
      var ratioPatch = { rewardAtRatio: true };
      tryLever('reward-cost', 'In-kind rewards at your cost ratio', 'Prizes keep their face value; they cost the venue ' + Math.round(ratio * 100) + '% of it, as entered.',
        withAdjust(ratioPatch), null, { adjust: ratioPatch });
    }
  }

  // 2. Take fee, within 5-25%, only when head-to-head runs.
  if (base.includeH2H && step.rake < 25) {
    var found = null;
    for (var fee = step.rake + 0.5; fee <= 25 && !found; fee += 0.5) {
      var st2 = Object.assign({}, step, { rake: fee });
      if (TPrecGapOf(base, { step: st2 }, m).clears) found = fee;
    }
    var stepFee = Object.assign({}, step, { rake: found || 25 });
    tryLever('take-fee', found ? 'Take fee to ' + found + '%' : 'Take fee at the 25% ceiling',
      found ? 'From ' + step.rake + '% to ' + found + '% of paid-game volume, inside the 5-25% band.' : 'Even 25% does not clear it on its own.',
      base, stepFee, { rake: found || 25 });
  }

  // 3. More locations, only for a customer that already has more than one.
  var locs = TPlocations(base);
  if (locs[locs.length - 1] > 1) {
    var more = locs.slice(); more[more.length - 1] = more[more.length - 1] + 1;
    for (var i = more.length - 2; i >= 1; i--) if (more[i] > more[i + 1]) more[i] = more[i + 1];
    tryLever('locations', 'One more location in year ' + locs.length, locs.join(' → ') + ' becomes ' + more.join(' → ') + '.',
      Object.assign({}, base, { locations: more }), null, { locations: more });
  }

  // Ones that clear first, then the commercial order.
  var order = ['events', 'price', 'reward-cost', 'take-fee', 'locations'];
  levers.sort(function (a, b) { return (b.clears - a.clears) || (order.indexOf(a.key) - order.indexOf(b.key)); });
  return levers;
}

/* TP-PURE-END */
module.exports = { C, MGcalc, tmCompute, gmCompute, FTPcalc, FTPmatrix, FTPramp, FTP_DEFAULTS, BQcalc, BQ_DEFAULTS, DMcalc, DM_DEFAULTS, TPnum, TPstate, TPsplitRates, TPvalidate, TPcalculate, TPcustomerProjection, TPterm, TPfees, TPrampFactor, TPtypeParticipants, TPentriesPerEvent, TPheatMap, TPscaled, TPCcase, TPCcases, TP_DEFAULTS, TP_SPLITS, TP_MAX_YEARS, TPreach, TPavgRamp, TPlocations, TPopenings, TPvolumeFactor, TPavgVolume, TP_SEASONS, TPseasonProfile, TPseasonFactor, TPdecayFactor, TPaudienceFactor, TPavgAudience, TPsponsorsInMonth, TPupfront, TPmonthlyH2H, TPh2h, TPpitchH2H, TPpitchTournaments,
  TP_BANDS, TPengCurve, TPrecSteps, TPrecTournaments, TPrecCandidate, TPrecPrizeShare, TPrecMeasure, TPrecommend, TPrewardCostRatio, TPrecLevers, TPrecAdjust, TPrecProgramme, TPrecStepFor, TPrecGapOf, TPrecPasses, TPrecGapYear };

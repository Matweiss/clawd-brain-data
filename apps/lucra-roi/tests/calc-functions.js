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

var LP_DEFAULTS={customerName:'',termYears:2,annualFees:[12000,48000,48000],upfrontMode:'amount',upfrontValue:0,carryForward:true,payoff:{customer:40,lucra:10,credit:50},post:{customer:90,lucra:10},postMode:'term',audience:5000,engagement:10,rebuy:1.15,growthRate:0,growthMonths:6,tournamentMode:'audience',planCount:2,planCadence:4,tournamentsOn:true,tournaments:[{id:'open',name:'Open play',entryPrice:5,entriesPerEvent:200,eventsPerMonth:4,prizeCost:500},{id:'headline',name:'Headline event',entryPrice:20,entriesPerEvent:50,eventsPerMonth:1,prizeCost:750}],h2hOn:false,h2h:{players:500,monthlyWager:20,rake:20},miniOn:false,mini:{audience:10000,engagement:10,monthlySpend:5,rake:20},sponsorOn:false,sponsors:[{id:'launch',name:'Launch sponsor',amount:0,month:1}]};
function LPnum(v,lo,hi){v=Number(v);if(!isFinite(v))v=0;if(lo!==undefined)v=Math.max(lo,v);if(hi!==undefined)v=Math.min(hi,v);return v}
function LPclone(s){return JSON.parse(JSON.stringify(s))}
function LPstate(s){var out=LPclone(LP_DEFAULTS),src=s||{};Object.keys(src).forEach(function(k){out[k]=src[k]&&typeof src[k]==='object'&&!Array.isArray(src[k])?Object.assign({},out[k]||{},src[k]):src[k]});out.annualFees=(src.annualFees||out.annualFees).slice(0,3);out.tournaments=(src.tournaments||out.tournaments).map(function(x){return Object.assign({},x)});out.sponsors=(src.sponsors||out.sponsors).map(function(x){return Object.assign({},x)});return out}
function LPvalidate(s){s=LPstate(s);var errors=[],pay=LPnum(s.payoff.customer)+LPnum(s.payoff.lucra)+LPnum(s.payoff.credit),post=LPnum(s.post.customer)+LPnum(s.post.lucra);if(Math.abs(pay-100)>.001)errors.push('Payoff split must sum to 100%');if(Math.abs(post-100)>.001)errors.push('Post-payoff split must sum to 100%');if(LPnum(s.payoff.credit)<=0)errors.push('Licence credit must be above 0%');if(LPnum(s.termYears,1,3)<1)errors.push('Term must be at least one year');return errors}
function LPcalculate(input,overrides){var s=LPstate(input),errors=LPvalidate(s),term=Math.round(LPnum(s.termYears,1,3)),months=term*12,fees=s.annualFees.slice(0,term).map(function(x){return LPnum(x,0)}),totalContract=fees.reduce(function(a,b){return a+b},0),upfrontRaw=s.upfrontMode==='percent'?fees[0]*LPnum(s.upfrontValue,0,100)/100:LPnum(s.upfrontValue,0),upfront=Math.min(fees[0]||0,upfrontRaw),payC=LPnum(s.payoff.customer,0,100)/100,payL=LPnum(s.payoff.lucra,0,100)/100,creditRate=LPnum(s.payoff.credit,0,100)/100,postC=LPnum(s.post.customer,0,100)/100,postL=LPnum(s.post.lucra,0,100)/100,growthRate=LPnum(s.growthRate,0,30)/100,growthMonths=Math.round(LPnum(s.growthMonths,0,months)),baseEngagement=overrides&&overrides.engagement!==undefined?LPnum(overrides.engagement,0,100):LPnum(s.engagement,0,100),priceMultiplier=overrides&&overrides.priceMultiplier!==undefined?LPnum(overrides.priceMultiplier,0):1,useAnnualBucket=s.postMode==='year',contractRemaining=Math.max(0,totalContract-upfront),yearRemaining=Math.max(0,(fees[0]||0)-upfront),carryBank=0,creditApplied=0,creditCapacity=0,totalCustomer=0,totalLucra=0,customerDuring=0,customerAfter=0,totalPrize=0,totalTrueUp=0,totalGross=0,totalMonthlyShortfall=0,largestShortfall=0,manualPlan=s.tournamentMode==='manual',requiredEngagementForPlan=null,planFeasible=true,yearOneClearMonth=null,fullClearMonth=null,cumulativeActivity=upfront,rows=[],trueUps=[],warnings=[],sponsorUnused=0;
 if(manualPlan&&s.tournamentsOn){var audiencePerEngagementPoint=LPnum(s.audience,0)*LPnum(s.rebuy,0)/100,maxEntriesPerEvent=(s.tournaments||[]).reduce(function(m,t){return Math.max(m,LPnum(t.entriesPerEvent,0))},0);requiredEngagementForPlan=audiencePerEngagementPoint>0?maxEntriesPerEvent/audiencePerEngagementPoint:(maxEntriesPerEvent>0?Infinity:0);planFeasible=requiredEngagementForPlan<=baseEngagement+1e-6}
 if(errors.length)return{errors:errors,months:[],trueUps:[],totalContract:totalContract};
 for(var month=1;month<=months;month++){var year=Math.ceil(month/12),monthInYear=((month-1)%12)+1;if(monthInYear===1&&month>1){yearRemaining=Math.max(0,(fees[year-1]||0)-carryBank);carryBank=Math.max(0,carryBank-(fees[year-1]||0))}
  var growth=Math.pow(1+growthRate,Math.min(month-1,growthMonths)),engaged=LPnum(s.audience,0)*growth*baseEngagement/100,eventEntryDemand=engaged*LPnum(s.rebuy,0),tournaments=s.tournaments||[],capacity=tournaments.reduce(function(a,t){return a+LPnum(t.entriesPerEvent,0)*LPnum(t.eventsPerMonth,0)},0),usedEntries=0,tournamentGross=0,prizeCost=0,tournamentDetail=[];
  if(s.tournamentsOn&&capacity>0)tournaments.forEach(function(t){var events=LPnum(t.eventsPerMonth,0),eventCapacity=LPnum(t.entriesPerEvent,0),entriesPerEvent=manualPlan?eventCapacity:Math.min(eventEntryDemand,eventCapacity),entries=entriesPerEvent*events,price=LPnum(t.entryPrice,0)*priceMultiplier,gross=entries*price,prize=LPnum(t.prizeCost,0)*events;usedEntries+=entries;tournamentGross+=gross;prizeCost+=prize;tournamentDetail.push({name:t.name||'Tournament',entries:entries,entriesPerEvent:entriesPerEvent,events:events,entryPrice:price,gross:gross,prizeCost:prize,prizePct:gross>0?prize/gross:null})});
  var h2hPlayers=s.h2hOn?LPnum(s.h2h.players,0)*growth:0,h2hHandle=h2hPlayers*LPnum(s.h2h.monthlyWager,0),h2hGross=h2hHandle*LPnum(s.h2h.rake,0,100)/100,miniAudience=s.miniOn?LPnum(s.mini.audience,0)*growth:0,miniEngaged=miniAudience*LPnum(s.mini.engagement,0,100)/100,miniHandle=miniEngaged*LPnum(s.mini.monthlySpend,0),miniGross=miniHandle*LPnum(s.mini.rake,0,100)/100,gross=tournamentGross+h2hGross+miniGross,sponsorAmount=s.sponsorOn?(s.sponsors||[]).reduce(function(a,x){return a+(Math.round(LPnum(x.month,1,months))===month?LPnum(x.amount,0):0)},0):0,eligible=useAnnualBucket?yearRemaining:contractRemaining,sponsorApplied=Math.min(eligible,sponsorAmount),sponsorExtra=Math.max(0,sponsorAmount-sponsorApplied);if(s.carryForward&&useAnnualBucket)carryBank+=sponsorExtra;else sponsorUnused+=sponsorExtra;eligible-=sponsorApplied;contractRemaining=Math.max(0,contractRemaining-sponsorApplied);if(useAnnualBucket)yearRemaining=Math.max(0,yearRemaining-sponsorApplied);
  var payoffGross=creditRate>0?Math.min(gross,eligible/creditRate):0,postGross=Math.max(0,gross-payoffGross),grossCredit=Math.min(eligible,payoffGross*creditRate),customerShare=payoffGross*payC+postGross*postC,lucraShare=payoffGross*payL+postGross*postL,payoffFraction=gross>0?payoffGross/gross:0,payoffTournamentGross=tournamentGross*payoffFraction,payoffPrizeCost=prizeCost*payoffFraction,payoffTournamentCustomer=payoffTournamentGross*payC,customerNet=customerShare-prizeCost,shortfall=Math.max(0,-customerNet),split=payoffGross>0&&postGross>0?'Crossover':payoffGross>0?'Payoff':'Post-payoff';contractRemaining=Math.max(0,contractRemaining-grossCredit);if(useAnnualBucket)yearRemaining=Math.max(0,yearRemaining-grossCredit);creditApplied+=sponsorApplied+grossCredit;cumulativeActivity+=sponsorApplied+grossCredit;creditCapacity+=sponsorAmount+gross*creditRate;totalGross+=gross;totalCustomer+=customerShare;totalLucra+=lucraShare;customerDuring+=payoffGross*payC;customerAfter+=postGross*postC;totalPrize+=prizeCost;totalMonthlyShortfall+=shortfall;largestShortfall=Math.max(largestShortfall,shortfall);
  if(yearOneClearMonth===null&&month<=12&&cumulativeActivity+1e-6>=(fees[0]||0))yearOneClearMonth=month;if(fullClearMonth===null&&cumulativeActivity+1e-6>=totalContract)fullClearMonth=month;
  var trueUp=0;if(monthInYear===12){if(useAnnualBucket)trueUp=yearRemaining;else{var dueToDate=fees.slice(0,year).reduce(function(a,b){return a+b},0),paidToDate=totalContract-contractRemaining;trueUp=Math.max(0,dueToDate-paidToDate)}if(trueUp>0){contractRemaining=Math.max(0,contractRemaining-trueUp);if(useAnnualBucket)yearRemaining=0;totalTrueUp+=trueUp}trueUps.push({year:year,amount:trueUp})}
  var cashNegative=payoffGross>0&&payoffPrizeCost>payoffTournamentCustomer+0.01;if(cashNegative)warnings.push('Month '+month+': payoff-phase prize board cost exceeds the customer payoff-phase tournament share.');rows.push({month:month,year:year,monthInYear:monthInYear,growth:growth,engaged:engaged,tournamentEntries:usedEntries,tournamentGross:tournamentGross,h2hHandle:h2hHandle,h2hGross:h2hGross,miniHandle:miniHandle,miniGross:miniGross,gross:gross,payoffGross:payoffGross,postGross:postGross,licenceCredit:sponsorApplied+grossCredit,cumulativeCredit:creditApplied,balanceRemaining:contractRemaining,payoffBalanceRemaining:useAnnualBucket?yearRemaining:contractRemaining,customerShare:customerShare,prizeCost:prizeCost,prizePct:tournamentGross>0?prizeCost/tournamentGross:null,customerNet:customerNet,lucraShare:lucraShare,trueUp:trueUp,split:split,cashNegative:cashNegative,tournaments:tournamentDetail})}
 var structureNet=totalCustomer-totalPrize-upfront-totalTrueUp,cashUpfrontNet=rows.reduce(function(a,r){return a+r.gross*postC-r.prizeCost},0)-totalContract,toggledOff=[];if(!s.tournamentsOn)toggledOff.push('tournaments');if(!s.h2hOn)toggledOff.push('head-to-head');if(!s.miniOn)toggledOff.push('mini games');if(!s.sponsorOn)toggledOff.push('sponsorship');if(LPnum(s.growthRate,0)===0)toggledOff.push('growth');return{errors:[],state:s,totalContract:totalContract,upfront:upfront,months:rows,trueUps:trueUps,totalTrueUp:totalTrueUp,creditApplied:creditApplied,creditCapacity:creditCapacity,coverage:totalContract>0?creditCapacity/totalContract:null,balanceRemaining:contractRemaining,yearOneClearMonth:yearOneClearMonth,fullClearMonth:fullClearMonth,totalGross:totalGross,totalCustomer:totalCustomer,customerDuring:customerDuring,customerAfter:customerAfter,totalLucra:totalLucra,totalPrize:totalPrize,largestMonthlyShortfall:largestShortfall,totalMonthlyShortfall:totalMonthlyShortfall,cashOutOfPocket:upfront+totalTrueUp+totalPrize,planFeasible:planFeasible,requiredEngagementForPlan:requiredEngagementForPlan,structureNet:structureNet,cashUpfrontNet:cashUpfrontNet,comparisonDelta:structureNet-cashUpfrontNet,toggledOff:toggledOff,warnings:warnings,sponsorUnused:sponsorUnused,growthRateApplied:growthRate};}
function LPbreakEvenMap(input){var s=LPstate(input),baseline=LPcalculate(s),monthOne=baseline.months[0]||{},monthlyCapacity=(s.tournaments||[]).reduce(function(a,t){return a+LPnum(t.entriesPerEvent,0)*LPnum(t.eventsPerMonth,0)},0),eventCount=(s.tournaments||[]).reduce(function(a,t){return a+LPnum(t.eventsPerMonth,0)},0),primary=(s.tournaments&&s.tournaments[0])?LPnum(s.tournaments[0].entryPrice,0):10,prices=[.5,.75,1,1.25,1.5].map(function(f){return Math.max(1,Math.round(primary*f*100)/100)}),engagements=[5,10,15,20,25],columns=prices.map(function(price){var multiplier=primary>0?price/primary:1,lo=0,hi=100,reachable=false;for(var i=0;i<20;i++){var mid=(lo+hi)/2,r=LPcalculate(s,{engagement:mid,priceMultiplier:multiplier}),clears=r.fullClearMonth!==null&&r.totalTrueUp<.01&&r.planFeasible;if(clears){reachable=true;hi=mid}else lo=mid}return{price:price,required:reachable?Math.ceil((hi-0.0002)*10)/10:null,cells:engagements.map(function(e){var r=LPcalculate(s,{engagement:e,priceMultiplier:multiplier}),clears=r.fullClearMonth!==null&&r.totalTrueUp<.01&&r.planFeasible,comfortable=clears&&r.coverage!==null&&r.coverage>=1.2;return{engagement:e,status:comfortable?'comfortable':clears?'tight':'miss',coverage:r.coverage,fullClearMonth:r.fullClearMonth,trueUp:r.totalTrueUp}})}});return{prices:prices,engagements:engagements,columns:columns,monthlyCapacity:monthlyCapacity,eventCount:eventCount,modeledEntries:LPnum(monthOne.tournamentEntries,0),mode:s.tournamentMode}}

function LPtournamentMonthly(input){var s=LPstate(input),result=LPcalculate(s),month=result.months[0]||{},payC=LPnum(s.payoff.customer,0,100)/100,payL=LPnum(s.payoff.lucra,0,100)/100,payCredit=LPnum(s.payoff.credit,0,100)/100,rows=(month.tournaments||[]).map(function(t){var gross=LPnum(t.gross,0),prize=LPnum(t.prizeCost,0),customerGross=gross*payC;return{name:t.name,entries:LPnum(t.entries,0),entriesPerEvent:LPnum(t.entriesPerEvent,0),events:LPnum(t.events,0),entryPrice:LPnum(t.entryPrice,0),gross:gross,licenceCredit:gross*payCredit,lucraRevenue:gross*payL,customerGross:customerGross,prizeCost:prize,customerNet:customerGross-prize}}),totals=rows.reduce(function(a,r){a.gross+=r.gross;a.licenceCredit+=r.licenceCredit;a.lucraRevenue+=r.lucraRevenue;a.customerGross+=r.customerGross;a.prizeCost+=r.prizeCost;a.customerNet+=r.customerNet;return a},{gross:0,licenceCredit:0,lucraRevenue:0,customerGross:0,prizeCost:0,customerNet:0}),monthlyLicence=LPnum(s.annualFees[0],0)/12,licenceGap=Math.max(0,monthlyLicence-totals.licenceCredit),customerShareNeeded=Math.min(Math.max(0,totals.customerNet),licenceGap),remainingGap=Math.max(0,licenceGap-Math.max(0,totals.customerNet));return{rows:rows,totals:totals,monthlyLicence:monthlyLicence,licenceCreditCovers:totals.licenceCredit+0.01>=monthlyLicence,licenceGap:licenceGap,customerShareNeeded:customerShareNeeded,remainingGap:remainingGap,customerNetAfterGap:totals.customerNet-licenceGap,customerNetVsFullLicence:totals.customerNet-monthlyLicence}}

function LPyearlySummary(input){var s=LPstate(input),r=LPcalculate(s),postC=LPnum(s.post.customer,0,100)/100,years=[];for(var year=1;year<=Math.round(LPnum(s.termYears,1,3));year++){var rows=r.months.filter(function(x){return x.year===year}),trueUp=(r.trueUps[year-1]||{}).amount||0,customerNet=rows.reduce(function(a,x){return a+LPnum(x.customerNet,0)},0),clearRow=s.postMode==='year'?rows.find(function(x){return x.payoffBalanceRemaining<=.01&&x.trueUp<.01}):null;years.push({year:year,fee:LPnum(s.annualFees[year-1],0),activityCredit:rows.reduce(function(a,x){return a+LPnum(x.licenceCredit,0)},0),customerNet:customerNet,customerNetAfterTrueUp:customerNet-trueUp,customerShare:rows.reduce(function(a,x){return a+LPnum(x.customerShare,0)},0),postPayoffCustomer:rows.reduce(function(a,x){return a+LPnum(x.postGross,0)*postC},0),prizeCost:rows.reduce(function(a,x){return a+LPnum(x.prizeCost,0)},0),lucraRevenue:rows.reduce(function(a,x){return a+LPnum(x.lucraShare,0)},0),trueUp:trueUp,clearMonth:clearRow?clearRow.month:null,monthsAtHigherSplit:rows.filter(function(x){return LPnum(x.postGross,0)>0}).length})}return{mode:s.postMode,years:years,result:r}}

function LPrecommendPlan(input){var s=LPstate(input),supported=LPnum(s.audience,0)*LPnum(s.engagement,0,100)/100*LPnum(s.rebuy,0),maxEntries=Math.max(0,Math.floor(supported)),tournaments=s.tournaments||[],prices=[5,10,15,20,25,50];if(!s.tournamentsOn||!tournaments.length)return{error:'Add at least one tournament before generating a plan.'};if(maxEntries<1)return{error:'Audience, engagement, and entries per player must support at least one entry per event.'};function candidate(price,entries){var c=LPstate(s);c.tournamentMode='audience';c.tournaments=tournaments.map(function(t){return Object.assign({},t,{entryPrice:price,entriesPerEvent:entries})});var r=LPcalculate(c);return{valid:r.fullClearMonth!==null&&r.totalTrueUp<.01&&r.totalMonthlyShortfall<.01,result:r}}var best=null;for(var p=0;p<prices.length&&!best;p++){var top=candidate(prices[p],maxEntries);if(!top.valid)continue;var lo=1,hi=maxEntries;while(lo<hi){var mid=Math.floor((lo+hi)/2);if(candidate(prices[p],mid).valid)hi=mid;else lo=mid+1}best={price:prices[p],entriesPerEvent:lo,result:candidate(prices[p],lo).result}}if(!best&&candidate(500,maxEntries).valid){var lowPrice=50,highPrice=500;for(var i=0;i<18;i++){var midPrice=(lowPrice+highPrice)/2;if(candidate(midPrice,maxEntries).valid)highPrice=midPrice;else lowPrice=midPrice}var roundedPrice=Math.ceil(highPrice*2)/2;best={price:roundedPrice,entriesPerEvent:maxEntries,result:candidate(roundedPrice,maxEntries).result}}if(!best)return{error:'No cash-safe plan clears within the supported audience at entry prices up to $500. Increase audience, cadence, or customer payoff share; lower prize boards or fees; or add sponsor credit.',supportedEntriesPerEvent:maxEntries};return{error:null,price:best.price,entriesPerEvent:best.entriesPerEvent,supportedEntriesPerEvent:maxEntries,eventCount:tournaments.reduce(function(a,t){return a+LPnum(t.eventsPerMonth,0)},0),result:best.result}}
module.exports = { C, MGcalc, tmCompute, gmCompute, FTPcalc, FTPmatrix, FTPramp, FTP_DEFAULTS, BQcalc, BQ_DEFAULTS, DMcalc, DM_DEFAULTS, LPcalculate, LPbreakEvenMap, LPtournamentMonthly, LPyearlySummary, LPrecommendPlan, LPvalidate, LP_DEFAULTS };

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

var LP_DEFAULTS={customerName:'',termYears:2,annualFees:[12000,48000,48000],upfrontMode:'amount',upfrontValue:0,carryForward:true,payoff:{customer:40,lucra:10,credit:50},post:{customer:90,lucra:10},postMode:'term',audience:5000,engagement:10,rebuy:1.15,growthRate:0,growthMonths:6,tournamentMode:'audience',planCount:2,planCadence:4,tournamentsOn:true,tournaments:[{id:'open',name:'Open play',entryPrice:5,entriesPerEvent:200,eventsPerMonth:4,prizeFaceValue:500,prizeCost:500,sponsorFunding:0},{id:'headline',name:'Headline event',entryPrice:20,entriesPerEvent:50,eventsPerMonth:1,prizeFaceValue:750,prizeCost:750,sponsorFunding:0}],h2hOn:false,h2h:{players:500,monthlyWager:20,rake:20},miniOn:false,mini:{audience:10000,engagement:10,monthlySpend:5,rake:20},sponsorOn:false,sponsors:[{id:'launch',name:'Launch sponsor',amount:0,month:1}]};
function LPnum(v,lo,hi){v=Number(v);if(!isFinite(v))v=0;if(lo!==undefined)v=Math.max(lo,v);if(hi!==undefined)v=Math.min(hi,v);return v}
function LPclone(s){return JSON.parse(JSON.stringify(s))}
function LPstate(s){var out=LPclone(LP_DEFAULTS),src=s||{};Object.keys(src).forEach(function(k){out[k]=src[k]&&typeof src[k]==='object'&&!Array.isArray(src[k])?Object.assign({},out[k]||{},src[k]):src[k]});out.annualFees=(src.annualFees||out.annualFees).slice(0,3);out.tournaments=(src.tournaments||out.tournaments).map(function(x){return Object.assign({},x)});out.sponsors=(src.sponsors||out.sponsors).map(function(x){return Object.assign({},x)});return out}
function LPvalidate(s){s=LPstate(s);var errors=[],pay=LPnum(s.payoff.customer)+LPnum(s.payoff.lucra)+LPnum(s.payoff.credit),post=LPnum(s.post.customer)+LPnum(s.post.lucra);if(Math.abs(pay-100)>.001)errors.push('Payoff split must sum to 100%');if(Math.abs(post-100)>.001)errors.push('Post-payoff split must sum to 100%');if(LPnum(s.payoff.credit)<=0)errors.push('Licence credit must be above 0%');if(LPnum(s.termYears,1,3)<1)errors.push('Term must be at least one year');return errors}
function LPcalculate(input,overrides){var s=LPstate(input),errors=LPvalidate(s),term=Math.round(LPnum(s.termYears,1,3)),months=term*12,fees=s.annualFees.slice(0,term).map(function(x){return LPnum(x,0)}),totalContract=fees.reduce(function(a,b){return a+b},0),upfrontRaw=s.upfrontMode==='percent'?fees[0]*LPnum(s.upfrontValue,0,100)/100:LPnum(s.upfrontValue,0),upfront=Math.min(fees[0]||0,upfrontRaw),payC=LPnum(s.payoff.customer,0,100)/100,payL=LPnum(s.payoff.lucra,0,100)/100,creditRate=LPnum(s.payoff.credit,0,100)/100,postC=LPnum(s.post.customer,0,100)/100,postL=LPnum(s.post.lucra,0,100)/100,growthRate=LPnum(s.growthRate,0,30)/100,growthMonths=Math.round(LPnum(s.growthMonths,0,months)),baseEngagement=overrides&&overrides.engagement!==undefined?LPnum(overrides.engagement,0,100):LPnum(s.engagement,0,100),priceMultiplier=overrides&&overrides.priceMultiplier!==undefined?LPnum(overrides.priceMultiplier,0):1,useAnnualBucket=s.postMode==='year',contractRemaining=Math.max(0,totalContract-upfront),yearRemaining=Math.max(0,(fees[0]||0)-upfront),carryBank=0,creditApplied=0,creditCapacity=0,totalCustomer=0,totalLucra=0,customerDuring=0,customerAfter=0,totalPrize=0,totalTrueUp=0,totalGross=0,totalMonthlyShortfall=0,largestShortfall=0,manualPlan=s.tournamentMode==='manual',requiredEngagementForPlan=null,planFeasible=true,yearOneClearMonth=null,fullClearMonth=null,cumulativeActivity=upfront,rows=[],trueUps=[],warnings=[],sponsorUnused=0;
 if(manualPlan&&s.tournamentsOn){var audiencePerEngagementPoint=LPnum(s.audience,0)*LPnum(s.rebuy,0)/100,maxEntriesPerEvent=(s.tournaments||[]).reduce(function(m,t){return Math.max(m,LPnum(t.entriesPerEvent,0))},0);requiredEngagementForPlan=audiencePerEngagementPoint>0?maxEntriesPerEvent/audiencePerEngagementPoint:(maxEntriesPerEvent>0?Infinity:0);planFeasible=requiredEngagementForPlan<=baseEngagement+1e-6}
 if(errors.length)return{errors:errors,months:[],trueUps:[],totalContract:totalContract};
 for(var month=1;month<=months;month++){var year=Math.ceil(month/12),monthInYear=((month-1)%12)+1;if(monthInYear===1&&month>1){yearRemaining=Math.max(0,(fees[year-1]||0)-carryBank);carryBank=Math.max(0,carryBank-(fees[year-1]||0))}
  var growth=Math.pow(1+growthRate,Math.min(month-1,growthMonths)),engaged=LPnum(s.audience,0)*growth*baseEngagement/100,eventEntryDemand=engaged*LPnum(s.rebuy,0),tournaments=s.tournaments||[],capacity=tournaments.reduce(function(a,t){return a+LPnum(t.entriesPerEvent,0)*LPnum(t.eventsPerMonth,0)},0),usedEntries=0,tournamentGross=0,prizeCost=0,tournamentDetail=[];
  if(s.tournamentsOn&&capacity>0)tournaments.forEach(function(t){var events=LPnum(t.eventsPerMonth,0),eventCapacity=LPnum(t.entriesPerEvent,0),entriesPerEvent=manualPlan?eventCapacity:Math.min(eventEntryDemand,eventCapacity),entries=entriesPerEvent*events,price=LPnum(t.entryPrice,0)*priceMultiplier,gross=entries*price,face=LPnum(t.prizeFaceValue===undefined?t.prizeCost:t.prizeFaceValue,0)*events,prize=LPnum(t.prizeCost,0)*events,sponsor=LPnum(t.sponsorFunding,0)*events;usedEntries+=entries;tournamentGross+=gross;prizeCost+=prize;tournamentDetail.push({name:t.name||'Tournament',entries:entries,entriesPerEvent:entriesPerEvent,events:events,entryPrice:price,gross:gross,prizeFaceValue:face,prizeCost:prize,sponsorFunding:sponsor,prizePct:gross>0?prize/gross:null})});
  var h2hPlayers=s.h2hOn?LPnum(s.h2h.players,0)*growth:0,h2hHandle=h2hPlayers*LPnum(s.h2h.monthlyWager,0),h2hGross=h2hHandle*LPnum(s.h2h.rake,0,100)/100,miniAudience=s.miniOn?LPnum(s.mini.audience,0)*growth:0,miniEngaged=miniAudience*LPnum(s.mini.engagement,0,100)/100,miniHandle=miniEngaged*LPnum(s.mini.monthlySpend,0),miniGross=miniHandle*LPnum(s.mini.rake,0,100)/100,gross=tournamentGross+h2hGross+miniGross,sponsorAmount=s.sponsorOn?(s.sponsors||[]).reduce(function(a,x){return a+(Math.round(LPnum(x.month,1,months))===month?LPnum(x.amount,0):0)},0):0,eligible=useAnnualBucket?yearRemaining:contractRemaining,sponsorApplied=Math.min(eligible,sponsorAmount),sponsorExtra=Math.max(0,sponsorAmount-sponsorApplied);if(s.carryForward&&useAnnualBucket)carryBank+=sponsorExtra;else sponsorUnused+=sponsorExtra;eligible-=sponsorApplied;contractRemaining=Math.max(0,contractRemaining-sponsorApplied);if(useAnnualBucket)yearRemaining=Math.max(0,yearRemaining-sponsorApplied);
  var payoffGross=creditRate>0?Math.min(gross,eligible/creditRate):0,postGross=Math.max(0,gross-payoffGross),grossCredit=Math.min(eligible,payoffGross*creditRate),customerShare=payoffGross*payC+postGross*postC,lucraShare=payoffGross*payL+postGross*postL,payoffFraction=gross>0?payoffGross/gross:0,payoffTournamentGross=tournamentGross*payoffFraction,payoffPrizeCost=prizeCost*payoffFraction,payoffTournamentCustomer=payoffTournamentGross*payC,customerNet=customerShare-prizeCost,shortfall=Math.max(0,-customerNet),split=payoffGross>0&&postGross>0?'Crossover':payoffGross>0?'Payoff':'Post-payoff';contractRemaining=Math.max(0,contractRemaining-grossCredit);if(useAnnualBucket)yearRemaining=Math.max(0,yearRemaining-grossCredit);creditApplied+=sponsorApplied+grossCredit;cumulativeActivity+=sponsorApplied+grossCredit;creditCapacity+=sponsorAmount+gross*creditRate;totalGross+=gross;totalCustomer+=customerShare;totalLucra+=lucraShare;customerDuring+=payoffGross*payC;customerAfter+=postGross*postC;totalPrize+=prizeCost;totalMonthlyShortfall+=shortfall;largestShortfall=Math.max(largestShortfall,shortfall);
  if(yearOneClearMonth===null&&month<=12&&cumulativeActivity+1e-6>=(fees[0]||0))yearOneClearMonth=month;if(fullClearMonth===null&&cumulativeActivity+1e-6>=totalContract)fullClearMonth=month;
  var trueUp=0;if(monthInYear===12){if(useAnnualBucket)trueUp=yearRemaining;else{var dueToDate=fees.slice(0,year).reduce(function(a,b){return a+b},0),paidToDate=totalContract-contractRemaining;trueUp=Math.max(0,dueToDate-paidToDate)}if(trueUp>0){contractRemaining=Math.max(0,contractRemaining-trueUp);if(useAnnualBucket)yearRemaining=0;totalTrueUp+=trueUp}trueUps.push({year:year,amount:trueUp})}
  var cashNegative=payoffGross>0&&payoffPrizeCost>payoffTournamentCustomer+0.01;if(cashNegative)warnings.push('Month '+month+': payoff-phase prize board cost exceeds the customer payoff-phase tournament share.');rows.push({month:month,year:year,monthInYear:monthInYear,growth:growth,engaged:engaged,tournamentEntries:usedEntries,tournamentGross:tournamentGross,h2hHandle:h2hHandle,h2hGross:h2hGross,miniHandle:miniHandle,miniGross:miniGross,gross:gross,payoffGross:payoffGross,postGross:postGross,licenceCredit:sponsorApplied+grossCredit,cumulativeCredit:creditApplied,balanceRemaining:contractRemaining,payoffBalanceRemaining:useAnnualBucket?yearRemaining:contractRemaining,customerShare:customerShare,prizeCost:prizeCost,prizePct:tournamentGross>0?prizeCost/tournamentGross:null,customerNet:customerNet,lucraShare:lucraShare,trueUp:trueUp,split:split,cashNegative:cashNegative,tournaments:tournamentDetail})}
 var structureNet=totalCustomer-totalPrize-upfront-totalTrueUp,cashUpfrontNet=rows.reduce(function(a,r){return a+r.gross*postC-r.prizeCost},0)-totalContract,toggledOff=[];if(!s.tournamentsOn)toggledOff.push('tournaments');if(!s.h2hOn)toggledOff.push('head-to-head');if(!s.miniOn)toggledOff.push('mini games');if(!s.sponsorOn)toggledOff.push('sponsorship');if(LPnum(s.growthRate,0)===0)toggledOff.push('growth');return{errors:[],state:s,totalContract:totalContract,upfront:upfront,months:rows,trueUps:trueUps,totalTrueUp:totalTrueUp,creditApplied:creditApplied,creditCapacity:creditCapacity,coverage:totalContract>0?creditCapacity/totalContract:null,balanceRemaining:contractRemaining,yearOneClearMonth:yearOneClearMonth,fullClearMonth:fullClearMonth,totalGross:totalGross,totalCustomer:totalCustomer,customerDuring:customerDuring,customerAfter:customerAfter,totalLucra:totalLucra,totalPrize:totalPrize,largestMonthlyShortfall:largestShortfall,totalMonthlyShortfall:totalMonthlyShortfall,cashOutOfPocket:upfront+totalTrueUp+totalPrize,planFeasible:planFeasible,requiredEngagementForPlan:requiredEngagementForPlan,structureNet:structureNet,cashUpfrontNet:cashUpfrontNet,comparisonDelta:structureNet-cashUpfrontNet,toggledOff:toggledOff,warnings:warnings,sponsorUnused:sponsorUnused,growthRateApplied:growthRate};}
function LPbreakEvenMap(input){var s=LPstate(input),baseline=LPcalculate(s),monthOne=baseline.months[0]||{},monthlyCapacity=(s.tournaments||[]).reduce(function(a,t){return a+LPnum(t.entriesPerEvent,0)*LPnum(t.eventsPerMonth,0)},0),eventCount=(s.tournaments||[]).reduce(function(a,t){return a+LPnum(t.eventsPerMonth,0)},0),primary=(s.tournaments&&s.tournaments[0])?LPnum(s.tournaments[0].entryPrice,0):10,prices=[.5,.75,1,1.25,1.5].map(function(f){return Math.max(1,Math.round(primary*f*100)/100)}),engagements=[5,10,15,20,25],columns=prices.map(function(price){var multiplier=primary>0?price/primary:1,lo=0,hi=100,reachable=false;for(var i=0;i<20;i++){var mid=(lo+hi)/2,r=LPcalculate(s,{engagement:mid,priceMultiplier:multiplier}),clears=r.fullClearMonth!==null&&r.totalTrueUp<.01&&r.planFeasible;if(clears){reachable=true;hi=mid}else lo=mid}return{price:price,required:reachable?Math.ceil((hi-0.0002)*10)/10:null,cells:engagements.map(function(e){var r=LPcalculate(s,{engagement:e,priceMultiplier:multiplier}),economicsClear=r.fullClearMonth!==null&&r.totalTrueUp<.01,feasible=r.planFeasible,comfortable=economicsClear&&feasible&&r.coverage!==null&&r.coverage>=1.2,status=economicsClear?(feasible?(comfortable?'comfortable':'tight'):'capacity'):'miss';return{engagement:e,status:status,economicsClear:economicsClear,feasible:feasible,coverage:r.coverage,fullClearMonth:r.fullClearMonth,trueUp:r.totalTrueUp}})}}),recommendation=LPrecommendPlan(s);return{prices:prices,engagements:engagements,columns:columns,monthlyCapacity:monthlyCapacity,eventCount:eventCount,modeledEntries:LPnum(monthOne.tournamentEntries,0),mode:s.tournamentMode,recommendation:recommendation}}

function LPtournamentMonthly(input){var s=LPstate(input),result=LPcalculate(s),month=result.months[0]||{},payC=LPnum(s.payoff.customer,0,100)/100,payL=LPnum(s.payoff.lucra,0,100)/100,payCredit=LPnum(s.payoff.credit,0,100)/100,rows=(month.tournaments||[]).map(function(t){var gross=LPnum(t.gross,0),prize=LPnum(t.prizeCost,0),customerGross=gross*payC;return{name:t.name,entries:LPnum(t.entries,0),entriesPerEvent:LPnum(t.entriesPerEvent,0),events:LPnum(t.events,0),entryPrice:LPnum(t.entryPrice,0),gross:gross,licenceCredit:gross*payCredit,lucraRevenue:gross*payL,customerGross:customerGross,prizeFaceValue:LPnum(t.prizeFaceValue,0),prizeCost:prize,sponsorFunding:LPnum(t.sponsorFunding,0),customerNet:customerGross-prize}}),totals=rows.reduce(function(a,r){a.gross+=r.gross;a.licenceCredit+=r.licenceCredit;a.lucraRevenue+=r.lucraRevenue;a.customerGross+=r.customerGross;a.prizeFaceValue+=r.prizeFaceValue;a.prizeCost+=r.prizeCost;a.sponsorFunding+=r.sponsorFunding;a.customerNet+=r.customerNet;return a},{gross:0,licenceCredit:0,lucraRevenue:0,customerGross:0,prizeFaceValue:0,prizeCost:0,sponsorFunding:0,customerNet:0}),annualObligations=s.annualFees.slice(0,Math.round(LPnum(s.termYears,1,3))).map(function(fee,i){var monthlyLicence=LPnum(fee,0)/12,licenceGap=Math.max(0,monthlyLicence-totals.licenceCredit),customerShareNeeded=Math.min(Math.max(0,totals.customerNet),licenceGap),remainingGap=Math.max(0,licenceGap-Math.max(0,totals.customerNet));return{year:i+1,fee:LPnum(fee,0),monthlyLicence:monthlyLicence,licenceCreditCovers:totals.licenceCredit+0.01>=monthlyLicence,licenceGap:licenceGap,customerShareNeeded:customerShareNeeded,remainingGap:remainingGap,customerNetAfterGap:totals.customerNet-licenceGap,customerNetVsFullLicence:totals.customerNet-monthlyLicence}}),first=annualObligations[0]||{monthlyLicence:0,licenceCreditCovers:true,licenceGap:0,customerShareNeeded:0,remainingGap:0,customerNetAfterGap:totals.customerNet,customerNetVsFullLicence:totals.customerNet};return{rows:rows,totals:totals,annualObligations:annualObligations,monthlyLicence:first.monthlyLicence,licenceCreditCovers:first.licenceCreditCovers,licenceGap:first.licenceGap,customerShareNeeded:first.customerShareNeeded,remainingGap:first.remainingGap,customerNetAfterGap:first.customerNetAfterGap,customerNetVsFullLicence:first.customerNetVsFullLicence}}

function LPyearlySummary(input){var s=LPstate(input),r=LPcalculate(s),postC=LPnum(s.post.customer,0,100)/100,years=[];for(var year=1;year<=Math.round(LPnum(s.termYears,1,3));year++){var rows=r.months.filter(function(x){return x.year===year}),trueUp=(r.trueUps[year-1]||{}).amount||0,customerNet=rows.reduce(function(a,x){return a+LPnum(x.customerNet,0)},0),clearRow=s.postMode==='year'?rows.find(function(x){return x.payoffBalanceRemaining<=.01&&x.trueUp<.01}):null;years.push({year:year,fee:LPnum(s.annualFees[year-1],0),activityCredit:rows.reduce(function(a,x){return a+LPnum(x.licenceCredit,0)},0),customerNet:customerNet,customerNetAfterTrueUp:customerNet-trueUp,customerShare:rows.reduce(function(a,x){return a+LPnum(x.customerShare,0)},0),postPayoffCustomer:rows.reduce(function(a,x){return a+LPnum(x.postGross,0)*postC},0),prizeCost:rows.reduce(function(a,x){return a+LPnum(x.prizeCost,0)},0),lucraRevenue:rows.reduce(function(a,x){return a+LPnum(x.lucraShare,0)},0),trueUp:trueUp,clearMonth:clearRow?clearRow.month:null,monthsAtHigherSplit:rows.filter(function(x){return LPnum(x.postGross,0)>0}).length})}return{mode:s.postMode,years:years,result:r}}

function LPrecommendPlan(input){var s=LPstate(input),supported=LPnum(s.audience,0)*LPnum(s.engagement,0,100)/100*LPnum(s.rebuy,0),maxEntries=Math.max(0,Math.floor(supported)),tournaments=s.tournaments||[],prices=[5,10,15,20,25,50];if(!s.tournamentsOn||!tournaments.length)return{error:'Add at least one tournament before generating a plan.'};if(maxEntries<1)return{error:'Audience, engagement, and entries per player must support at least one entry per event.'};function candidate(price,entries){var c=LPstate(s);c.tournamentMode='audience';c.tournaments=tournaments.map(function(t){return Object.assign({},t,{entryPrice:price,entriesPerEvent:entries})});var r=LPcalculate(c);return{valid:r.fullClearMonth!==null&&r.totalTrueUp<.01&&r.totalMonthlyShortfall<.01,result:r}}var best=null;for(var p=0;p<prices.length&&!best;p++){var top=candidate(prices[p],maxEntries);if(!top.valid)continue;var lo=1,hi=maxEntries;while(lo<hi){var mid=Math.floor((lo+hi)/2);if(candidate(prices[p],mid).valid)hi=mid;else lo=mid+1}best={price:prices[p],entriesPerEvent:lo,result:candidate(prices[p],lo).result}}if(!best&&candidate(500,maxEntries).valid){var lowPrice=50,highPrice=500;for(var i=0;i<18;i++){var midPrice=(lowPrice+highPrice)/2;if(candidate(midPrice,maxEntries).valid)highPrice=midPrice;else lowPrice=midPrice}var roundedPrice=Math.ceil(highPrice*2)/2;best={price:roundedPrice,entriesPerEvent:maxEntries,result:candidate(roundedPrice,maxEntries).result}}if(!best)return{error:'No cash-safe plan clears within the supported audience at entry prices up to $500. Increase audience, cadence, or customer payoff share; lower prize boards or fees; or add sponsor credit.',supportedEntriesPerEvent:maxEntries};return{error:null,price:best.price,entriesPerEvent:best.entriesPerEvent,supportedEntriesPerEvent:maxEntries,eventCount:tournaments.reduce(function(a,t){return a+LPnum(t.eventsPerMonth,0)},0),result:best.result}}

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
  includeTournaments: true,
  includeH2H: false,
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
  if (!s.includeTournaments && !s.includeH2H) errors.push('Select at least one product: tournaments, head-to-head, or both.');
  if (!s.includeTournaments) return errors;
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
          ? '$' + Math.round(TPnum(t.cashPrizeAmount, 0)).toLocaleString() + ' prize pool'
          : '$' + Math.round(TPnum(t.rewardFaceValue, 0)).toLocaleString() + ' value reward'
      };
    })
  };
}

/* ---------- break-even heat map ----------
   Entry price across the top, participation down the side. Each cell re-runs
   the whole model at that pair and reports the month the licence retires, or
   how far it got if it never does. Shading encodes the month, not a judgement,
   so no comfort threshold is invented. */
function TPheatMap(input) {
  var s = TPstate(input), basisMau = s.participantBasis === 'mau',
    factors = [0.5, 0.75, 1, 1.25, 1.5],
    baseParticipation = basisMau
      ? (s.volumeMode === 'ramp' ? TPnum(s.rampPlateauPct, 0) : TPnum(s.participantPct, 0))
      : (s.volumeMode === 'ramp' ? TPnum(s.rampPlateau, 0) : TPnum(s.participants, 0)),
    primaryPrice = (s.tournaments && s.tournaments[0]) ? TPnum(s.tournaments[0].entryPrice, 0) : 0,
    totalMonths = TPterm(s) * 12;

  var prices = factors.map(function (f) { return Math.round(primaryPrice * f * 100) / 100; }),
    rows = factors.map(function (f) { return Math.round(baseParticipation * f * 1000) / 1000; });

  var cells = rows.map(function (participation, ri) {
    return prices.map(function (price, ci) {
      var c = TPscaled(s, factors[ri], factors[ci]), r = TPcalculate(c);
      if (r.errors.length) return { status: 'error', month: null, retired: 0 };
      var retired = r.totalContract > 0 ? r.cumulativeLicense / r.totalContract : 1;
      return {
        status: r.payoffMonth === null ? 'miss' : 'clear',
        month: r.payoffMonth,
        retired: retired,
        share: r.payoffMonth === null ? null : r.payoffMonth / totalMonths
      };
    });
  });

  return {
    basisMau: basisMau, prices: prices, participation: rows, cells: cells,
    totalMonths: totalMonths, baseParticipation: baseParticipation, primaryPrice: primaryPrice
  };
}

/* A copy of the state with participation and entry prices scaled. Used by the
   heat map and by the combined three-case band, so both scale identically. */
function TPscaled(input, participationFactor, priceFactor) {
  var s = TPstate(input), p = TPnum(participationFactor, 0), q = priceFactor === undefined ? 1 : TPnum(priceFactor, 0);
  s.participants = TPnum(s.participants, 0) * p;
  s.participantPct = TPnum(s.participantPct, 0) * p;
  s.rampStart = TPnum(s.rampStart, 0) * p;
  s.rampPlateau = TPnum(s.rampPlateau, 0) * p;
  s.rampStartPct = TPnum(s.rampStartPct, 0) * p;
  s.rampPlateauPct = TPnum(s.rampPlateauPct, 0) * p;
  s.tournaments = s.tournaments.map(function (t) {
    var c = Object.assign({}, t);
    c.participantsCustom = TPnum(c.participantsCustom, 0) * p;
    c.participantPctCustom = TPnum(c.participantPctCustom, 0) * p;
    c.entryPrice = TPnum(c.entryPrice, 0) * q;
    return c;
  });
  return s;
}

/* ---------- combined revenue model ----------
   One monthly active user base feeds both products. Head-to-head takes an
   engagement share of it; tournaments take either their own share of it or an
   entered participant count. Revenue generated is reported as the pool each
   product produces before any split, which is what a partner-facing page shows.

   The two audiences are not netted against each other, because a player taking
   part in both generates two separate transactions rather than one counted
   twice. What is reported instead is the combined engaged share of the base, so
   an implausible total is visible rather than buried. */
function TPCcase(cfg, factor) {
  var f = factor === undefined ? 1 : TPnum(factor, 0),
    tState0 = TPstate(cfg.tournament),
    onH2H = !!tState0.includeH2H,
    onTournaments = !!tState0.includeTournaments,
    mau = TPnum(cfg.mau, 0),
    engagement = onH2H ? TPnum(cfg.engagement, 0, 100) * f : 0,
    engaged = mau * Math.min(100, engagement) / 100,
    paidPlays = engaged * TPnum(cfg.playsPerUser, 0),
    paidVolume = paidPlays * TPnum(cfg.spendPerPlay, 0),
    p2pFee = paidVolume * TPnum(cfg.feeRate, 0, 100) / 100;

  var tState = TPscaled(Object.assign(tState0, { mau: mau }), f, 1),
    tResult = TPcalculate(tState),
    months = tResult.months.length || 12,
    usable = onTournaments && !tResult.errors.length,
    tournamentMonthly = usable ? tResult.totalNet / months : 0,
    tournamentParticipants = usable ? (tResult.months[months - 1] || {}).participants || 0 : 0;

  var tournamentShare = mau > 0 ? tournamentParticipants / mau * 100 : 0;

  return {
    factor: f,
    includeH2H: onH2H,
    includeTournaments: onTournaments,
    mau: mau,
    engagement: Math.min(100, engagement),
    engaged: engaged,
    paidVolume: paidVolume,
    p2pFee: p2pFee,
    tournamentParticipants: tournamentParticipants,
    tournamentShare: tournamentShare,
    tournamentNet: tournamentMonthly,
    revenueGenerated: p2pFee + tournamentMonthly,
    annualRevenueGenerated: (p2pFee + tournamentMonthly) * 12,
    combinedShare: Math.min(100, engagement) + tournamentShare,
    tournamentResult: tResult
  };
}

/* Three cases at half, as entered, and one and a half times the entered
   participation. The multipliers scale the user's own assumptions rather than
   any Lucra benchmark, and the low case is always present. */
function TPCcases(cfg) {
  return [
    { key: 'conservative', label: 'Conservative', note: 'Half the entered participation', result: TPCcase(cfg, 0.5) },
    { key: 'expected', label: 'Expected', note: 'Participation as entered', result: TPCcase(cfg, 1) },
    { key: 'best', label: 'Best case', note: '1.5x the entered participation', result: TPCcase(cfg, 1.5) }
  ];
}
/* TP-PURE-END */

module.exports = { C, MGcalc, tmCompute, gmCompute, FTPcalc, FTPmatrix, FTPramp, FTP_DEFAULTS, BQcalc, BQ_DEFAULTS, DMcalc, DM_DEFAULTS, LPcalculate, LPbreakEvenMap, LPtournamentMonthly, LPyearlySummary, LPrecommendPlan, LPvalidate, LP_DEFAULTS, TPnum, TPstate, TPsplitRates, TPparticipants, TPvalidate, TPcalculate, TPcustomerProjection, TPterm, TPfees, TPrampValue, TPrampFactor, TPtypeParticipants, TPentriesPerEvent, TPheatMap, TPscaled, TPCcase, TPCcases, TP_DEFAULTS, TP_SPLITS, TP_MAX_YEARS };

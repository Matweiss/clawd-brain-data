const fetch = require('node-fetch');

const HUBSPOT_TOKEN = 'pat-na1-a249996e-eb7d-4184-841f-2759d28a8323';
const MAT_OWNER_ID = '728033696';

async function fetchDeals() {
  const url = 'https://api.hubapi.com/crm/v3/objects/deals/search';
  const body = {
    filterGroups: [{
      filters: [
        { propertyName: 'hubspot_owner_id', operator: 'EQ', value: MAT_OWNER_ID },
        { propertyName: 'dealstage', operator: 'NEQ', value: 'closedwon' },
        { propertyName: 'dealstage', operator: 'NEQ', value: 'closedlost' }
      ]
    }],
    properties: [
      'dealname', 'dealstage', 'amount', 'closedate',
      'hs_lastmodifieddate', 'hs_last_activity_date',
      'hs_object_id'
    ],
    limit: 100
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  const data = await response.json();
  
  console.log(`Total open deals: ${data.results.length}\n`);
  
  // Group by stage
  const byStage = {};
  data.results.forEach(deal => {
    const stage = deal.properties.dealstage || 'unknown';
    if (!byStage[stage]) byStage[stage] = [];
    byStage[stage].push(deal);
  });
  
  Object.keys(byStage).sort().forEach(stage => {
    const deals = byStage[stage];
    const total = deals.reduce((sum, d) => sum + parseFloat(d.properties.amount || 0), 0);
    console.log(`${stage}: ${deals.length} deals ($${total.toLocaleString()})`);
  });
  
  console.log('\nSample deals with last activity:');
  data.results.slice(0, 10).forEach(deal => {
    const lastAct = deal.properties.hs_last_activity_date || deal.properties.hs_lastmodifieddate || 'N/A';
    console.log(`\n- ${deal.properties.dealname}`);
    console.log(`  Stage: ${deal.properties.dealstage}`);
    console.log(`  Amount: $${deal.properties.amount || 0}`);
    console.log(`  Last activity: ${lastAct}`);
  });
}

fetchDeals().catch(console.error);

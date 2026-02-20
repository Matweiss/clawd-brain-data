const fetch = require('node-fetch');

const HUBSPOT_TOKEN = 'pat-na1-a249996e-eb7d-4184-841f-2759d28a8323';

async function fetchDeals() {
  const url = 'https://api.hubapi.com/crm/v3/objects/deals/search';
  const body = {
    "filterGroups": [
      {
        "filters": [
          { "propertyName": "hubspot_owner_id", "operator": "EQ", "value": "728033696" },
          { "propertyName": "dealstage", "operator": "EQ", "value": "c9e227ad-c38d-4922-9501-fc2053229be9" }
        ]
      },
      {
        "filters": [
          { "propertyName": "hubspot_owner_id", "operator": "EQ", "value": "728033696" },
          { "propertyName": "dealstage", "operator": "EQ", "value": "997831554" }
        ]
      },
      {
        "filters": [
          { "propertyName": "hubspot_owner_id", "operator": "EQ", "value": "728033696" },
          { "propertyName": "dealstage", "operator": "EQ", "value": "eb3b0309-9555-4de9-bdec-b653a0a1efeb" }
        ]
      },
      {
        "filters": [
          { "propertyName": "hubspot_owner_id", "operator": "EQ", "value": "728033696" },
          { "propertyName": "dealstage", "operator": "EQ", "value": "94890f5c-dbc4-4c28-865c-fc032a485684" }
        ]
      },
      {
        "filters": [
          { "propertyName": "hubspot_owner_id", "operator": "EQ", "value": "728033696" },
          { "propertyName": "dealstage", "operator": "EQ", "value": "17b10f58-1abb-447b-a8bc-c7965662690d" }
        ]
      }
    ],
    "properties": [
      "dealname", "dealstage", "amount", "closedate", 
      "notes_last_updated", "hs_lastmodifieddate",
      "hs_last_activity_date", "hs_object_id"
    ],
    "limit": 100
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
  
  console.log(`\nTotal deals (with your filter): ${data.results.length}`);
  
  // Stage mapping (we'll need to figure out what these stages are)
  const stageIds = {
    'c9e227ad-c38d-4922-9501-fc2053229be9': 'Stage 1',
    '997831554': 'Stage 2',
    'eb3b0309-9555-4de9-bdec-b653a0a1efeb': 'Stage 3',
    '94890f5c-dbc4-4c28-865c-fc032a485684': 'Stage 4',
    '17b10f58-1abb-447b-a8bc-c7965662690d': 'Stage 5'
  };
  
  // Group by stage
  const byStage = {};
  data.results.forEach(deal => {
    const stage = deal.properties.dealstage;
    const stageName = stageIds[stage] || stage;
    if (!byStage[stageName]) byStage[stageName] = [];
    byStage[stageName].push(deal);
  });
  
  console.log('\nBreakdown by stage:');
  Object.keys(byStage).forEach(stage => {
    const deals = byStage[stage];
    const total = deals.reduce((sum, d) => sum + parseFloat(d.properties.amount || 0), 0);
    console.log(`  ${stage}: ${deals.length} deals ($${total.toLocaleString()})`);
  });
  
  const totalValue = data.results.reduce((sum, d) => sum + parseFloat(d.properties.amount || 0), 0);
  console.log(`\nTotal pipeline value: $${totalValue.toLocaleString()}`);
  
  console.log('\n\nFirst 10 deals:');
  data.results.slice(0, 10).forEach((deal, i) => {
    const lastMod = deal.properties.hs_lastmodifieddate || 'N/A';
    const lastAct = deal.properties.hs_last_activity_date || 'N/A';
    console.log(`\n${i+1}. ${deal.properties.dealname}`);
    console.log(`   Stage: ${stageIds[deal.properties.dealstage] || deal.properties.dealstage}`);
    console.log(`   Amount: $${deal.properties.amount || 0}`);
    console.log(`   Close date: ${deal.properties.closedate || 'N/A'}`);
    console.log(`   Last modified: ${lastMod.substring(0,10)}`);
    console.log(`   Last activity: ${lastAct !== 'N/A' ? lastAct.substring(0,10) : 'N/A'}`);
  });
}

fetchDeals().catch(console.error);

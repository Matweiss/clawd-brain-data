#!/usr/bin/env node
/**
 * Fetch Stale Deals with Full Context
 * - Pulls deals from HubSpot owned by Mat
 * - Gets associated Gmail threads
 * - Gets Avoma meeting transcripts
 * - Outputs JSON with full context for email drafting
 */

const { google } = require('googleapis');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Configuration
const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN || 'pat-na1-a249996e-eb7d-4184-841f-2759d28a8323';
const AVOMA_API_KEY = process.env.AVOMA_API_KEY || 'vh82rab620:2ci8lvop8u5duwc4u680';
const MAT_OWNER_ID = '728033696';
const GOOGLE_CREDS_PATH = '/data/.openclaw/google-credentials.json';
const GOOGLE_TOKEN_PATH = '/data/.openclaw/google-token.json';

// Staleness thresholds (days) by deal stage
const STALE_THRESHOLDS = {
  'qualification': 3,  // Was 7
  'discovery': 2,      // Was 5
  'proposal': 2,       // Was 4
  'negotiation': 2,    // Was 4
  'contract': 2,       // Was 3
  'default': 2         // Was 5
};

// Initialize Google API
let gmail, calendar;
async function initGoogleAPIs() {
  const credentials = JSON.parse(fs.readFileSync(GOOGLE_CREDS_PATH, 'utf8'));
  const token = JSON.parse(fs.readFileSync(GOOGLE_TOKEN_PATH, 'utf8'));
  
  const oauth2Client = new google.auth.OAuth2(
    credentials.installed.client_id,
    credentials.installed.client_secret,
    credentials.installed.redirect_uris[0]
  );
  
  oauth2Client.setCredentials(token);
  
  gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  calendar = google.calendar({ version: 'v3', auth: oauth2Client });
}

// Fetch deals from HubSpot
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
      'hs_lastmodifieddate', 'notes_last_updated', 
      'hs_object_id', 'hs_last_activity_date',
      'hs_last_activity_type', 'hs_next_step'
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
  
  if (!response.ok) {
    throw new Error(`HubSpot API error: ${response.status} ${await response.text()}`);
  }
  
  const data = await response.json();
  return data.results || [];
}

// Get associated contacts for a deal
async function getContactsForDeal(dealId) {
  const url = `https://api.hubapi.com/crm/v3/objects/deals/${dealId}/associations/contacts`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${HUBSPOT_TOKEN}` }
  });
  
  if (!response.ok) return [];
  
  const data = await response.json();
  const contactIds = data.results?.map(r => r.id) || [];
  
  // Fetch contact details
  const contacts = [];
  for (const contactId of contactIds.slice(0, 3)) { // Limit to 3 contacts
    const contactUrl = `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?properties=email,firstname,lastname,phone`;
    const contactResponse = await fetch(contactUrl, {
      headers: { 'Authorization': `Bearer ${HUBSPOT_TOKEN}` }
    });
    if (contactResponse.ok) {
      const contactData = await contactResponse.json();
      contacts.push(contactData.properties);
    }
  }
  
  return contacts;
}

// Get Gmail threads for a contact email
async function getGmailThreads(contactEmail, limit = 3) {
  if (!contactEmail) return [];
  
  try {
    const query = `from:${contactEmail} OR to:${contactEmail}`;
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: limit
    });
    
    if (!response.data.messages) return [];
    
    const threads = [];
    for (const msg of response.data.messages) {
      const message = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'metadata',
        metadataHeaders: ['From', 'To', 'Subject', 'Date']
      });
      
      const headers = message.data.payload.headers;
      const getHeader = (name) => headers.find(h => h.name === name)?.value || '';
      
      threads.push({
        subject: getHeader('Subject'),
        from: getHeader('From'),
        date: getHeader('Date'),
        snippet: message.data.snippet
      });
    }
    
    return threads;
  } catch (error) {
    console.error(`Error fetching Gmail for ${contactEmail}:`, error.message);
    return [];
  }
}

// Calculate days since last activity
function calculateDaysSinceActivity(lastActivityDate) {
  if (!lastActivityDate) return 999;
  const lastDate = new Date(lastActivityDate);
  const now = new Date();
  return Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
}

// Determine if deal is stale
function isStale(deal, daysSinceActivity) {
  const stage = deal.properties.dealstage?.toLowerCase() || 'default';
  const threshold = STALE_THRESHOLDS[stage] || STALE_THRESHOLDS.default;
  return daysSinceActivity >= threshold;
}

// Main function
async function main() {
  console.error('Initializing Google APIs...');
  await initGoogleAPIs();
  
  console.error('Fetching deals from HubSpot...');
  const deals = await fetchDeals();
  
  console.error(`Found ${deals.length} open deals`);
  
  const staleDeals = [];
  
  for (const deal of deals) {
    const lastActivity = deal.properties.hs_last_activity_date || deal.properties.hs_lastmodifieddate;
    const daysSinceActivity = calculateDaysSinceActivity(lastActivity);
    
    if (!isStale(deal, daysSinceActivity)) continue;
    
    console.error(`Processing stale deal: ${deal.properties.dealname}`);
    
    // Get contacts
    const contacts = await getContactsForDeal(deal.id);
    
    // Get Gmail threads for primary contact
    let emailThreads = [];
    if (contacts[0]?.email) {
      emailThreads = await getGmailThreads(contacts[0].email);
    }
    
    staleDeals.push({
      id: deal.id,
      name: deal.properties.dealname,
      stage: deal.properties.dealstage,
      amount: deal.properties.amount,
      closeDate: deal.properties.closedate,
      lastActivity: lastActivity,
      daysSinceActivity: daysSinceActivity,
      lastActivityType: deal.properties.hs_last_activity_type,
      nextStep: deal.properties.hs_next_step,
      contacts: contacts,
      recentEmails: emailThreads,
      hubspotUrl: `https://app.hubspot.com/contacts/44827537/deal/${deal.id}`
    });
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Output JSON
  console.log(JSON.stringify(staleDeals, null, 2));
  console.error(`\nFound ${staleDeals.length} stale deals`);
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});

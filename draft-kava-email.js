const fetch = require('node-fetch');
const { google } = require('googleapis');
const fs = require('fs');

const HUBSPOT_TOKEN = 'pat-na1-a249996e-eb7d-4184-841f-2759d28a8323';
const GOOGLE_CREDS_PATH = '/data/.openclaw/google-credentials.json';
const GOOGLE_TOKEN_PATH = '/data/.openclaw/google-token.json';

async function getDealContext() {
  // 1. Search for Kava Culture deal
  const searchUrl = 'https://api.hubapi.com/crm/v3/objects/deals/search';
  const searchBody = {
    filterGroups: [{
      filters: [
        { propertyName: 'dealname', operator: 'CONTAINS_TOKEN', value: 'Kava Culture' }
      ]
    }],
    properties: [
      'dealname', 'dealstage', 'amount', 'closedate',
      'hs_object_id', 'notes_last_updated'
    ]
  };
  
  const dealResponse = await fetch(searchUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(searchBody)
  });
  
  const dealData = await dealResponse.json();
  
  if (!dealData.results || dealData.results.length === 0) {
    console.log('Deal not found');
    return;
  }
  
  const deal = dealData.results[0];
  console.log('\n=== DEAL INFO ===');
  console.log('Name:', deal.properties.dealname);
  console.log('Amount:', deal.properties.amount);
  console.log('ID:', deal.id);
  
  // 2. Get associated contacts
  const contactsUrl = `https://api.hubapi.com/crm/v3/objects/deals/${deal.id}/associations/contacts`;
  const contactsResponse = await fetch(contactsUrl, {
    headers: { 'Authorization': `Bearer ${HUBSPOT_TOKEN}` }
  });
  
  const contactsData = await contactsResponse.json();
  
  if (!contactsData.results || contactsData.results.length === 0) {
    console.log('\nNo contacts found');
    return;
  }
  
  // 3. Get contact details
  const contactId = contactsData.results[0].id;
  const contactUrl = `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?properties=email,firstname,lastname,phone,jobtitle,company`;
  const contactResponse = await fetch(contactUrl, {
    headers: { 'Authorization': `Bearer ${HUBSPOT_TOKEN}` }
  });
  
  const contactData = await contactResponse.json();
  const contact = contactData.properties;
  
  console.log('\n=== CONTACT INFO ===');
  console.log('Name:', contact.firstname, contact.lastname);
  console.log('Email:', contact.email);
  console.log('Title:', contact.jobtitle || 'N/A');
  console.log('Phone:', contact.phone || 'N/A');
  
  // 4. Get Gmail threads (if email exists)
  if (contact.email) {
    const credentials = JSON.parse(fs.readFileSync(GOOGLE_CREDS_PATH, 'utf8'));
    const token = JSON.parse(fs.readFileSync(GOOGLE_TOKEN_PATH, 'utf8'));
    
    const oauth2Client = new google.auth.OAuth2(
      credentials.installed.client_id,
      credentials.installed.client_secret,
      credentials.installed.redirect_uris[0]
    );
    
    oauth2Client.setCredentials(token);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    try {
      const query = `from:${contact.email} OR to:${contact.email}`;
      const threadsResponse = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 3
      });
      
      console.log('\n=== EMAIL HISTORY ===');
      
      if (!threadsResponse.data.messages) {
        console.log('No email history found');
      } else {
        for (const msg of threadsResponse.data.messages) {
          const message = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'metadata',
            metadataHeaders: ['From', 'To', 'Subject', 'Date']
          });
          
          const headers = message.data.payload.headers;
          const getHeader = (name) => headers.find(h => h.name === name)?.value || '';
          
          console.log(`\n- Subject: ${getHeader('Subject')}`);
          console.log(`  Date: ${getHeader('Date')}`);
          console.log(`  Snippet: ${message.data.snippet.substring(0, 100)}...`);
        }
      }
    } catch (error) {
      console.log('\nGmail error:', error.message);
    }
  }
  
  // Return structured data
  return {
    deal: {
      name: deal.properties.dealname,
      amount: deal.properties.amount,
      id: deal.id
    },
    contact: {
      firstName: contact.firstname,
      lastName: contact.lastname,
      email: contact.email,
      title: contact.jobtitle,
      phone: contact.phone
    }
  };
}

getDealContext().catch(console.error);

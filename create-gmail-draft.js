const { google } = require('googleapis');
const fs = require('fs');

const GOOGLE_CREDS_PATH = '/data/.openclaw/google-credentials.json';
const GOOGLE_TOKEN_PATH = '/data/.openclaw/google-token.json';

async function createDraft() {
  // Initialize Gmail API
  const credentials = JSON.parse(fs.readFileSync(GOOGLE_CREDS_PATH, 'utf8'));
  const token = JSON.parse(fs.readFileSync(GOOGLE_TOKEN_PATH, 'utf8'));
  
  const oauth2Client = new google.auth.OAuth2(
    credentials.installed.client_id,
    credentials.installed.client_secret,
    credentials.installed.redirect_uris[0]
  );
  
  oauth2Client.setCredentials(token);
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  
  // Construct email
  const emailContent = [
    'To: purchasing@kavaculture.com',
    'Subject: Re: Craftable + Kava Culture',
    'Content-Type: text/plain; charset=utf-8',
    '',
    'Hey Abi!',
    '',
    'Hope you\'re doing well! Our conversation about Kava Culture\'s operations has been on ice since late January (and not the good kind of ice—more like that forgotten cold brew in the back of the fridge 😂).',
    '',
    'Kelly reached out a few weeks back, but I wanted to personally check in. We had a great chat with Justin back in December about how you\'re managing inventory and procurement, and I\'d love to know if the timing\'s better now to revisit how Craftable could help streamline things.',
    '',
    'Let me know what time works for you!',
    '',
    'Mat Weiss',
    'Senior Account Executive',
    '818-917-7847',
    'craftable.com',
    'mat@craftable.com',
    'facebook instagram linkedin'
  ].join('\n');
  
  // Encode as base64url
  const encodedEmail = Buffer.from(emailContent)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  // Create draft
  try {
    const response = await gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          raw: encodedEmail
        }
      }
    });
    
    console.log('✅ Draft created successfully!');
    console.log('Draft ID:', response.data.id);
    console.log('Message ID:', response.data.message.id);
    console.log('\nYou can view it in Gmail: https://mail.google.com/mail/u/0/#drafts');
    
  } catch (error) {
    console.error('Error creating draft:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

createDraft();

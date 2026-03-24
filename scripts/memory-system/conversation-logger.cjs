#!/usr/bin/env node
/**
 * Clawd Memory - Conversation Logger
 * Logs conversations with topics, decisions, and action items
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = process.env.MEMORY_DIR || '/root/.openclaw/workspace/memory';
const CONV_DIR = path.join(MEMORY_DIR, 'archive', 'conversations');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getTimestamp() {
  return new Date().toISOString();
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function logConversation(topics = [], decisions = [], actionItems = [], context = {}) {
  ensureDir(CONV_DIR);
  
  const timestamp = getTimestamp();
  const today = getToday();
  const convFile = path.join(CONV_DIR, `${today}.md`);
  
  const entry = `
## Conversation - ${timestamp}

**Topics:** ${topics.join(', ') || 'General'}  
${context.project ? `**Project:** ${context.project}  ` : ''}
${context.participants ? `**Participants:** ${context.participants.join(', ')}  ` : ''}

### Decisions Made
${decisions.length > 0 ? decisions.map(d => `- ${d}`).join('\n') : '- None recorded'}

### Action Items
${actionItems.length > 0 ? actionItems.map(a => `- [ ] ${a}`).join('\n') : '- None recorded'}

---
`;

  let content = '';
  if (fs.existsSync(convFile)) {
    content = fs.readFileSync(convFile, 'utf8');
  } else {
    content = `# Conversation Log - ${today}\n\n`;
  }
  
  content += entry;
  fs.writeFileSync(convFile, content);
  
  return {
    logged: true,
    file: convFile,
    timestamp,
    topics
  };
}

function searchConversations(query, days = 30) {
  ensureDir(CONV_DIR);
  
  const files = fs.readdirSync(CONV_DIR)
    .filter(f => f.endsWith('.md'))
    .sort()
    .reverse()
    .slice(0, days);
  
  const results = [];
  const queryLower = query.toLowerCase();
  
  for (const file of files) {
    const content = fs.readFileSync(path.join(CONV_DIR, file), 'utf8');
    if (content.toLowerCase().includes(queryLower)) {
      // Extract matching sections
      const sections = content.split('## Conversation - ').slice(1);
      for (const section of sections) {
        if (section.toLowerCase().includes(queryLower)) {
          const lines = section.split('\n');
          const timestamp = lines[0].trim();
          const topicLine = lines.find(l => l.startsWith('**Topics:**'));
          const topics = topicLine ? topicLine.replace('**Topics:**', '').trim() : 'Unknown';
          
          results.push({
            date: file.replace('.md', ''),
            timestamp,
            topics,
            snippet: section.substring(0, 500) + '...'
          });
        }
      }
    }
  }
  
  return results;
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'log':
      const topics = args[1] ? args[1].split(',') : [];
      const decisions = args[2] ? args[2].split('|') : [];
      const actions = args[3] ? args[3].split('|') : [];
      const result = logConversation(topics, decisions, actions);
      console.log(JSON.stringify(result, null, 2));
      break;
    case 'search':
      if (args[1]) {
        const searchResults = searchConversations(args[1], parseInt(args[2]) || 30);
        console.log(JSON.stringify(searchResults, null, 2));
      }
      break;
    default:
      console.log('Usage:');
      console.log('  node conversation-logger.js log "topic1,topic2" "decision1|decision2" "action1|action2"');
      console.log('  node conversation-logger.js search "query" [days]');
  }
}

module.exports = { logConversation, searchConversations };

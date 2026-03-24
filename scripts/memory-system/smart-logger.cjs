#!/usr/bin/env node
/**
 * Smart Conversation Logger
 * Automatically detects and logs decisions, action items, and key moments
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(process.env.HOME || '/root', '.openclaw/workspace/memory');
const CONVERSATIONS_DIR = path.join(MEMORY_DIR, 'archive/conversations');

function ensureDirectories() {
  if (!fs.existsSync(CONVERSATIONS_DIR)) {
    fs.mkdirSync(CONVERSATIONS_DIR, { recursive: true });
  }
}

function detectDecisions(text) {
  const decisions = [];
  
  // Patterns that indicate a decision
  const decisionPatterns = [
    /(?:we|I)\s+(?:decided|agreed|chose|opted)\s+(?:to|for)\s+(.+?)(?:\.|$|,|;)/i,
    /(?:let's|we should|we will)\s+(.+?)(?:\.|$|,|;)/i,
    /(?:decision|decided):?\s+(.+?)(?:\.|$|,|;)/i,
    /(?:going with|going to use|selected)\s+(.+?)(?:\.|$|,|;)/i,
    /(?:agreed|consensus)\s+(?:on|to)\s+(.+?)(?:\.|$|,|;)/i
  ];
  
  for (const pattern of decisionPatterns) {
    const matches = text.matchAll(new RegExp(pattern, 'gi'));
    for (const match of matches) {
      if (match[1] && match[1].length > 5) {
        decisions.push({
          type: 'decision',
          text: match[1].trim(),
          context: match[0],
          confidence: 'high'
        });
      }
    }
  }
  
  return decisions;
}

function detectActionItems(text) {
  const actions = [];
  
  // Patterns for action items
  const actionPatterns = [
    /(?:I|we)\s+(?:need to|should|will|must)\s+(.+?)(?:\.|$|,|;)/i,
    /(?:action item|todo|task):?\s+(.+?)(?:\.|$|,|;)/i,
    /(?:remind me to|don't forget to)\s+(.+?)(?:\.|$|,|;)/i,
    /(?:next step|next action)\s+(?:is|:)?\s+(.+?)(?:\.|$|,|;)/i
  ];
  
  for (const pattern of actionPatterns) {
    const matches = text.matchAll(new RegExp(pattern, 'gi'));
    for (const match of matches) {
      if (match[1] && match[1].length > 5) {
        actions.push({
          type: 'action',
          text: match[1].trim(),
          context: match[0],
          assignee: 'self' // Could be enhanced to detect "you should" vs "I should"
        });
      }
    }
  }
  
  return actions;
}

function detectDeadlines(text) {
  const deadlines = [];
  const calendar = require('./calendar-integration.cjs');
  
  const extracted = calendar.extractDeadlinesFromText(text);
  extracted.forEach(d => {
    deadlines.push({
      type: 'deadline',
      date: d.date,
      context: d.context,
      description: d.original
    });
  });
  
  return deadlines;
}

function detectProjects(text) {
  const projects = [];
  const projectsDir = path.join(MEMORY_DIR, 'archive/projects');
  
  if (!fs.existsSync(projectsDir)) return projects;
  
  // Get all project names
  const files = fs.readdirSync(projectsDir).filter(f => f.endsWith('.md'));
  
  files.forEach(file => {
    try {
      const content = fs.readFileSync(path.join(projectsDir, file), 'utf-8');
      const nameMatch = content.match(/# (.+)/);
      
      if (nameMatch) {
        const projectName = nameMatch[1].toLowerCase();
        const slug = file.replace('.md', '');
        
        // Check if project is mentioned
        if (text.toLowerCase().includes(projectName) || 
            text.toLowerCase().includes(slug.replace(/-/g, ' '))) {
          projects.push({
            slug,
            name: nameMatch[1]
          });
        }
      }
    } catch (e) {
      // Skip files that can't be read
    }
  });
  
  return projects;
}

function detectTopics(text) {
  const topics = [];
  
  // Room names
  const rooms = ['living room', 'bedroom', 'kitchen', 'bathroom', 'art room', 
                 'den', 'office', 'garage', 'hallway', 'entry'];
  rooms.forEach(room => {
    if (text.toLowerCase().includes(room)) {
      topics.push({ type: 'room', value: room });
    }
  });
  
  // Technology keywords
  const tech = ['esp32', 'home assistant', 'automation', 'sensor', 'camera', 
                'dashboard', 'api', 'integration'];
  tech.forEach(t => {
    if (text.toLowerCase().includes(t)) {
      topics.push({ type: 'technology', value: t });
    }
  });
  
  return topics;
}

function analyzeConversation(text, metadata = {}) {
  const analysis = {
    timestamp: new Date().toISOString(),
    decisions: detectDecisions(text),
    actionItems: detectActionItems(text),
    deadlines: detectDeadlines(text),
    projects: detectProjects(text),
    topics: detectTopics(text),
    metadata
  };
  
  analysis.summary = generateSummary(analysis);
  
  return analysis;
}

function generateSummary(analysis) {
  const parts = [];
  
  if (analysis.decisions.length > 0) {
    parts.push(`${analysis.decisions.length} decision(s)`);
  }
  if (analysis.actionItems.length > 0) {
    parts.push(`${analysis.actionItems.length} action item(s)`);
  }
  if (analysis.deadlines.length > 0) {
    parts.push(`${analysis.deadlines.length} deadline(s)`);
  }
  if (analysis.projects.length > 0) {
    parts.push(`related to: ${analysis.projects.map(p => p.name).join(', ')}`);
  }
  
  return parts.length > 0 ? parts.join('; ') : 'General conversation';
}

function logConversation(text, options = {}) {
  ensureDirectories();
  
  const analysis = analyzeConversation(text, options.metadata);
  const date = new Date().toISOString().split('T')[0];
  const time = new Date().toISOString().split('T')[1].split('.')[0];
  
  const entry = {
    timestamp: `${date} ${time}`,
    summary: analysis.summary,
    fullAnalysis: analysis,
    excerpt: text.substring(0, 200) + (text.length > 200 ? '...' : '')
  };
  
  // Save to daily log
  const logFile = path.join(CONVERSATIONS_DIR, `${date}.json`);
  let logs = [];
  
  if (fs.existsSync(logFile)) {
    logs = JSON.parse(fs.readFileSync(logFile, 'utf-8'));
  }
  
  logs.push(entry);
  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
  
  // Update project files if projects were mentioned
  if (analysis.projects.length > 0 && options.updateProjects !== false) {
    updateProjectActivity(analysis.projects, analysis);
  }
  
  console.log(`✅ Logged conversation: ${analysis.summary}`);
  
  return entry;
}

function updateProjectActivity(projects, analysis) {
  const projectsDir = path.join(MEMORY_DIR, 'archive/projects');
  
  projects.forEach(project => {
    const projectFile = path.join(projectsDir, `${project.slug}.md`);
    
    if (fs.existsSync(projectFile)) {
      let content = fs.readFileSync(projectFile, 'utf-8');
      
      // Update last updated date
      content = content.replace(
        /\*\*Updated:\*\* \d{4}-\d{2}-\d{2}/,
        `**Updated:** ${new Date().toISOString().split('T')[0]}`
      );
      
      // Add activity entry
      const activityEntry = `\n- ${new Date().toISOString().split('T')[0]}: ${analysis.summary}`;
      
      // Append to activity section or create it
      if (content.includes('## Recent Activity')) {
        content = content.replace(
          /(## Recent Activity\n)/,
          `$1${activityEntry}`
        );
      } else {
        content += `\n\n## Recent Activity\n${activityEntry}`;
      }
      
      fs.writeFileSync(projectFile, content);
    }
  });
}

function getRecentConversations(days = 7) {
  ensureDirectories();
  
  const conversations = [];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  const files = fs.readdirSync(CONVERSATIONS_DIR).filter(f => f.endsWith('.json'));
  
  files.forEach(file => {
    const fileDate = new Date(file.replace('.json', ''));
    if (fileDate >= cutoff) {
      const logs = JSON.parse(fs.readFileSync(path.join(CONVERSATIONS_DIR, file), 'utf-8'));
      conversations.push(...logs);
    }
  });
  
  return conversations.sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );
}

// CLI Interface
const command = process.argv[2];

switch (command) {
  case 'log':
    const text = process.argv.slice(3).join(' ');
    if (!text) {
      console.log('Usage: smart-logger.cjs log "conversation text"');
      process.exit(1);
    }
    logConversation(text);
    break;
    
  case 'analyze':
    const analyzeText = process.argv.slice(3).join(' ');
    if (!analyzeText) {
      console.log('Usage: smart-logger.cjs analyze "text to analyze"');
      process.exit(1);
    }
    const analysis = analyzeConversation(analyzeText);
    console.log('\n🧠 Analysis Results:\n');
    console.log(JSON.stringify(analysis, null, 2));
    break;
    
  case 'recent':
    const days = parseInt(process.argv[3]) || 7;
    const recent = getRecentConversations(days);
    
    console.log(`\n📝 Recent Conversations (last ${days} days)\n`);
    
    if (recent.length === 0) {
      console.log('No conversations found.');
    } else {
      recent.slice(0, 20).forEach(c => {
        console.log(`• ${c.timestamp}`);
        console.log(`  ${c.summary}`);
        console.log();
      });
    }
    break;
    
  default:
    console.log('🧠 Smart Conversation Logger\n');
    console.log('Commands:');
    console.log('  log "<text>"          Log and analyze a conversation');
    console.log('  analyze "<text>"      Analyze text without logging');
    console.log('  recent [days]         Show recent conversations (default: 7)');
    console.log();
    console.log('Auto-detects:');
    console.log('  • Decisions ("we decided to...")');
    console.log('  • Action items ("I need to...")');
    console.log('  • Deadlines ("by Friday")');
    console.log('  • Projects (matches project names)');
    console.log('  • Topics (rooms, technology)');
}

module.exports = {
  analyzeConversation,
  logConversation,
  getRecentConversations,
  detectDecisions,
  detectActionItems
};

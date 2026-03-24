#!/usr/bin/env node
/**
 * Clawd Memory - Proactive Reminder System
 * Identifies stale projects, forgotten tasks, and improvement opportunities
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = process.env.MEMORY_DIR || '/root/.openclaw/workspace/memory';
const STATE_FILE = path.join(MEMORY_DIR, 'clawd-memory-state.json');
const PROCESSES_FILE = path.join(MEMORY_DIR, 'processes', 'identified-processes.md');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  }
  return { projects: [], created: new Date().toISOString() };
}

function getStaleProjects() {
  const state = loadState();
  const today = new Date();
  
  return state.projects
    .filter(p => p.status === 'active')
    .map(p => {
      const updated = new Date(p.updated);
      const daysStale = Math.floor((today - updated) / (1000 * 60 * 60 * 24));
      return { ...p, daysStale };
    })
    .filter(p => p.daysStale > 7)
    .sort((a, b) => b.daysStale - a.daysStale);
}

function getPriorityProjects() {
  const state = loadState();
  return state.projects
    .filter(p => p.status === 'active' && p.priority === 'high')
    .sort((a, b) => new Date(b.updated) - new Date(a.updated));
}

function identifyProcessImprovements() {
  // This would analyze conversation logs for recurring patterns
  // For now, return placeholder
  return [];
}

function generateReminders() {
  const staleProjects = getStaleProjects();
  const priorityProjects = getPriorityProjects();
  const processImprovements = identifyProcessImprovements();
  
  const reminders = [];
  
  // Stale project reminders
  if (staleProjects.length > 0) {
    reminders.push({
      type: 'stale-projects',
      priority: 'high',
      message: `You have ${staleProjects.length} stale project(s) that haven't been updated in 7+ days`,
      items: staleProjects.map(p => `${p.name} (${p.daysStale} days)`)
    });
  }
  
  // Priority project reminders
  if (priorityProjects.length > 0) {
    const notUpdated = priorityProjects.filter(p => {
      const days = Math.floor((new Date() - new Date(p.updated)) / (1000 * 60 * 60 * 24));
      return days > 3;
    });
    
    if (notUpdated.length > 0) {
      reminders.push({
        type: 'priority-projects',
        priority: 'medium',
        message: `${notUpdated.length} high-priority project(s) haven't been updated in 3+ days`,
        items: notUpdated.map(p => p.name)
      });
    }
  }
  
  // Process improvement suggestions
  if (processImprovements.length > 0) {
    reminders.push({
      type: 'process-improvements',
      priority: 'low',
      message: 'Potential automation opportunities identified',
      items: processImprovements
    });
  }
  
  return reminders;
}

function logProcess(description, frequency, painLevel, automationPotential) {
  ensureDir(path.dirname(PROCESSES_FILE));
  
  const entry = `
## Process Identified - ${new Date().toISOString().split('T')[0]}

**Description:** ${description}  
**Frequency:** ${frequency}  
**Pain Level:** ${painLevel}/10  
**Automation Potential:** ${automationPotential}/10  
**Status:** Identified

---
`;

  let content = '';
  if (fs.existsSync(PROCESSES_FILE)) {
    content = fs.readFileSync(PROCESSES_FILE, 'utf8');
  } else {
    content = '# Identified Processes & Automation Opportunities\n\n';
  }
  
  content += entry;
  fs.writeFileSync(PROCESSES_FILE, content);
  
  return { logged: true };
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'check':
      const reminders = generateReminders();
      console.log(JSON.stringify(reminders, null, 2));
      break;
    case 'log-process':
      if (args[1]) {
        const result = logProcess(args[1], args[2] || 'unknown', args[3] || '5', args[4] || '5');
        console.log(JSON.stringify(result, null, 2));
      }
      break;
    default:
      console.log('Usage:');
      console.log('  node proactive-reminders.js check');
      console.log('  node proactive-reminders.js log-process "description" [frequency] [pain] [automation]');
  }
}

module.exports = { generateReminders, logProcess, getStaleProjects };

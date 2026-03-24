#!/usr/bin/env node
/**
 * Clawd Memory - Project Tracker
 * Tracks projects with status, actions, and reminders
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = process.env.MEMORY_DIR || '/root/.openclaw/workspace/memory';
const PROJECTS_DIR = path.join(MEMORY_DIR, 'archive', 'projects');
const STATE_FILE = path.join(MEMORY_DIR, 'clawd-memory-state.json');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function getTimestamp() {
  return new Date().toISOString();
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  }
  return {
    projects: [],
    lastDigest: null,
    created: getTimestamp()
  };
}

function saveState(state) {
  ensureDir(path.dirname(STATE_FILE));
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function logProject(name, status = 'active', nextAction = '', notes = '', priority = 'medium') {
  ensureDir(PROJECTS_DIR);
  
  const timestamp = getToday();
  const slug = slugify(name);
  const projectFile = path.join(PROJECTS_DIR, `${timestamp}-${slug}.md`);
  
  const content = `# ${name}

**Status:** ${status}  
**Priority:** ${priority}  
**Created:** ${timestamp}  
**Last Updated:** ${timestamp}

## Next Action
${nextAction || 'TBD'}

## Notes
${notes || ''}

## History
- ${timestamp}: Project created

---
*Tracked by Clawd Memory*
`;

  fs.writeFileSync(projectFile, content);
  
  // Update state
  const state = loadState();
  const existingIndex = state.projects.findIndex(p => p.slug === slug);
  const projectEntry = {
    name,
    slug,
    status,
    priority,
    created: timestamp,
    updated: timestamp,
    file: projectFile
  };
  
  if (existingIndex >= 0) {
    state.projects[existingIndex] = projectEntry;
  } else {
    state.projects.push(projectEntry);
  }
  
  saveState(state);
  
  return projectEntry;
}

function updateProject(slug, updates) {
  const state = loadState();
  const project = state.projects.find(p => p.slug === slug);
  
  if (!project) {
    return { error: 'Project not found' };
  }
  
  const timestamp = getToday();
  project.updated = timestamp;
  
  if (updates.status) project.status = updates.status;
  if (updates.priority) project.priority = updates.priority;
  
  // Update file
  if (fs.existsSync(project.file)) {
    let content = fs.readFileSync(project.file, 'utf8');
    
    if (updates.status) {
      content = content.replace(/\*\*Status:\*\* .+/, `**Status:** ${updates.status}`);
    }
    if (updates.nextAction) {
      content = content.replace(/## Next Action\n.+/, `## Next Action\n${updates.nextAction}`);
    }
    if (updates.notes) {
      content = content.replace(/## Notes\n/, `## Notes\n${updates.notes}\n`);
    }
    
    content = content.replace(/\*\*Last Updated:\*\* .+/, `**Last Updated:** ${timestamp}`);
    content = content.replace(/## History/, `## History\n- ${timestamp}: ${updates.status || 'Updated'}`);
    
    fs.writeFileSync(project.file, content);
  }
  
  saveState(state);
  return project;
}

function listProjects(filter = {}) {
  const state = loadState();
  let projects = state.projects;
  
  if (filter.status) {
    projects = projects.filter(p => p.status === filter.status);
  }
  if (filter.priority) {
    projects = projects.filter(p => p.priority === filter.priority);
  }
  
  // Check for stale projects
  const today = new Date();
  projects.forEach(p => {
    const updated = new Date(p.updated);
    const daysStale = Math.floor((today - updated) / (1000 * 60 * 60 * 24));
    p.daysStale = daysStale;
    p.isStale = daysStale > 7;
  });
  
  return projects.sort((a, b) => {
    if (a.isStale !== b.isStale) return a.isStale ? 1 : -1;
    if (a.priority !== b.priority) {
      const priorities = { high: 0, medium: 1, low: 2 };
      return priorities[a.priority] - priorities[b.priority];
    }
    return new Date(b.updated) - new Date(a.updated);
  });
}

function getStaleProjects() {
  return listProjects().filter(p => p.isStale);
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'add':
      if (args[1]) {
        const result = logProject(args[1], args[2] || 'active', args[3] || '', args[4] || '', args[5] || 'medium');
        console.log(JSON.stringify(result, null, 2));
      }
      break;
    case 'update':
      if (args[1]) {
        const updates = {};
        if (args[2]) updates.status = args[2];
        if (args[3]) updates.nextAction = args[3];
        const result = updateProject(args[1], updates);
        console.log(JSON.stringify(result, null, 2));
      }
      break;
    case 'list':
      const filter = {};
      if (args[1]) filter.status = args[1];
      console.log(JSON.stringify(listProjects(filter), null, 2));
      break;
    case 'stale':
      console.log(JSON.stringify(getStaleProjects(), null, 2));
      break;
    default:
      console.log('Usage:');
      console.log('  node project-tracker.js add "Project Name" [status] [nextAction] [notes] [priority]');
      console.log('  node project-tracker.js update <slug> [status] [nextAction]');
      console.log('  node project-tracker.js list [status]');
      console.log('  node project-tracker.js stale');
  }
}

module.exports = { logProject, updateProject, listProjects, getStaleProjects };

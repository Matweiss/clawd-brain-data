#!/usr/bin/env node
/**
 * Clawd Memory - Unified Search
 * Searches across all memory: conversations, media, projects
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = process.env.MEMORY_DIR || '/root/.openclaw/workspace/memory';

function searchAll(query, options = {}) {
  const results = {
    query,
    conversations: [],
    media: [],
    projects: [],
    total: 0
  };
  
  const queryLower = query.toLowerCase();
  const days = options.days || 30;
  
  // Search conversations
  const convDir = path.join(MEMORY_DIR, 'archive', 'conversations');
  if (fs.existsSync(convDir)) {
    const files = fs.readdirSync(convDir)
      .filter(f => f.endsWith('.md'))
      .sort()
      .reverse()
      .slice(0, days);
    
    for (const file of files) {
      const content = fs.readFileSync(path.join(convDir, file), 'utf8');
      if (content.toLowerCase().includes(queryLower)) {
        const sections = content.split('## Conversation - ').slice(1);
        for (const section of sections) {
          if (section.toLowerCase().includes(queryLower)) {
            results.conversations.push({
              date: file.replace('.md', ''),
              timestamp: section.split('\n')[0].trim(),
              snippet: section.substring(0, 300) + '...'
            });
          }
        }
      }
    }
  }
  
  // Search media index
  const mediaIndex = path.join(MEMORY_DIR, 'media-archive-index.md');
  if (fs.existsSync(mediaIndex)) {
    const content = fs.readFileSync(mediaIndex, 'utf8');
    const entries = content.split('### ').slice(1);
    
    for (const entry of entries) {
      if (entry.toLowerCase().includes(queryLower)) {
        const lines = entry.split('\n');
        const title = lines[0].trim();
        const fileLine = lines.find(l => l.includes('**File:**'));
        const file = fileLine ? fileLine.match(/`(.+)`/)?.[1] : 'unknown';
        
        results.media.push({
          title,
          file,
          snippet: entry.substring(0, 300) + '...'
        });
      }
    }
  }
  
  // Search projects
  const projectsDir = path.join(MEMORY_DIR, 'archive', 'projects');
  if (fs.existsSync(projectsDir)) {
    const files = fs.readdirSync(projectsDir).filter(f => f.endsWith('.md'));
    
    for (const file of files) {
      const content = fs.readFileSync(path.join(projectsDir, file), 'utf8');
      if (content.toLowerCase().includes(queryLower)) {
        const title = content.split('\n')[0].replace('# ', '').trim();
        const statusMatch = content.match(/\*\*Status:\*\* (.+)/);
        const status = statusMatch ? statusMatch[1] : 'unknown';
        
        results.projects.push({
          title,
          status,
          file,
          snippet: content.substring(0, 300) + '...'
        });
      }
    }
  }
  
  results.total = results.conversations.length + results.media.length + results.projects.length;
  
  return results;
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const query = args[0];
  const days = parseInt(args[1]) || 30;
  
  if (query) {
    const results = searchAll(query, { days });
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log('Usage: node memory-search.js "query" [days]');
  }
}

module.exports = { searchAll };

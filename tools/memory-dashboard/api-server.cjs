#!/usr/bin/env node
/**
 * Memory Dashboard API Server
 * Serves data for the memory dashboard UI
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const MEMORY_DIR = path.join(process.env.HOME || '/root', '.openclaw/workspace/memory');
const PORT = process.env.MEMORY_API_PORT || 3456;

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

function readProjects() {
  const projectsDir = path.join(MEMORY_DIR, 'archive/projects');
  if (!fs.existsSync(projectsDir)) return [];
  
  const files = fs.readdirSync(projectsDir).filter(f => f.endsWith('.md'));
  const projects = [];
  const now = new Date();
  
  files.forEach(file => {
    try {
      const content = fs.readFileSync(path.join(projectsDir, file), 'utf-8');
      
      const nameMatch = content.match(/# (.+)/);
      const statusMatch = content.match(/\*\*Status:\*\* (\w+)/i);
      const priorityMatch = content.match(/\*\*Priority:\*\* (\w+)/i);
      const updatedMatch = content.match(/\*\*Updated:\*\* (\d{4}-\d{2}-\d{2})/);
      const nextActionMatch = content.match(/\*\*Next Action:\*\* (.+)/);
      
      if (nameMatch) {
        const updatedDate = updatedMatch ? new Date(updatedMatch[1]) : new Date();
        const daysStale = Math.floor((now - updatedDate) / (1000 * 60 * 60 * 24));
        
        projects.push({
          name: nameMatch[1],
          slug: file.replace('.md', ''),
          status: (statusMatch?.[1] || 'active').toLowerCase(),
          priority: (priorityMatch?.[1] || 'medium').toLowerCase(),
          lastUpdated: updatedMatch?.[1] || 'Unknown',
          nextAction: nextActionMatch?.[1] || '',
          isStale: daysStale >= 7 && statusMatch?.[1]?.toLowerCase() === 'active',
          daysStale
        });
      }
    } catch (e) {
      console.error(`Error reading project ${file}:`, e.message);
    }
  });
  
  return projects.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return new Date(b.lastUpdated) - new Date(a.lastUpdated);
  });
}

function readMedia() {
  const indexPath = path.join(MEMORY_DIR, 'media-archive-index.md');
  if (!fs.existsSync(indexPath)) return [];
  
  const content = fs.readFileSync(indexPath, 'utf-8');
  const media = [];
  
  // Parse media entries from markdown
  const entries = content.split('### ').slice(1);
  entries.forEach(entry => {
    const lines = entry.split('\n');
    const name = lines[0].trim();
    
    const fileMatch = entry.match(/\*\*File:\*\* `(.+)`/);
    const projectMatch = entry.match(/\*\*Project:\*\* (.+)/);
    const dateMatch = entry.match(/\*\*Date:\*\* (\d{4}-\d{2}-\d{2})/);
    
    if (fileMatch) {
      media.push({
        name,
        file: fileMatch[1],
        project: projectMatch?.[1] || 'General',
        date: dateMatch?.[1] || 'Unknown',
        type: fileMatch[1].match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' : 'file'
      });
    }
  });
  
  return media;
}

function readConversations() {
  const convDir = path.join(MEMORY_DIR, 'archive/conversations');
  if (!fs.existsSync(convDir)) return [];
  
  const files = fs.readdirSync(convDir).filter(f => f.endsWith('.md'));
  return files.map(file => ({
    date: file.replace('.md', ''),
    file: file,
    summary: 'Conversation log'
  })).sort((a, b) => b.date.localeCompare(a.date));
}

function searchMemory(query) {
  const results = {
    projects: [],
    media: [],
    conversations: []
  };
  
  const projects = readProjects();
  const media = readMedia();
  const conversations = readConversations();
  
  const q = query.toLowerCase();
  
  results.projects = projects.filter(p => 
    p.name.toLowerCase().includes(q) ||
    p.status.includes(q) ||
    p.priority.includes(q)
  );
  
  results.media = media.filter(m =>
    m.name.toLowerCase().includes(q) ||
    m.project.toLowerCase().includes(q)
  );
  
  return results;
}

function getStatus() {
  const projects = readProjects();
  const media = readMedia();
  const conversations = readConversations();
  
  const activeProjects = projects.filter(p => p.status === 'active');
  const staleProjects = projects.filter(p => p.isStale);
  
  return {
    activeProjects: activeProjects.length,
    mediaCount: media.length,
    staleProjects: staleProjects.length,
    conversations: conversations.length,
    projects,
    media,
    conversations,
    recentActivity: projects.slice(0, 5)
  };
}

const server = http.createServer((req, res) => {
  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  console.log(`${new Date().toISOString()} - ${req.method} ${pathname}`);
  
  try {
    switch (pathname) {
      case '/api/memory/status':
        res.writeHead(200);
        res.end(JSON.stringify(getStatus()));
        break;
        
      case '/api/memory/projects':
        res.writeHead(200);
        res.end(JSON.stringify(readProjects()));
        break;
        
      case '/api/memory/media':
        res.writeHead(200);
        res.end(JSON.stringify(readMedia()));
        break;
        
      case '/api/memory/conversations':
        res.writeHead(200);
        res.end(JSON.stringify(readConversations()));
        break;
        
      case '/api/memory/search':
        const query = parsedUrl.query.q || '';
        res.writeHead(200);
        res.end(JSON.stringify(searchMemory(query)));
        break;
        
      default:
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
    }
  } catch (e) {
    console.error('API Error:', e);
    res.writeHead(500);
    res.end(JSON.stringify({ error: e.message }));
  }
});

server.listen(PORT, () => {
  console.log(`🧠 Memory Dashboard API running on port ${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  GET /api/memory/status`);
  console.log(`  GET /api/memory/projects`);
  console.log(`  GET /api/memory/media`);
  console.log(`  GET /api/memory/conversations`);
  console.log(`  GET /api/memory/search?q=query`);
});

module.exports = { server, getStatus, readProjects, readMedia };

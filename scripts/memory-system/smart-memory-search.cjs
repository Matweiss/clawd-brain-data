#!/usr/bin/env node
/**
 * Smart Memory Search - Hybrid approach using ChromaDB + fallback
 * Works without Python dependencies
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MEMORY_DIR = '/root/.openclaw/workspace/memory';
const CHROMA_URL = 'http://localhost:8000';

// Simple keyword extraction for "semantic-like" search
function extractKeywords(text) {
  const stopwords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'and', 'but', 'or', 'yet', 'so', 'if', 'because', 'although', 'though', 'while', 'where', 'when', 'that', 'which', 'who', 'whom', 'whose', 'what', 'this', 'these', 'those', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing']);
  
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopwords.has(word));
}

// Score relevance based on keyword matches and context
function scoreRelevance(content, query) {
  const queryKeywords = extractKeywords(query);
  const contentLower = content.toLowerCase();
  
  let score = 0;
  
  // Exact phrase match (high score)
  if (contentLower.includes(query.toLowerCase())) {
    score += 100;
  }
  
  // Keyword matches
  for (const keyword of queryKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = contentLower.match(regex);
    if (matches) {
      score += matches.length * 10;
    }
  }
  
  // Bonus for section headers matching query
  const headers = content.match(/^#+\s+(.+)$/gm) || [];
  for (const header of headers) {
    const headerKeywords = extractKeywords(header);
    const overlap = headerKeywords.filter(k => queryKeywords.includes(k)).length;
    score += overlap * 20;
  }
  
  return score;
}

// Search memories with smart ranking
async function searchMemories(query, limit = 10) {
  console.log(`\n🔍 Searching: "${query}"\n`);
  
  const results = [];
  
  // Get all memory files
  const files = [];
  function traverseDir(dir) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        traverseDir(fullPath);
      } else if (item.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }
  
  try {
    traverseDir(MEMORY_DIR);
  } catch (e) {
    console.error('Error reading memory directory:', e.message);
    return [];
  }
  
  console.log(`📁 Searching ${files.length} memory files...\n`);
  
  // Search each file
  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileName = path.relative(MEMORY_DIR, filePath);
      
      // Split into sections
      const sections = content.split(/\n(?=#+\s)/);
      
      for (const section of sections) {
        const score = scoreRelevance(section, query);
        if (score > 0) {
          results.push({
            file: fileName,
            score,
            content: section.trim(),
            preview: section.split('\n').slice(0, 3).join(' ').substring(0, 200)
          });
        }
      }
    } catch (e) {
      // Skip files that can't be read
    }
  }
  
  // Sort by relevance score
  results.sort((a, b) => b.score - a.score);
  
  return results.slice(0, limit);
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'search') {
    const query = args.slice(1).join(' ');
    if (!query) {
      console.log('Usage: node smart-memory-search.cjs search <query>');
      process.exit(1);
    }
    
    const results = await searchMemories(query);
    
    if (results.length === 0) {
      console.log('❌ No results found.\n');
      console.log('💡 Try different keywords or check if memories are indexed.');
    } else {
      console.log(`✅ Found ${results.length} results:\n`);
      
      results.forEach((r, i) => {
        const relevance = Math.min(100, Math.round(r.score / 10));
        const relevanceBar = '█'.repeat(Math.round(relevance / 10)) + '░'.repeat(10 - Math.round(relevance / 10));
        
        console.log(`${i + 1}. 📄 ${r.file}`);
        console.log(`   Relevance: [${relevanceBar}] ${relevance}%`);
        console.log(`   ${r.preview}...\n`);
      });
    }
    
  } else {
    console.log(`
🧠 Smart Memory Search

Usage:
  node smart-memory-search.cjs search <query>  # Search memories

Examples:
  node smart-memory-search.cjs search "ESP32"
  node smart-memory-search.cjs search "Arizona flight"
  node smart-memory-search.cjs search "what did we decide about cameras"

Features:
  ✓ Keyword matching with relevance scoring
  ✓ Section header priority
  ✓ Cross-file search
  ✓ Smart preview generation
    `);
  }
}

main().catch(console.error);

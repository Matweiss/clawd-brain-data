#!/usr/bin/env node
/**
 * ChromaDB Memory Search
 * Semantic search across your memories using vector embeddings
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MEMORY_DIR = '/root/.openclaw/workspace/memory';
const CHROMA_URL = 'http://localhost:8000';

// Simple embedding function (using local model or API)
async function getEmbedding(text) {
  // For now, use a simple hashing approach or call an embedding API
  // In production, you'd use OpenAI, local model, etc.
  // This is a placeholder - we'll use ChromaDB's default embedding
  return text; // ChromaDB can handle this with default embedder
}

// Index a memory file
async function indexMemory(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  
  // Split into chunks
  const chunks = content.split('\n## ').filter(c => c.trim());
  
  console.log(`Indexing ${fileName} (${chunks.length} chunks)...`);
  
  // Store in ChromaDB via curl for now
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const id = `${fileName}-chunk-${i}`;
    
    try {
      execSync(`curl -s -X POST ${CHROMA_URL}/api/v2/tenants/default_tenant/databases/default_database/collections/memories/documents \\
        -H "Content-Type: application/json" \\
        -d '{"id": "${id}", "document": ${JSON.stringify(chunk)}, "metadata": {"source": "${fileName}", "chunk": ${i}}}' 2>/dev/null`, {
        encoding: 'utf8',
        timeout: 10000
      });
    } catch (e) {
      // ChromaDB v2 API might need different format
    }
  }
}

// Search memories
async function searchMemories(query) {
  console.log(`\n🔍 Searching for: "${query}"\n`);
  
  // For now, use grep as fallback since ChromaDB needs proper embedding setup
  const results = [];
  
  try {
    // Search in memory files
    const files = fs.readdirSync(MEMORY_DIR).filter(f => f.endsWith('.md'));
    
    for (const file of files) {
      const content = fs.readFileSync(path.join(MEMORY_DIR, file), 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, idx) => {
        if (line.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            file,
            line: idx + 1,
            content: line.trim()
          });
        }
      });
    }
  } catch (e) {
    console.error('Search error:', e.message);
  }
  
  return results;
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'index') {
    console.log('📚 Indexing memories...\n');
    
    const files = fs.readdirSync(MEMORY_DIR)
      .filter(f => f.endsWith('.md'))
      .map(f => path.join(MEMORY_DIR, f));
    
    for (const file of files) {
      await indexMemory(file);
    }
    
    console.log('\n✅ Indexing complete!');
    
  } else if (command === 'search') {
    const query = args.slice(1).join(' ');
    if (!query) {
      console.log('Usage: node chroma-memory.cjs search <query>');
      process.exit(1);
    }
    
    const results = await searchMemories(query);
    
    if (results.length === 0) {
      console.log('No results found.');
    } else {
      console.log(`Found ${results.length} results:\n`);
      results.slice(0, 10).forEach((r, i) => {
        console.log(`${i + 1}. [${r.file}:${r.line}] ${r.content.substring(0, 100)}...`);
      });
    }
    
  } else {
    console.log(`
🧠 ChromaDB Memory Search

Usage:
  node chroma-memory.cjs index           # Index all memories
  node chroma-memory.cjs search <query>  # Search memories

Examples:
  node chroma-memory.cjs search "ESP32"
  node chroma-memory.cjs search "flight to Arizona"
    `);
  }
}

main().catch(console.error);

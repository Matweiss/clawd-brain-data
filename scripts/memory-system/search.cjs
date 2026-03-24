#!/usr/bin/env node
/**
 * /search - Unified memory search
 * Searches: ChromaDB (semantic) + Files (exact) + LCM (recent context)
 */

const { execSync } = require('child_process');

const query = process.argv.slice(2).join(' ');

if (!query) {
  console.log(`
🔍 Unified Memory Search

Usage: /search <your query>

Examples:
  /search ESP32 placement
  /search Arizona flight  
  /search Sarah interview

Searches across:
  • ChromaDB (semantic/vector search)
  • Memory files (exact matches)
  • Recent context (LCM summaries)
`);
  process.exit(0);
}

console.log(`\n🔍 Searching: "${query}"\n`);

// 1. ChromaDB Semantic Search
console.log('━'.repeat(50));
console.log('🧠 ChromaDB (Semantic)');
console.log('━'.repeat(50));
try {
  const chromaResults = execSync(
    `python3 /root/.openclaw/workspace/memory/scripts/chroma_full.py search "${query}" 2>&1 | tail -30`,
    { encoding: 'utf8', timeout: 10000 }
  );
  console.log(chromaResults);
} catch (e) {
  console.log('  (ChromaDB not available or error)');
}

// 2. File Search (exact matches)
console.log('━'.repeat(50));
console.log('📁 File Search (Exact)');
console.log('━'.repeat(50));
try {
  const fileResults = execSync(
    `grep -r -i "${query}" /root/.openclaw/workspace/memory/*.md /root/.openclaw/workspace/memory/**/*.md 2>/dev/null | head -10`,
    { encoding: 'utf8', timeout: 5000 }
  );
  if (fileResults.trim()) {
    fileResults.split('\n').slice(0, 5).forEach(line => {
      if (line) {
        const [file, ...content] = line.split(':');
        const shortFile = file.replace('/root/.openclaw/workspace/memory/', '');
        console.log(`  📄 ${shortFile}`);
        console.log(`     ${content.join(':').substring(0, 80)}...\n`);
      }
    });
  } else {
    console.log('  No exact matches found.\n');
  }
} catch (e) {
  console.log('  (No file matches)\n');
}

console.log('━'.repeat(50));
console.log('✅ Search complete');
console.log('━'.repeat(50));
console.log(`\n💡 Tip: For more ChromaDB results, run:`);
console.log(`   python3 memory/scripts/chroma_full.py search "${query}"`);
console.log();

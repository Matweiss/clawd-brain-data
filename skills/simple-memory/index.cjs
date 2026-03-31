#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const STORE = path.join(process.env.HOME, '.openclaw', 'workspace', 'memory', 'store', 'memories.jsonl');

function ensureStore() {
fs.mkdirSync(path.dirname(STORE), { recursive: true });
if (!fs.existsSync(STORE)) fs.writeFileSync(STORE, '');
}

function addMemory(content, metadata = {}) {
ensureStore();
const row = {
id: `mem-${Date.now()}`,
content,
metadata,
created_at: new Date().toISOString()
};
fs.appendFileSync(STORE, JSON.stringify(row) + '\n');
return row;
}

function searchMemory(query, limit = 5) {
ensureStore();
const q = String(query || '').toLowerCase().trim();
const lines = fs.readFileSync(STORE, 'utf8').split('\n').filter(Boolean);

const rows = lines.map(line => {
try { return JSON.parse(line); } catch { return null; }
}).filter(Boolean);

const scored = rows.map(row => {
const text = `${row.content} ${JSON.stringify(row.metadata || {})}`.toLowerCase();
let score = 0;
if (text.includes(q)) score += 10;

const words = q.split(/\s+/).filter(Boolean);
for (const w of words) {
if (text.includes(w)) score += 1;
}

return { ...row, score };
}).filter(r => r.score > 0)
.sort((a, b) => b.score - a.score || String(b.created_at).localeCompare(String(a.created_at)))
.slice(0, limit);

return { query, count: scored.length, results: scored };
}

function main() {
const [cmd, ...args] = process.argv.slice(2);

if (cmd === 'add') {
const content = args.join(' ').trim();
if (!content) {
console.error(JSON.stringify({ error: 'Missing content' }, null, 2));
process.exit(1);
}
const row = addMemory(content, { source: 'cli' });
console.log(JSON.stringify(row, null, 2));
return;
}

if (cmd === 'search') {
const query = args.join(' ').trim();
if (!query) {
console.error(JSON.stringify({ error: 'Missing query' }, null, 2));
process.exit(1);
}
console.log(JSON.stringify(searchMemory(query, 5), null, 2));
return;
}

console.error('Usage:');
console.error(' node index.cjs add "memory text"');
console.error(' node index.cjs search "query"');
process.exit(1);
}

main();

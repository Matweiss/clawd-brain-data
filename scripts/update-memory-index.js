#!/usr/bin/env node
/**
 * Update memory index
 * Run this after adding/modifying memory files to regenerate INDEX.md
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(__dirname, '..', 'memory');
const INDEX_FILE = path.join(MEMORY_DIR, 'INDEX.md');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };
  
  const frontmatter = {};
  match[1].split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      frontmatter[key.trim()] = valueParts.join(':').trim();
    }
  });
  
  return { frontmatter, body: match[2] };
}

function getFiles(dir, type) {
  const dirPath = path.join(MEMORY_DIR, dir);
  if (!fs.existsSync(dirPath)) return [];
  
  return fs.readdirSync(dirPath)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const content = fs.readFileSync(path.join(dirPath, f), 'utf8');
      const { frontmatter } = parseFrontmatter(content);
      const title = content.match(/^# (.+)$/m)?.[1] || f.replace('.md', '');
      return {
        file: f,
        title,
        ...frontmatter,
        path: `./${dir}/${f}`
      };
    })
    .sort((a, b) => (b.created || '').localeCompare(a.created || ''));
}

function generateIndex() {
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' PT';
  
  const contextFiles = getFiles('context');
  const projectFiles = getFiles('projects');
  const decisionFiles = getFiles('decisions');
  const logFiles = getFiles('logs');

  let index = `---
type: index
created: ${now}
updated: ${now}
---

# Memory Index

Auto-generated manifest of all memory files.

## Context (Core)
| File | Description | Updated |
|------|-------------|---------|
`;

  contextFiles.forEach(f => {
    index += `| [${f.file}](${f.path}) | ${f.title} | ${f.updated || f.created || 'unknown'} |\n`;
  });

  index += `
## Projects
| File | Status | Description |
|------|--------|-------------|
`;
  if (projectFiles.length === 0) {
    index += '| *(none yet)* | | |\n';
  } else {
    projectFiles.forEach(f => {
      index += `| [${f.file}](${f.path}) | ${f.status || 'unknown'} | ${f.title} |\n`;
    });
  }

  index += `
## Decisions
| File | Date | Topic |
|------|------|-------|
`;
  if (decisionFiles.length === 0) {
    index += '| *(none yet)* | | |\n';
  } else {
    decisionFiles.forEach(f => {
      index += `| [${f.file}](${f.path}) | ${f.created?.split(' ')[0] || 'unknown'} | ${f.title} |\n`;
    });
  }

  index += `
## Logs
| File | Date | Tags |
|------|------|------|
`;
  logFiles.forEach(f => {
    const tags = f.tags ? f.tags.replace(/[\[\]]/g, '') : 'none';
    index += `| [${f.file}](${f.path}) | ${f.created?.split(' ')[0] || 'unknown'} | ${tags} |\n`;
  });

  index += `
---
*To update this index: \`node scripts/update-memory-index.js\`*
`;

  fs.writeFileSync(INDEX_FILE, index);
  console.log('✅ INDEX.md updated');
}

generateIndex();

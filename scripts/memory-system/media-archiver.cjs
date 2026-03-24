#!/usr/bin/env node
/**
 * Clawd Memory - Media Archiver
 * Archives media files with descriptions and metadata
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = process.env.MEMORY_DIR || '/root/.openclaw/workspace/memory';
const MEDIA_DIR = path.join(MEMORY_DIR, 'archive', 'media');
const INDEX_FILE = path.join(MEMORY_DIR, 'media-archive-index.md');

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
  return new Date().toISOString().split('T')[0];
}

function archiveMedia(sourcePath, description, context = {}) {
  ensureDir(MEDIA_DIR);
  
  const filename = path.basename(sourcePath);
  const ext = path.extname(filename);
  const baseName = path.basename(filename, ext);
  const timestamp = getTimestamp();
  const archiveName = `${timestamp}-${slugify(description.substring(0, 30))}${ext}`;
  const archivePath = path.join(MEDIA_DIR, archiveName);
  
  // Copy file
  fs.copyFileSync(sourcePath, archivePath);
  
  // Update index
  const indexEntry = `
### ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}
- **File:** \`${archiveName}\`
- **Archived:** ${timestamp}
- **Original:** \`${filename}\`
- **Description:** ${description}
${context.project ? `- **Project:** ${context.project}` : ''}
${context.room ? `- **Room:** ${context.room}` : ''}
- **Full Path:** \`memory/archive/media/${archiveName}\`
`;

  let indexContent = '';
  if (fs.existsSync(INDEX_FILE)) {
    indexContent = fs.readFileSync(INDEX_FILE, 'utf8');
  } else {
    indexContent = `# Media Archive Index\n\nGenerated: ${timestamp}\n\n## Archive Location\n\`memory/archive/media/\`\n`;
  }
  
  // Add entry after the header
  const lines = indexContent.split('\n');
  const headerEnd = lines.findIndex(l => l.startsWith('## ')) + 2;
  lines.splice(headerEnd, 0, indexEntry);
  
  fs.writeFileSync(INDEX_FILE, lines.join('\n'));
  
  return {
    archived: true,
    path: archivePath,
    name: archiveName,
    description
  };
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'archive' && args[1] && args[2]) {
    const result = archiveMedia(args[1], args[2], {
      project: args[3],
      room: args[4]
    });
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('Usage: node media-archiver.js archive <source-path> "description" [project] [room]');
  }
}

module.exports = { archiveMedia };

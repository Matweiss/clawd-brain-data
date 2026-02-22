#!/usr/bin/env node

/**
 * Generate complete workspace backup as ZIP
 * Usage: node generate-backup-zip.js [output-path]
 * 
 * Creates a downloadable ZIP of entire workspace minus node_modules, .git, etc.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKSPACE = '/data/.openclaw/workspace';
const DEFAULT_OUTPUT = `${WORKSPACE}/backups`;

// Files/folders to include in backup
const INCLUDE_PATTERNS = [
  'memory/**/*.md',
  'projects/**/*',
  'configs/**/*',
  'scripts/**/*',
  'MEMORY.md',
  'USER.md',
  'AGENTS.md',
  'SOUL.md',
  'TOOLS.md',
  'HEARTBEAT.md',
  'BOOTSTRAP.md',
  'IDENTITY.md',
  '*.md',
];

// Files/folders to exclude
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.env',
  '.env.local',
  '*.log',
  'backups',
];

async function generateBackup() {
  const outputDir = process.argv[2] || DEFAULT_OUTPUT;
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const filename = `clawd-workspace-backup-${timestamp}.zip`;
  const filepath = path.join(outputDir, filename);

  try {
    // Create output directory if needed
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`📦 Generating backup...`);
    console.log(`   Workspace: ${WORKSPACE}`);
    console.log(`   Output: ${filepath}`);

    // Build exclude list for zip command
    const excludeArgs = EXCLUDE_PATTERNS.map(p => `-x "${p}/*" "${p}"`).join(' ');

    // Generate zip (excluding large/sensitive files)
    const command = `cd ${WORKSPACE} && zip -r -q "${filepath}" . ${excludeArgs}`;
    
    execSync(command, { stdio: 'inherit' });

    // Get file size
    const stats = fs.statSync(filepath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`✅ Backup created successfully!`);
    console.log(`   File: ${filename}`);
    console.log(`   Size: ${sizeMB} MB`);
    console.log(`   Path: ${filepath}`);

    // Return JSON for API consumption
    console.log(JSON.stringify({
      success: true,
      filename,
      filepath,
      size: stats.size,
      timestamp: new Date().toISOString(),
    }));

    process.exit(0);
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    console.log(JSON.stringify({
      success: false,
      error: error.message,
    }));
    process.exit(1);
  }
}

generateBackup();

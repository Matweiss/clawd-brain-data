#!/usr/bin/env node

/**
 * Generate complete workspace backup as TAR.GZ
 * Usage: node generate-backup-zip.js [output-path]
 * 
 * Creates a downloadable compressed archive of entire workspace minus node_modules, .git, etc.
 * Returns .tar.gz format for maximum compatibility across systems.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKSPACE = '/data/.openclaw/workspace';
const DEFAULT_OUTPUT = `${WORKSPACE}/backups`;

// Files/folders to exclude from backup
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
  'clawd-command',     // Skip the large command-center project
  'clawd-command-center', // Skip the duplicate
];

async function generateBackup() {
  const outputDir = process.argv[2] || DEFAULT_OUTPUT;
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const filename = `clawd-workspace-backup-${timestamp}.tar.gz`;
  const filepath = path.join(outputDir, filename);

  try {
    // Create output directory if needed
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`📦 Generating backup...`);
    console.log(`   Workspace: ${WORKSPACE}`);
    console.log(`   Output: ${filepath}`);

    // Build exclude list for tar command
    const excludeArgs = EXCLUDE_PATTERNS
      .map(p => `--exclude='${p}'`)
      .join(' ');

    // Generate tar.gz (excluding large/sensitive files)
    // Using tar with gzip compression for better compatibility
    const command = `cd ${WORKSPACE} && tar ${excludeArgs} -czf "${filepath}" .`;
    
    execSync(command, { stdio: 'pipe', encoding: 'utf-8' });

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

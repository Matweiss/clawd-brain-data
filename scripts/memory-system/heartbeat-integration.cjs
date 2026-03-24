#!/usr/bin/env node
/**
 * Heartbeat Integration for Memory System
 * 
 * Run this during heartbeats to:
 * - Check for stale projects
 * - Generate weekly digest if it's Monday
 * - Run proactive reminders
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(process.env.HOME || '/root', '.openclaw/workspace/memory');
const LOG_FILE = path.join(MEMORY_DIR, 'logs/heartbeat-runs.json');

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function ensureLogsDir() {
  const logsDir = path.dirname(LOG_FILE);
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

function loadHeartbeatLog() {
  if (fs.existsSync(LOG_FILE)) {
    return JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
  }
  return { runs: [], lastDigestDate: null };
}

function saveHeartbeatLog(log) {
  ensureLogsDir();
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
}

function shouldRunDigest(log) {
  const today = new Date();
  const isMonday = today.getDay() === 1; // 1 = Monday
  const todayStr = today.toISOString().split('T')[0];
  
  return isMonday && log.lastDigestDate !== todayStr;
}

function runWeeklyDigest() {
  log('Running weekly digest...');
  try {
    execSync('node scripts/weekly-digest.cjs', { 
      cwd: MEMORY_DIR,
      stdio: 'inherit'
    });
    return true;
  } catch (e) {
    log(`Weekly digest failed: ${e.message}`);
    return false;
  }
}

function runProactiveReminders() {
  log('Checking for proactive reminders...');
  try {
    const result = execSync('node scripts/proactive-reminders.cjs check', { 
      cwd: MEMORY_DIR,
      encoding: 'utf-8'
    });
    
    const reminders = JSON.parse(result);
    if (reminders.length > 0) {
      log(`Found ${reminders.length} reminder(s):`);
      reminders.forEach(r => log(`  - ${r.type}: ${r.message}`));
      return reminders;
    } else {
      log('No reminders needed');
      return [];
    }
  } catch (e) {
    log(`Proactive reminders check failed: ${e.message}`);
    return [];
  }
}

function checkStaleProjects() {
  log('Checking for stale projects...');
  try {
    const projectsDir = path.join(MEMORY_DIR, 'archive/projects');
    if (!fs.existsSync(projectsDir)) return [];
    
    const files = fs.readdirSync(projectsDir).filter(f => f.endsWith('.md'));
    const staleProjects = [];
    const now = new Date();
    
    files.forEach(file => {
      const content = fs.readFileSync(path.join(projectsDir, file), 'utf-8');
      const updatedMatch = content.match(/\*\*Updated:\*\* (\d{4}-\d{2}-\d{2})/);
      const statusMatch = content.match(/\*\*Status:\*\* (\w+)/);
      const nameMatch = content.match(/# (.+)/);
      
      if (updatedMatch && statusMatch && nameMatch) {
        const updatedDate = new Date(updatedMatch[1]);
        const status = statusMatch[1].toLowerCase();
        const daysStale = Math.floor((now - updatedDate) / (1000 * 60 * 60 * 24));
        
        if (daysStale >= 7 && status === 'active') {
          staleProjects.push({
            name: nameMatch[1],
            file: file,
            daysStale,
            lastUpdated: updatedMatch[1]
          });
        }
      }
    });
    
    return staleProjects;
  } catch (e) {
    log(`Stale project check failed: ${e.message}`);
    return [];
  }
}

async function main() {
  log('Starting heartbeat memory integration...');
  
  const log = loadHeartbeatLog();
  const results = {
    timestamp: new Date().toISOString(),
    digestRun: false,
    reminders: [],
    staleProjects: []
  };
  
  // Check if we should run weekly digest (Mondays)
  if (shouldRunDigest(log)) {
    results.digestRun = runWeeklyDigest();
    if (results.digestRun) {
      log.lastDigestDate = new Date().toISOString().split('T')[0];
    }
  }
  
  // Run proactive reminders
  results.reminders = runProactiveReminders();
  
  // Check for stale projects
  results.staleProjects = checkStaleProjects();
  if (results.staleProjects.length > 0) {
    log(`⚠️ Found ${results.staleProjects.length} stale project(s):`);
    results.staleProjects.forEach(p => {
      log(`  - ${p.name} (${p.daysStale} days stale)`);
    });
  }
  
  // Save run log
  log.runs.push(results);
  if (log.runs.length > 100) log.runs.shift(); // Keep last 100 runs
  saveHeartbeatLog(log);
  
  // Output results for parent process
  console.log('\n--- HEARTBEAT RESULTS ---');
  console.log(JSON.stringify(results, null, 2));
  
  return results;
}

main().catch(e => {
  console.error('Heartbeat integration failed:', e);
  process.exit(1);
});

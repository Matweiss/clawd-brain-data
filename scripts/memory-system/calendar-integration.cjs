#!/usr/bin/env node
/**
 * Calendar Integration for Memory System
 * Links projects to calendar events and deadlines
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MEMORY_DIR = path.join(process.env.HOME || '/root', '.openclaw/workspace/memory');
const CALENDAR_FILE = path.join(MEMORY_DIR, 'calendar-integration.json');

function loadCalendarData() {
  if (fs.existsSync(CALENDAR_FILE)) {
    return JSON.parse(fs.readFileSync(CALENDAR_FILE, 'utf-8'));
  }
  return { events: [], projectLinks: [] };
}

function saveCalendarData(data) {
  fs.writeFileSync(CALENDAR_FILE, JSON.stringify(data, null, 2));
}

function parseNaturalDate(text) {
  const today = new Date();
  const patterns = [
    { regex: /(\d{4}-\d{2}-\d{2})/, type: 'iso' },
    { regex: /(today|tonight)/i, type: 'today' },
    { regex: /tomorrow/i, type: 'tomorrow' },
    { regex: /next (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i, type: 'next-day' },
    { regex: /in (\d+) (day|days)/i, type: 'days-from-now' },
    { regex: /this (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i, type: 'this-day' }
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern.regex);
    if (match) {
      switch (pattern.type) {
        case 'iso':
          return match[1];
        case 'today':
          return today.toISOString().split('T')[0];
        case 'tomorrow':
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          return tomorrow.toISOString().split('T')[0];
        case 'days-from-now':
          const future = new Date(today);
          future.setDate(future.getDate() + parseInt(match[1]));
          return future.toISOString().split('T')[0];
        case 'next-day':
        case 'this-day':
          const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const targetDay = days.indexOf(match[1].toLowerCase());
          const target = new Date(today);
          let daysUntil = targetDay - today.getDay();
          if (daysUntil <= 0 && pattern.type === 'next-day') daysUntil += 7;
          if (daysUntil < 0 && pattern.type === 'this-day') daysUntil += 7;
          target.setDate(target.getDate() + daysUntil);
          return target.toISOString().split('T')[0];
      }
    }
  }
  return null;
}

function linkProjectToCalendar(projectSlug, eventDetails) {
  const data = loadCalendarData();
  
  const link = {
    id: Date.now().toString(),
    projectSlug,
    eventTitle: eventDetails.title,
    eventDate: eventDetails.date,
    eventTime: eventDetails.time || null,
    createdAt: new Date().toISOString()
  };
  
  data.projectLinks.push(link);
  saveCalendarData(data);
  
  console.log(`✅ Linked project "${projectSlug}" to calendar event: ${eventDetails.title} on ${eventDetails.date}`);
  return link;
}

function getUpcomingDeadlines(days = 7) {
  const data = loadCalendarData();
  const now = new Date();
  const future = new Date(now);
  future.setDate(future.getDate() + days);
  
  return data.projectLinks.filter(link => {
    const eventDate = new Date(link.eventDate);
    return eventDate >= now && eventDate <= future;
  }).sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
}

function extractDeadlinesFromText(text) {
  const deadlines = [];
  
  // Pattern: "by [date]" or "deadline [date]" or "due [date]"
  const patterns = [
    /(?:by|due|deadline|before)\s+(.+?)(?:\.|$|,|\s+(?:we|I|the))/i,
    /(?:complete|finish|done)\s+(?:by|before)\s+(.+?)(?:\.|$|,)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const date = parseNaturalDate(match[1]);
      if (date) {
        deadlines.push({
          date,
          context: match[0],
          original: match[1]
        });
      }
    }
  }
  
  return deadlines;
}

function listCalendarLinks() {
  const data = loadCalendarData();
  const projectsDir = path.join(MEMORY_DIR, 'archive/projects');
  
  console.log('\n📅 Project Calendar Links\n');
  
  if (data.projectLinks.length === 0) {
    console.log('No calendar links found.');
    return;
  }
  
  data.projectLinks.forEach(link => {
    const projectFile = path.join(projectsDir, `${link.projectSlug}.md`);
    let projectName = link.projectSlug;
    
    if (fs.existsSync(projectFile)) {
      const content = fs.readFileSync(projectFile, 'utf-8');
      const nameMatch = content.match(/# (.+)/);
      if (nameMatch) projectName = nameMatch[1];
    }
    
    const daysUntil = Math.ceil((new Date(link.eventDate) - new Date()) / (1000 * 60 * 60 * 24));
    const urgency = daysUntil <= 2 ? '🔴' : daysUntil <= 7 ? '🟡' : '🟢';
    
    console.log(`${urgency} ${projectName}`);
    console.log(`   Event: ${link.eventTitle}`);
    console.log(`   Date: ${link.eventDate}${daysUntil > 0 ? ` (${daysUntil} days)` : ''}`);
    console.log();
  });
}

// CLI Interface
const command = process.argv[2];

switch (command) {
  case 'link':
    const [slug, title, dateStr] = process.argv.slice(3);
    if (!slug || !title || !dateStr) {
      console.log('Usage: calendar-integration.cjs link <project-slug> "Event Title" <YYYY-MM-DD>');
      process.exit(1);
    }
    linkProjectToCalendar(slug, { title, date: dateStr });
    break;
    
  case 'deadlines':
    const days = parseInt(process.argv[3]) || 7;
    const upcoming = getUpcomingDeadlines(days);
    
    console.log(`\n📅 Upcoming Deadlines (next ${days} days)\n`);
    
    if (upcoming.length === 0) {
      console.log('No upcoming deadlines.');
    } else {
      upcoming.forEach(d => {
        const daysUntil = Math.ceil((new Date(d.eventDate) - new Date()) / (1000 * 60 * 60 * 24));
        console.log(`• ${d.eventTitle} - ${d.eventDate} (${daysUntil} days)`);
      });
    }
    break;
    
  case 'list':
    listCalendarLinks();
    break;
    
  case 'extract':
    const text = process.argv.slice(3).join(' ');
    const deadlines = extractDeadlinesFromText(text);
    
    if (deadlines.length > 0) {
      console.log('\n🎯 Detected deadlines:\n');
      deadlines.forEach(d => {
        console.log(`• ${d.date} - "${d.context}"`);
      });
    } else {
      console.log('No deadlines detected in text.');
    }
    break;
    
  default:
    console.log('📅 Memory-Calendar Integration\n');
    console.log('Commands:');
    console.log('  link <project-slug> "Event Title" <YYYY-MM-DD>  Link project to calendar date');
    console.log('  deadlines [days]                                Show upcoming deadlines (default: 7)');
    console.log('  list                                            List all calendar links');
    console.log('  extract "<text>"                                Extract deadlines from text');
    console.log();
    console.log('Examples:');
    console.log('  calendar-integration.cjs link esp32-optimization "ESP32 Setup" 2026-03-25');
    console.log('  calendar-integration.cjs extract "Complete this by Friday"');
}

module.exports = {
  linkProjectToCalendar,
  getUpcomingDeadlines,
  extractDeadlinesFromText,
  parseNaturalDate
};

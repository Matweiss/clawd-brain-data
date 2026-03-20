#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const workspace = '/root/.openclaw/workspace';
const stateFile = path.join(workspace, 'memory', 'memory-assist-state.json');
const archiveFile = path.join(workspace, 'memory', 'memory-assist-archive.json');

const SECTION_LIMITS = {
  activeProjects: 20,
  whereWeLeftOff: 40,
  sopTruths: 40,
  notes: 80,
};

const validSections = Object.keys(SECTION_LIMITS);

function nowIso() {
  return new Date().toISOString();
}

function loadJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function normalizeEntry(entry, fallbackPriority = 'this_week') {
  if (typeof entry === 'string') {
    const text = entry.trim();
    if (!text) return null;
    return { text, priority: fallbackPriority, createdAt: nowIso() };
  }

  if (entry && typeof entry === 'object') {
    const text = String(entry.text || '').trim();
    if (!text) return null;
    return {
      text,
      priority: String(entry.priority || fallbackPriority),
      createdAt: String(entry.createdAt || nowIso()),
      updatedAt: String(entry.updatedAt || nowIso()),
    };
  }

  return null;
}

function dedupeAndPrune(arr, section) {
  const limit = SECTION_LIMITS[section] || 30;
  const seen = new Set();
  const out = [];

  for (const raw of Array.isArray(arr) ? arr : []) {
    const e = normalizeEntry(raw);
    if (!e) continue;
    const key = e.text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
    if (out.length >= limit) break;
  }

  return out;
}

function loadState() {
  const fallback = {
    updatedAt: null,
    activeProjects: [],
    whereWeLeftOff: [],
    sopTruths: [],
    notes: [],
  };
  const raw = loadJson(stateFile, fallback);
  const state = { ...fallback, ...raw };

  for (const section of validSections) {
    state[section] = dedupeAndPrune(state[section], section);
  }

  return state;
}

function saveState(state) {
  for (const section of validSections) {
    state[section] = dedupeAndPrune(state[section], section);
  }
  state.updatedAt = nowIso();
  fs.mkdirSync(path.dirname(stateFile), { recursive: true });
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    args[key] = val;
  }
  return args;
}

function sectionLines(title, items, max) {
  const out = [title];
  const rows = (Array.isArray(items) ? items : []).slice(0, max);
  if (!rows.length) {
    out.push('- (none)');
    return out;
  }

  for (const e of rows) {
    const priority = e.priority ? ` [${e.priority}]` : '';
    out.push(`- ${e.text}${priority}`);
  }
  return out;
}

function digest(state, max = 5) {
  const out = [];
  out.push(`Updated: ${state.updatedAt || 'unknown'}`);
  out.push('');
  out.push(...sectionLines('Active Projects:', state.activeProjects, max));
  out.push('');
  out.push(...sectionLines('Where We Left Off:', state.whereWeLeftOff, max));
  out.push('');
  out.push(...sectionLines('SOP/Infra Truths:', state.sopTruths, max));
  out.push('');
  out.push(...sectionLines('Notes:', state.notes, max));
  return out.join('\n');
}

function addToSection(state, section, text, priority = 'this_week') {
  if (!validSections.includes(section)) {
    throw new Error(`Invalid section: ${section}`);
  }
  const entry = normalizeEntry({ text, priority, createdAt: nowIso(), updatedAt: nowIso() });
  if (!entry) return;
  const existing = Array.isArray(state[section]) ? state[section] : [];
  const filtered = existing.filter(e => String(e.text || '').trim().toLowerCase() !== entry.text.toLowerCase());
  state[section] = [entry, ...filtered];
}

function weeklyPrune(state, staleDays = 14) {
  const cutoff = Date.now() - staleDays * 24 * 60 * 60 * 1000;
  const archive = loadJson(archiveFile, { archivedAt: null, items: [] });

  const keepPriority = new Set(['now', 'this_week']);
  const sections = ['whereWeLeftOff', 'notes'];
  let moved = 0;

  for (const section of sections) {
    const kept = [];
    for (const raw of state[section] || []) {
      const e = normalizeEntry(raw);
      if (!e) continue;
      const ts = Date.parse(e.updatedAt || e.createdAt || 0);
      const isStale = Number.isFinite(ts) ? ts < cutoff : false;
      if (isStale && !keepPriority.has(String(e.priority || ''))) {
        archive.items.push({ ...e, section, archivedAt: nowIso() });
        moved += 1;
      } else {
        kept.push(e);
      }
    }
    state[section] = kept;
  }

  archive.archivedAt = nowIso();
  fs.mkdirSync(path.dirname(archiveFile), { recursive: true });
  fs.writeFileSync(archiveFile, JSON.stringify(archive, null, 2));

  return { moved, archiveFile };
}

const [cmd, ...rest] = process.argv.slice(2);
const args = parseArgs(rest);
const state = loadState();

if (!cmd || !['digest', 'add', 'set', 'weekly-prune'].includes(cmd)) {
  console.log('Usage:');
  console.log('  node scripts/memory-assist.cjs digest [--max 5]');
  console.log('  node scripts/memory-assist.cjs add --section activeProjects --text "..." [--priority now|this_week|parking_lot]');
  console.log('  node scripts/memory-assist.cjs set --section activeProjects --json "[{\"text\":\"a\",\"priority\":\"now\"}]"');
  console.log('  node scripts/memory-assist.cjs weekly-prune [--days 14]');
  process.exit(1);
}

if (cmd === 'digest') {
  const max = Number.isFinite(Number(args.max)) ? Math.max(1, Math.min(20, Number(args.max))) : 5;
  console.log(digest(state, max));
  process.exit(0);
}

if (cmd === 'add') {
  if (!args.section || !args.text) {
    console.error('Missing --section or --text');
    process.exit(1);
  }
  addToSection(state, String(args.section), String(args.text), String(args.priority || 'this_week'));
  saveState(state);
  console.log(`Added to ${args.section}`);
  process.exit(0);
}

if (cmd === 'set') {
  if (!args.section || !args.json) {
    console.error('Missing --section or --json');
    process.exit(1);
  }
  const section = String(args.section);
  if (!validSections.includes(section)) {
    console.error(`Invalid --section. Use one of: ${validSections.join(', ')}`);
    process.exit(1);
  }
  let parsed;
  try {
    parsed = JSON.parse(String(args.json));
  } catch {
    console.error('Invalid JSON for --json');
    process.exit(1);
  }
  if (!Array.isArray(parsed)) {
    console.error('--json must be an array');
    process.exit(1);
  }
  state[section] = parsed.map(e => normalizeEntry(e)).filter(Boolean);
  saveState(state);
  console.log(`Set ${section} (${state[section].length} items)`);
  process.exit(0);
}

if (cmd === 'weekly-prune') {
  const days = Number.isFinite(Number(args.days)) ? Math.max(1, Math.min(120, Number(args.days))) : 14;
  const result = weeklyPrune(state, days);
  saveState(state);
  console.log(JSON.stringify({ ok: true, days, moved: result.moved, archiveFile: result.archiveFile }, null, 2));
  process.exit(0);
}

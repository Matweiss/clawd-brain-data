#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const workspace = process.env.OPENCLAW_WORKSPACE || path.resolve(__dirname, '..');
const file = path.join(workspace, 'memory', 'memory-assist-state.json');

const LIMITS = {
  activeProjects: 20,
  whereWeLeftOff: 40,
  sopTruths: 40,
  notes: 80,
};

function nowIso() {
  return new Date().toISOString();
}

function load() {
  if (!fs.existsSync(file)) {
    return {
      updatedAt: null,
      activeProjects: [],
      whereWeLeftOff: [],
      sopTruths: [],
      notes: []
    };
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function normalizeEntry(entry, fallbackPriority = 'this_week') {
  if (!entry) return null;
  if (typeof entry === 'string') {
    const text = entry.trim();
    if (!text) return null;
    return { text, priority: fallbackPriority, createdAt: nowIso(), updatedAt: nowIso() };
  }
  if (typeof entry === 'object') {
    const text = String(entry.text || '').trim();
    if (!text) return null;
    return {
      text,
      priority: String(entry.priority || fallbackPriority),
      createdAt: String(entry.createdAt || nowIso()),
      updatedAt: nowIso(),
    };
  }
  return null;
}

function dedupeAndCap(arr, section) {
  const limit = LIMITS[section] || 30;
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

function save(state) {
  for (const section of Object.keys(LIMITS)) {
    state[section] = dedupeAndCap(state[section], section);
  }
  state.updatedAt = nowIso();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(state, null, 2));
}

function upsertTop(state, section, text, priority = 'this_week') {
  const entry = normalizeEntry({ text, priority });
  if (!entry) return;
  const current = Array.isArray(state[section]) ? state[section] : [];
  const filtered = current.filter((x) => {
    const t = typeof x === 'string' ? x : x?.text;
    return String(t || '').trim().toLowerCase() !== entry.text.toLowerCase();
  });
  state[section] = [entry, ...filtered];
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const k = a.slice(2);
    const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    args[k] = v;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const priority = String(args.priority || 'this_week');
const state = load();

if (args.project) upsertTop(state, 'activeProjects', String(args.project), priority);
if (args.leftoff) upsertTop(state, 'whereWeLeftOff', String(args.leftoff), priority);
if (args.truth) upsertTop(state, 'sopTruths', String(args.truth), priority);
if (args.note) upsertTop(state, 'notes', String(args.note), priority);

save(state);

console.log(JSON.stringify({
  ok: true,
  file,
  updatedAt: state.updatedAt,
  priority,
  counts: {
    activeProjects: state.activeProjects.length,
    whereWeLeftOff: state.whereWeLeftOff.length,
    sopTruths: state.sopTruths.length,
    notes: state.notes.length
  }
}, null, 2));
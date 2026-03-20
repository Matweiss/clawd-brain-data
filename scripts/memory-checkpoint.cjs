#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const workspace = '/root/.openclaw/workspace';
const file = path.join(workspace, 'memory', 'memory-assist-state.json');

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

function save(state) {
  state.updatedAt = new Date().toISOString();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(state, null, 2));
}

function uniqPush(arr, value, max = 30) {
  if (!value) return arr;
  const trimmed = String(value).trim();
  if (!trimmed) return arr;
  const next = [trimmed, ...arr.filter(v => String(v).trim() !== trimmed)];
  return next.slice(0, max);
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
const state = load();

if (args.project) state.activeProjects = uniqPush(state.activeProjects || [], args.project, 20);
if (args.leftoff) state.whereWeLeftOff = uniqPush(state.whereWeLeftOff || [], args.leftoff, 40);
if (args.truth) state.sopTruths = uniqPush(state.sopTruths || [], args.truth, 40);
if (args.note) state.notes = uniqPush(state.notes || [], args.note, 60);

save(state);

console.log(JSON.stringify({
  ok: true,
  file,
  updatedAt: state.updatedAt,
  counts: {
    activeProjects: state.activeProjects.length,
    whereWeLeftOff: state.whereWeLeftOff.length,
    sopTruths: state.sopTruths.length,
    notes: state.notes.length
  }
}, null, 2));
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

function digest(state) {
  const top = (arr, n = 5) => (Array.isArray(arr) ? arr.slice(0, n) : []);
  const out = [];
  out.push(`Updated: ${state.updatedAt || 'unknown'}`);
  out.push('');
  out.push('Active Projects:');
  const ap = top(state.activeProjects);
  out.push(...(ap.length ? ap.map(x => `- ${x}`) : ['- (none)']));
  out.push('');
  out.push('Where We Left Off:');
  const ww = top(state.whereWeLeftOff);
  out.push(...(ww.length ? ww.map(x => `- ${x}`) : ['- (none)']));
  out.push('');
  out.push('SOP/Infra Truths:');
  const st = top(state.sopTruths);
  out.push(...(st.length ? st.map(x => `- ${x}`) : ['- (none)']));
  return out.join('\n');
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

const [cmd, ...rest] = process.argv.slice(2);
const args = parseArgs(rest);

if (!cmd || ['digest', 'add', 'set'].indexOf(cmd) === -1) {
  console.log('Usage:');
  console.log('  node scripts/memory-assist.js digest');
  console.log('  node scripts/memory-assist.js add --section activeProjects --text "..."');
  console.log('  node scripts/memory-assist.js set --section activeProjects --json "[\"a\",\"b\"]"');
  process.exit(1);
}

const validSections = ['activeProjects', 'whereWeLeftOff', 'sopTruths', 'notes'];
const state = load();

if (cmd === 'digest') {
  console.log(digest(state));
  process.exit(0);
}

if (!validSections.includes(args.section)) {
  console.error(`Invalid --section. Use one of: ${validSections.join(', ')}`);
  process.exit(1);
}

if (cmd === 'add') {
  if (!args.text || typeof args.text !== 'string') {
    console.error('Missing --text');
    process.exit(1);
  }
  state[args.section] = Array.isArray(state[args.section]) ? state[args.section] : [];
  state[args.section].push(args.text);
  save(state);
  console.log(`Added to ${args.section}`);
  process.exit(0);
}

if (cmd === 'set') {
  if (!args.json || typeof args.json !== 'string') {
    console.error('Missing --json');
    process.exit(1);
  }
  let parsed;
  try {
    parsed = JSON.parse(args.json);
  } catch (e) {
    console.error('Invalid JSON for --json');
    process.exit(1);
  }
  if (!Array.isArray(parsed)) {
    console.error('--json must be a JSON array');
    process.exit(1);
  }
  state[args.section] = parsed;
  save(state);
  console.log(`Set ${args.section} (${parsed.length} items)`);
}
#!/usr/bin/env node
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname));
const script = path.join(ROOT, 'tracker.mjs');
const dbPath = path.join(ROOT, 'data', 'waitlist-intents.json');
const reportDir = path.join(ROOT, 'reports');
const piecePath = path.join(ROOT, 'test-piece.json');

function reset() {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.writeFileSync(dbPath, JSON.stringify({ version: 1, entries: [], alerts: [] }, null, 2) + '\n');
  fs.rmSync(reportDir, { recursive: true, force: true });
}

function run(args) {
  return execFileSync('node', [script, ...args], { encoding: 'utf8' });
}

reset();
run([
  'add-interest',
  '--collector-name', 'Jane Doe',
  '--collector-email', 'jane@example.com',
  '--piece-title', 'Blue Horizon',
  '--piece-id', 'blue-horizon',
  '--medium', 'acrylic',
  '--width', '24',
  '--height', '30',
  '--orientation', 'portrait',
  '--palette', 'blue,gold,white',
  '--subject', 'seascape,horizon',
  '--mood', 'calm,hopeful'
]);
run([
  'add-interest',
  '--collector-name', 'Alex Roe',
  '--collector-email', 'alex@example.com',
  '--piece-title', 'Forest Echo',
  '--medium', 'oil',
  '--width', '20',
  '--height', '20',
  '--orientation', 'square',
  '--palette', 'green,umber',
  '--subject', 'forest,trees',
  '--mood', 'earthy,quiet'
]);
fs.writeFileSync(piecePath, JSON.stringify({
  id: 'new-dawn-study',
  title: 'New Dawn Study',
  medium: 'acrylic',
  widthInches: 24,
  heightInches: 30,
  orientation: 'portrait',
  palette: ['blue', 'gold'],
  subject: ['seascape', 'horizon'],
  mood: ['calm', 'hopeful']
}, null, 2));
const result = JSON.parse(run(['alert-matches', '--piece-file', piecePath, '--min-score', '0.45']));
assert.equal(result.matchCount, 1, 'expected one strong match');
assert.equal(result.matches[0].collector.email, 'jane@example.com');
assert.ok(fs.existsSync(result.reportPath), 'expected report to be generated');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
assert.equal(db.entries.length, 2);
assert.equal(db.alerts.length, 1);
fs.rmSync(piecePath, { force: true });
console.log('waitlist intent tracker tests passed');

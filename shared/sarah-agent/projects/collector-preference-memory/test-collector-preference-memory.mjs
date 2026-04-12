#!/usr/bin/env node
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname));
const script = path.join(ROOT, 'memory.mjs');
const dbPath = path.join(ROOT, 'data', 'collector-preferences.json');
const reportDir = path.join(ROOT, 'reports');
const piecePath = path.join(ROOT, 'test-piece.json');

function reset() {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.writeFileSync(dbPath, JSON.stringify({ version: 1, collectors: [], matchRuns: [] }, null, 2) + '\n');
  fs.rmSync(reportDir, { recursive: true, force: true });
}

function run(args) {
  return execFileSync('node', [script, ...args], { encoding: 'utf8' });
}

reset();
run([
  'upsert-collector',
  '--name', 'Ashley Wall',
  '--email', 'ashley@example.com',
  '--segment', 'VIP',
  '--lifetime-spend', '18420',
  '--first-look', 'yes',
  '--mediums', 'acrylic,mixed-media',
  '--palette', 'pink,gold,blue,bold-color',
  '--themes', 'abstract,floral,statement',
  '--moods', 'energetic,optimistic,lush',
  '--orientations', 'portrait,square',
  '--min-width', '24',
  '--max-width', '48',
  '--min-height', '24',
  '--max-height', '60',
  '--min-price', '2000',
  '--max-price', '8000',
  '--notes', 'VIP, loves high-energy originals.'
]);
run([
  'upsert-collector',
  '--name', 'Jordan Silver',
  '--email', 'jordan@example.com',
  '--segment', 'Repeat',
  '--mediums', 'oil',
  '--palette', 'soft-neutral,green',
  '--themes', 'landscape,quiet',
  '--moods', 'calm,earthy',
  '--orientations', 'landscape,square',
  '--min-width', '12',
  '--max-width', '24',
  '--min-height', '12',
  '--max-height', '24',
  '--min-price', '500',
  '--max-price', '1800'
]);
fs.writeFileSync(piecePath, JSON.stringify({
  id: 'aurora-garden',
  title: 'Aurora Garden',
  medium: 'acrylic',
  widthInches: 30,
  heightInches: 40,
  orientation: 'portrait',
  price: 3200,
  palette: ['pink', 'gold', 'blue', 'bold-color'],
  themes: ['abstract', 'floral', 'statement'],
  moods: ['energetic', 'optimistic', 'lush']
}, null, 2));
const result = JSON.parse(run(['match-piece', '--piece-file', piecePath, '--min-score', '0.45']));
assert.equal(result.matchCount, 1, 'expected one strong buyer match');
assert.equal(result.matches[0].collector.email, 'ashley@example.com');
assert.ok(result.matches[0].reasons.includes('marked for first look'));
assert.ok(fs.existsSync(result.reportPath), 'expected shortlist report');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
assert.equal(db.collectors.length, 2);
assert.equal(db.matchRuns.length, 1);
fs.rmSync(piecePath, { force: true });
console.log('collector preference memory tests passed');

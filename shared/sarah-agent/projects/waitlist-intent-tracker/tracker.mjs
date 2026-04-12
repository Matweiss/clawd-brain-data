#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname));
const DATA_DIR = path.join(ROOT, 'data');
const DB_PATH = path.join(DATA_DIR, 'waitlist-intents.json');
const REPORT_DIR = path.join(ROOT, 'reports');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function ensureDb() {
  ensureDir(DATA_DIR);
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ version: 1, entries: [], alerts: [] }, null, 2) + '\n');
  }
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDb(db) {
  ensureDir(DATA_DIR);
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2) + '\n');
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const args = { _: [] };
  for (let i = 0; i < rest.length; i++) {
    const token = rest[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = rest[i + 1];
      if (!next || next.startsWith('--')) {
        args[key] = true;
      } else {
        args[key] = next;
        i += 1;
      }
    } else {
      args._.push(token);
    }
  }
  return { command, args };
}

function toList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value)
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'item';
}

function normalizePiece(source = {}) {
  return {
    id: source.id || slugify(source.title),
    title: source.title || 'Untitled piece',
    medium: (source.medium || '').toLowerCase(),
    widthInches: source.widthInches ? Number(source.widthInches) : null,
    heightInches: source.heightInches ? Number(source.heightInches) : null,
    orientation: (source.orientation || '').toLowerCase(),
    palette: toList(source.palette),
    subject: toList(source.subject),
    mood: toList(source.mood),
    url: source.url || null,
    imageUrl: source.imageUrl || null,
    notes: source.notes || ''
  };
}

function tokenizeOverlap(a, b) {
  const setA = new Set(toList(a));
  const setB = new Set(toList(b));
  if (!setA.size || !setB.size) return 0;
  let overlap = 0;
  for (const item of setA) {
    if (setB.has(item)) overlap += 1;
  }
  const union = new Set([...setA, ...setB]).size;
  return union ? overlap / union : 0;
}

function sizeScore(w1, h1, w2, h2) {
  if (![w1, h1, w2, h2].every(Boolean)) return 0;
  const area1 = w1 * h1;
  const area2 = w2 * h2;
  const diff = Math.abs(area1 - area2) / Math.max(area1, area2);
  return Math.max(0, 1 - diff);
}

function scoreMatch(preference, piece) {
  const medium = preference.medium && piece.medium ? (preference.medium === piece.medium ? 1 : 0) : 0;
  const orientation = preference.orientation && piece.orientation ? (preference.orientation === piece.orientation ? 1 : 0) : 0;
  const palette = tokenizeOverlap(preference.palette, piece.palette);
  const subject = tokenizeOverlap(preference.subject, piece.subject);
  const mood = tokenizeOverlap(preference.mood, piece.mood);
  const size = sizeScore(preference.widthInches, preference.heightInches, piece.widthInches, piece.heightInches);

  const total =
    medium * 0.25 +
    subject * 0.2 +
    mood * 0.15 +
    palette * 0.15 +
    size * 0.15 +
    orientation * 0.1;

  return {
    total: Number(total.toFixed(3)),
    breakdown: { medium, subject, mood, palette, size, orientation }
  };
}

function addInterest(args) {
  const required = ['collector-name', 'collector-email', 'piece-title'];
  const missing = required.filter((key) => !args[key]);
  if (missing.length) {
    throw new Error(`Missing required flags: ${missing.map((k) => `--${k}`).join(', ')}`);
  }
  const db = readDb();
  const piece = normalizePiece({
    id: args['piece-id'],
    title: args['piece-title'],
    medium: args.medium,
    widthInches: args.width,
    heightInches: args.height,
    orientation: args.orientation,
    palette: args.palette,
    subject: args.subject,
    mood: args.mood,
    url: args['piece-url'],
    imageUrl: args['image-url'],
    notes: args['piece-notes']
  });
  const entry = {
    id: `wli_${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'open',
    collector: {
      name: args['collector-name'],
      email: String(args['collector-email']).toLowerCase(),
      instagram: args.instagram || null,
      notes: args['collector-notes'] || ''
    },
    desiredPiece: piece,
    rawIntent: args.intent || '',
    alertPreferences: {
      allowEmailDraft: args['allow-email-draft'] === 'false' ? false : true,
      allowInstagramDraft: args['allow-instagram-draft'] === 'true'
    }
  };
  db.entries.push(entry);
  writeDb(db);
  console.log(JSON.stringify(entry, null, 2));
}

function loadPieceFromArgs(args) {
  if (args['piece-file']) {
    return normalizePiece(JSON.parse(fs.readFileSync(path.resolve(args['piece-file']), 'utf8')));
  }
  return normalizePiece({
    id: args['piece-id'],
    title: args['piece-title'],
    medium: args.medium,
    widthInches: args.width,
    heightInches: args.height,
    orientation: args.orientation,
    palette: args.palette,
    subject: args.subject,
    mood: args.mood,
    url: args['piece-url'],
    imageUrl: args['image-url'],
    notes: args.notes
  });
}

function buildAlertReport(piece, matches) {
  const lines = [];
  lines.push(`# Waitlist match report: ${piece.title}`);
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## New piece');
  lines.push(`- Title: ${piece.title}`);
  lines.push(`- Medium: ${piece.medium || 'unknown'}`);
  lines.push(`- Size: ${piece.widthInches || '?'} x ${piece.heightInches || '?'} in`);
  lines.push(`- Orientation: ${piece.orientation || 'unknown'}`);
  lines.push(`- Palette: ${piece.palette.join(', ') || 'n/a'}`);
  lines.push(`- Subject: ${piece.subject.join(', ') || 'n/a'}`);
  lines.push(`- Mood: ${piece.mood.join(', ') || 'n/a'}`);
  lines.push('');
  lines.push('## Recommended collector follow-up');
  if (!matches.length) {
    lines.push('No waitlist matches cleared the threshold.');
    return lines.join('\n') + '\n';
  }
  matches.forEach((match, index) => {
    lines.push(`### ${index + 1}. ${match.collector.name} (${match.collector.email})`);
    lines.push(`- Match score: ${match.match.total}`);
    lines.push(`- Missed piece: ${match.desiredPiece.title}`);
    lines.push(`- Why it matched: medium ${match.match.breakdown.medium}, subject ${match.match.breakdown.subject}, mood ${match.match.breakdown.mood}, palette ${match.match.breakdown.palette}, size ${match.match.breakdown.size}, orientation ${match.match.breakdown.orientation}`);
    lines.push(`- Sarah draft note: "You asked about ${match.desiredPiece.title}. I have a new piece coming that feels close in medium, palette, or mood. Want me to send you the preview first?"`);
    lines.push('');
  });
  return lines.join('\n') + '\n';
}

function alertMatches(args) {
  const db = readDb();
  const piece = loadPieceFromArgs(args);
  const threshold = args['min-score'] ? Number(args['min-score']) : 0.45;
  const matches = db.entries
    .filter((entry) => entry.status === 'open')
    .map((entry) => ({ ...entry, match: scoreMatch(entry.desiredPiece, piece) }))
    .filter((entry) => entry.match.total >= threshold)
    .sort((a, b) => b.match.total - a.match.total);

  const alertRecord = {
    id: `alert_${Date.now()}`,
    createdAt: new Date().toISOString(),
    piece,
    threshold,
    matches: matches.map((entry) => ({
      entryId: entry.id,
      collectorEmail: entry.collector.email,
      score: entry.match.total
    }))
  };
  db.alerts.push(alertRecord);
  writeDb(db);

  ensureDir(REPORT_DIR);
  const reportPath = path.join(REPORT_DIR, `${new Date().toISOString().slice(0, 10)}-${slugify(piece.title)}.md`);
  fs.writeFileSync(reportPath, buildAlertReport(piece, matches));

  console.log(JSON.stringify({ piece, threshold, matchCount: matches.length, reportPath, matches }, null, 2));
}

function listOpen() {
  const db = readDb();
  console.log(JSON.stringify(db.entries.filter((entry) => entry.status === 'open'), null, 2));
}

function usage() {
  console.log(`Usage:
  node tracker.mjs add-interest --collector-name "Name" --collector-email "email@example.com" --piece-title "Sold Piece" [--medium acrylic] [--width 24] [--height 30] [--palette blue,gold] [--subject seascape] [--mood calm]
  node tracker.mjs alert-matches --piece-file ./new-piece.json [--min-score 0.45]
  node tracker.mjs list-open`);
}

try {
  const { command, args } = parseArgs(process.argv.slice(2));
  if (!command || args.help) {
    usage();
    process.exit(command ? 0 : 1);
  }
  if (command === 'add-interest') addInterest(args);
  else if (command === 'alert-matches') alertMatches(args);
  else if (command === 'list-open') listOpen();
  else {
    usage();
    process.exit(1);
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

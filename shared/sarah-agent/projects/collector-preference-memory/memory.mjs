#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname));
const DATA_DIR = path.join(ROOT, 'data');
const DB_PATH = path.join(DATA_DIR, 'collector-preferences.json');
const REPORT_DIR = path.join(ROOT, 'reports');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function ensureDb() {
  ensureDir(DATA_DIR);
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ version: 1, collectors: [], matchRuns: [] }, null, 2) + '\n');
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

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'item';
}

function toList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim().toLowerCase()).filter(Boolean);
  return String(value)
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function toBool(value, fallback = false) {
  if (value == null) return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (['true', 'yes', 'y', '1'].includes(normalized)) return true;
  if (['false', 'no', 'n', '0'].includes(normalized)) return false;
  return fallback;
}

function toNumber(value) {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeCollector(source = {}) {
  const email = String(source.email || '').trim().toLowerCase();
  return {
    id: source.id || `collector_${slugify(email || source.name)}`,
    createdAt: source.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    name: source.name || 'Unknown collector',
    email,
    instagram: source.instagram || null,
    segment: source.segment || 'General',
    lifetimeSpend: toNumber(source.lifetimeSpend) || 0,
    lastPurchaseDate: source.lastPurchaseDate || null,
    firstLook: Boolean(source.firstLook),
    preferences: {
      mediums: toList(source.preferences?.mediums || source.mediums),
      palette: toList(source.preferences?.palette || source.palette),
      themes: toList(source.preferences?.themes || source.themes),
      moods: toList(source.preferences?.moods || source.moods),
      orientations: toList(source.preferences?.orientations || source.orientations),
      minWidthInches: toNumber(source.preferences?.minWidthInches ?? source.minWidth),
      maxWidthInches: toNumber(source.preferences?.maxWidthInches ?? source.maxWidth),
      minHeightInches: toNumber(source.preferences?.minHeightInches ?? source.minHeight),
      maxHeightInches: toNumber(source.preferences?.maxHeightInches ?? source.maxHeight),
      minPrice: toNumber(source.preferences?.minPrice ?? source.minPrice),
      maxPrice: toNumber(source.preferences?.maxPrice ?? source.maxPrice)
    },
    notes: source.notes || ''
  };
}

function normalizePiece(source = {}) {
  return {
    id: source.id || slugify(source.title),
    title: source.title || 'Untitled piece',
    medium: String(source.medium || '').trim().toLowerCase(),
    widthInches: toNumber(source.widthInches ?? source.width),
    heightInches: toNumber(source.heightInches ?? source.height),
    orientation: String(source.orientation || '').trim().toLowerCase(),
    price: toNumber(source.price),
    palette: toList(source.palette),
    themes: toList(source.themes || source.subject),
    moods: toList(source.moods || source.mood),
    url: source.url || null,
    imageUrl: source.imageUrl || null,
    notes: source.notes || ''
  };
}

function overlapScore(a, b) {
  const setA = new Set(toList(a));
  const setB = new Set(toList(b));
  if (!setA.size || !setB.size) return 0;
  let overlap = 0;
  for (const item of setA) {
    if (setB.has(item)) overlap += 1;
  }
  return overlap / Math.max(setA.size, setB.size);
}

function rangeFit(value, min, max) {
  if (value == null || (min == null && max == null)) return 0;
  if (min != null && value < min) {
    const gap = (min - value) / Math.max(min, 1);
    return Math.max(0, 1 - gap);
  }
  if (max != null && value > max) {
    const gap = (value - max) / Math.max(max, 1);
    return Math.max(0, 1 - gap);
  }
  return 1;
}

function orientationScore(preferences, piece) {
  if (!preferences.length || !piece) return 0;
  return preferences.includes(piece) ? 1 : 0;
}

function mediumScore(preferences, piece) {
  if (!preferences.length || !piece) return 0;
  return preferences.includes(piece) ? 1 : 0;
}

function relationshipPriority(collector) {
  let score = 0;
  if (collector.firstLook) score += 0.7;
  if (String(collector.segment).toLowerCase() === 'vip') score += 0.3;
  return Math.min(score, 1);
}

function scoreCollector(collector, piece) {
  const preferences = collector.preferences || {};
  const scores = {
    medium: mediumScore(preferences.mediums || [], piece.medium),
    theme: overlapScore(preferences.themes || [], piece.themes || []),
    mood: overlapScore(preferences.moods || [], piece.moods || []),
    palette: overlapScore(preferences.palette || [], piece.palette || []),
    size:
      (rangeFit(piece.widthInches, preferences.minWidthInches, preferences.maxWidthInches) +
        rangeFit(piece.heightInches, preferences.minHeightInches, preferences.maxHeightInches)) / 2,
    price: rangeFit(piece.price, preferences.minPrice, preferences.maxPrice),
    orientation: orientationScore(preferences.orientations || [], piece.orientation),
    relationship: relationshipPriority(collector)
  };

  const total =
    scores.medium * 0.2 +
    scores.theme * 0.18 +
    scores.mood * 0.12 +
    scores.palette * 0.15 +
    scores.size * 0.1 +
    scores.price * 0.12 +
    scores.orientation * 0.05 +
    scores.relationship * 0.08;

  return {
    total: Number(total.toFixed(3)),
    breakdown: scores
  };
}

function buildReasons(collector, match, piece) {
  const reasons = [];
  if (match.breakdown.medium >= 1) reasons.push(`likes ${piece.medium}`);
  if (match.breakdown.theme > 0) reasons.push(`theme overlap ${match.breakdown.theme.toFixed(2)}`);
  if (match.breakdown.palette > 0) reasons.push(`palette overlap ${match.breakdown.palette.toFixed(2)}`);
  if (match.breakdown.mood > 0) reasons.push(`mood overlap ${match.breakdown.mood.toFixed(2)}`);
  if (match.breakdown.price >= 1) reasons.push('fits price lane');
  if (match.breakdown.size >= 1) reasons.push('fits size comfort');
  if (collector.firstLook) reasons.push('marked for first look');
  if (String(collector.segment).toLowerCase() === 'vip') reasons.push('VIP collector');
  return reasons;
}

function outreachAngle(collector, piece, reasons) {
  const prefix = collector.firstLook || String(collector.segment).toLowerCase() === 'vip'
    ? 'Offer a private first look'
    : 'Send a warm preview note';
  const why = reasons.slice(0, 2).join(' and ') || 'fit with prior preferences';
  return `${prefix} for ${piece.title}, anchored on ${why}.`;
}

function upsertCollector(args) {
  const required = ['name', 'email'];
  const missing = required.filter((key) => !args[key]);
  if (missing.length) {
    throw new Error(`Missing required flags: ${missing.map((key) => `--${key}`).join(', ')}`);
  }

  const db = readDb();
  const next = normalizeCollector({
    name: args.name,
    email: args.email,
    instagram: args.instagram,
    segment: args.segment,
    lifetimeSpend: args['lifetime-spend'],
    lastPurchaseDate: args['last-purchase-date'],
    firstLook: toBool(args['first-look']),
    mediums: args.mediums,
    palette: args.palette,
    themes: args.themes,
    moods: args.moods,
    orientations: args.orientations,
    minWidth: args['min-width'],
    maxWidth: args['max-width'],
    minHeight: args['min-height'],
    maxHeight: args['max-height'],
    minPrice: args['min-price'],
    maxPrice: args['max-price'],
    notes: args.notes
  });

  const existingIndex = db.collectors.findIndex((collector) => collector.email === next.email);
  if (existingIndex >= 0) {
    next.createdAt = db.collectors[existingIndex].createdAt;
    next.id = db.collectors[existingIndex].id;
    db.collectors[existingIndex] = next;
  } else {
    db.collectors.push(next);
  }
  writeDb(db);
  console.log(JSON.stringify(next, null, 2));
}

function loadPieceFromArgs(args) {
  if (args['piece-file']) {
    return normalizePiece(JSON.parse(fs.readFileSync(path.resolve(args['piece-file']), 'utf8')));
  }
  return normalizePiece({
    id: args['piece-id'],
    title: args['piece-title'],
    medium: args.medium,
    width: args.width,
    height: args.height,
    orientation: args.orientation,
    price: args.price,
    palette: args.palette,
    themes: args.themes,
    moods: args.moods,
    notes: args.notes
  });
}

function buildReport(piece, matches, threshold) {
  const lines = [];
  lines.push(`# Collector preference shortlist: ${piece.title}`);
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Threshold: ${threshold}`);
  lines.push('');
  lines.push('## Piece under review');
  lines.push(`- Title: ${piece.title}`);
  lines.push(`- Medium: ${piece.medium || 'unknown'}`);
  lines.push(`- Size: ${piece.widthInches || '?'} x ${piece.heightInches || '?'} in`);
  lines.push(`- Orientation: ${piece.orientation || 'unknown'}`);
  lines.push(`- Price: ${piece.price != null ? `$${piece.price}` : 'unknown'}`);
  lines.push(`- Palette: ${piece.palette.join(', ') || 'n/a'}`);
  lines.push(`- Themes: ${piece.themes.join(', ') || 'n/a'}`);
  lines.push(`- Moods: ${piece.moods.join(', ') || 'n/a'}`);
  lines.push('');
  lines.push('## Likely buyers before launch');
  if (!matches.length) {
    lines.push('No collectors cleared the threshold.');
    return lines.join('\n') + '\n';
  }
  matches.forEach((entry, index) => {
    lines.push(`### ${index + 1}. ${entry.collector.name} (${entry.collector.email})`);
    lines.push(`- Match score: ${entry.match.total}`);
    lines.push(`- Segment: ${entry.collector.segment}`);
    lines.push(`- First look: ${entry.collector.firstLook ? 'yes' : 'no'}`);
    lines.push(`- Reasons: ${entry.reasons.join(', ') || 'general fit'}`);
    lines.push(`- Notes: ${entry.collector.notes || 'n/a'}`);
    lines.push(`- Outreach angle: ${entry.outreachAngle}`);
    lines.push('');
  });
  return lines.join('\n') + '\n';
}

function matchPiece(args) {
  const db = readDb();
  const piece = loadPieceFromArgs(args);
  const threshold = args['min-score'] ? Number(args['min-score']) : 0.45;
  const matches = db.collectors
    .map((collector) => {
      const match = scoreCollector(collector, piece);
      const reasons = buildReasons(collector, match, piece);
      return {
        collector,
        match,
        reasons,
        outreachAngle: outreachAngle(collector, piece, reasons)
      };
    })
    .filter((entry) => entry.match.total >= threshold)
    .sort((a, b) => {
      if (b.match.total !== a.match.total) return b.match.total - a.match.total;
      return (b.collector.lifetimeSpend || 0) - (a.collector.lifetimeSpend || 0);
    });

  const matchRun = {
    id: `match_${Date.now()}`,
    createdAt: new Date().toISOString(),
    piece,
    threshold,
    results: matches.map((entry) => ({
      collectorId: entry.collector.id,
      email: entry.collector.email,
      score: entry.match.total,
      reasons: entry.reasons
    }))
  };
  db.matchRuns.push(matchRun);
  writeDb(db);

  ensureDir(REPORT_DIR);
  const reportPath = path.join(REPORT_DIR, `${new Date().toISOString().slice(0, 10)}-${slugify(piece.title)}.md`);
  fs.writeFileSync(reportPath, buildReport(piece, matches, threshold));

  console.log(JSON.stringify({ piece, threshold, matchCount: matches.length, reportPath, matches }, null, 2));
}

function listCollectors() {
  const db = readDb();
  console.log(JSON.stringify(db.collectors, null, 2));
}

function usage() {
  console.log(`Usage:
  node memory.mjs upsert-collector --name "Collector" --email "collector@example.com" [--mediums acrylic,oil] [--palette pink,gold] [--themes floral,abstract] [--moods energetic,calm] [--first-look yes]
  node memory.mjs match-piece --piece-file ./new-piece.json [--min-score 0.45]
  node memory.mjs list-collectors`);
}

try {
  const { command, args } = parseArgs(process.argv.slice(2));
  if (!command || args.help) {
    usage();
    process.exit(command ? 0 : 1);
  }
  if (command === 'upsert-collector') upsertCollector(args);
  else if (command === 'match-piece') matchPiece(args);
  else if (command === 'list-collectors') listCollectors();
  else {
    usage();
    process.exit(1);
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

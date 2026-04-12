#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_BASE_DIR = path.resolve('/root/.openclaw/workspace/shared/sarah-agent/projects');

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      args._.push(token);
      continue;
    }
    const [key, inlineValue] = token.slice(2).split('=', 2);
    if (inlineValue !== undefined) {
      args[key] = inlineValue;
      continue;
    }
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

function slugify(value) {
  return String(value || 'untitled')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'untitled';
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function iso(input, fieldName) {
  const value = new Date(input);
  if (Number.isNaN(value.getTime())) {
    throw new Error(`Invalid ${fieldName}: ${input}`);
  }
  return value.toISOString();
}

export function buildDraft(entry) {
  const dueAt = new Date(entry.dueAt).toISOString();
  const sentAt = new Date(entry.sentAt).toISOString();
  const storyReminder = entry.storyReminder ? 'yes' : 'no';
  const caption = entry.captionDraft || `24 hours ago, newsletter subscribers got first dibs on ${entry.pieceTitle}. Now it's live on Instagram too. ${entry.linkInBioUrl ? 'Link in bio.' : ''}`.trim();
  const notes = entry.notes ? `\n## Notes\n${entry.notes}\n` : '';
  const image = entry.imageUrl ? entry.imageUrl : 'Add image asset here';
  const shopUrl = entry.shopUrl ? entry.shopUrl : 'Add shop URL here';

  return `# Instagram Drop Draft\n\n- Campaign: ${entry.campaignName}\n- Piece: ${entry.pieceTitle}\n- Newsletter sent: ${sentAt}\n- Stage for Instagram after: ${dueAt}\n- Story reminder: ${storyReminder}\n- Link in bio URL: ${entry.linkInBioUrl || 'Add/update before publish'}\n- Image asset: ${image}\n- Shop URL: ${shopUrl}\n\n## Caption Draft\n${caption}\n\n## Publish Checklist\n- [ ] Confirm piece is still available\n- [ ] Confirm image or carousel order\n- [ ] Update link in bio destination\n- [ ] Sarah final review + edit\n- [ ] Post feed item\n${entry.storyReminder ? '- [ ] Optional: post matching Story reminder\n' : ''}${notes}`;
}

export function recordNewsletterSend(options) {
  const baseDir = path.resolve(options.baseDir || DEFAULT_BASE_DIR);
  const statePath = path.join(baseDir, 'instagram-drop-state.json');
  const state = readJson(statePath, { reminders: [] });

  const campaignName = options.campaignName || options.campaign || 'Newsletter drop';
  const pieceTitle = options.pieceTitle || options.piece || campaignName;
  const sentAt = iso(options.sentAt || new Date().toISOString(), 'sentAt');
  const dueAt = new Date(new Date(sentAt).getTime() + DAY_MS).toISOString();

  const reminder = {
    id: `${new Date(sentAt).toISOString().slice(0, 10)}-${slugify(campaignName)}-${slugify(pieceTitle)}`,
    campaignName,
    pieceTitle,
    sentAt,
    dueAt,
    imageUrl: options.imageUrl || '',
    shopUrl: options.shopUrl || '',
    linkInBioUrl: options.linkInBioUrl || options.shopUrl || '',
    captionDraft: options.captionDraft || '',
    storyReminder: String(options.storyReminder || '').toLowerCase() === 'true',
    notes: options.notes || '',
    stagedAt: null,
    draftPath: null
  };

  const existingIndex = state.reminders.findIndex((item) => item.id === reminder.id);
  if (existingIndex >= 0) {
    state.reminders[existingIndex] = { ...state.reminders[existingIndex], ...reminder };
  } else {
    state.reminders.push(reminder);
  }

  writeJson(statePath, state);
  return reminder;
}

export function stageDueReminders(options = {}) {
  const baseDir = path.resolve(options.baseDir || DEFAULT_BASE_DIR);
  const now = new Date(options.now || new Date().toISOString());
  if (Number.isNaN(now.getTime())) throw new Error(`Invalid now: ${options.now}`);

  const statePath = path.join(baseDir, 'instagram-drop-state.json');
  const draftsDir = path.join(baseDir, 'instagram-drafts');
  const state = readJson(statePath, { reminders: [] });
  const staged = [];

  for (const reminder of state.reminders) {
    if (reminder.stagedAt) continue;
    if (new Date(reminder.dueAt).getTime() > now.getTime()) continue;

    ensureDir(draftsDir);
    const fileName = `${reminder.dueAt.slice(0, 10)}-${slugify(reminder.pieceTitle)}.md`;
    const draftPath = path.join(draftsDir, fileName);
    fs.writeFileSync(draftPath, buildDraft(reminder));
    reminder.stagedAt = now.toISOString();
    reminder.draftPath = draftPath;
    staged.push({ id: reminder.id, draftPath, dueAt: reminder.dueAt, pieceTitle: reminder.pieceTitle });
  }

  writeJson(statePath, state);
  return staged;
}

function printUsage() {
  console.log(`Usage:\n  node instagram-drop-reminder.mjs record-send --campaign-name "Saturday Drop" --piece-title "Blue Bloom" [--sent-at ISO] [--shop-url URL] [--image-url URL] [--link-in-bio-url URL] [--caption-draft TEXT] [--story-reminder true]\n  node instagram-drop-reminder.mjs run [--now ISO]`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];

  if (!command || command === '--help' || command === 'help') {
    printUsage();
    process.exit(command ? 0 : 1);
  }

  if (command === 'record-send') {
    const result = recordNewsletterSend({
      baseDir: args['base-dir'],
      campaignName: args['campaign-name'],
      pieceTitle: args['piece-title'],
      sentAt: args['sent-at'],
      shopUrl: args['shop-url'],
      imageUrl: args['image-url'],
      linkInBioUrl: args['link-in-bio-url'],
      captionDraft: args['caption-draft'],
      storyReminder: args['story-reminder'],
      notes: args.notes
    });
    console.log(JSON.stringify({ ok: true, action: 'recorded', reminder: result }, null, 2));
    return;
  }

  if (command === 'run') {
    const staged = stageDueReminders({
      baseDir: args['base-dir'],
      now: args.now
    });
    console.log(JSON.stringify({ ok: true, action: 'staged', count: staged.length, staged }, null, 2));
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

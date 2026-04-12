import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { recordNewsletterSend, stageDueReminders } from './instagram-drop-reminder.mjs';

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ig-drop-reminder-'));
}

test('records newsletter send with a dueAt 24 hours later', () => {
  const baseDir = makeTempDir();
  const reminder = recordNewsletterSend({
    baseDir,
    campaignName: 'Saturday Drop',
    pieceTitle: 'Blue Bloom',
    sentAt: '2026-04-12T15:00:00.000Z',
    shopUrl: 'https://example.com/pieces/blue-bloom'
  });

  assert.equal(reminder.dueAt, '2026-04-13T15:00:00.000Z');

  const state = JSON.parse(fs.readFileSync(path.join(baseDir, 'instagram-drop-state.json'), 'utf8'));
  assert.equal(state.reminders.length, 1);
  assert.equal(state.reminders[0].pieceTitle, 'Blue Bloom');
});

test('stages only reminders that are due and writes a draft file', () => {
  const baseDir = makeTempDir();
  recordNewsletterSend({
    baseDir,
    campaignName: 'Saturday Drop',
    pieceTitle: 'Blue Bloom',
    sentAt: '2026-04-12T15:00:00.000Z',
    captionDraft: 'Blue Bloom is now live. Link in bio.',
    storyReminder: 'true'
  });

  const staged = stageDueReminders({
    baseDir,
    now: '2026-04-13T15:00:00.000Z'
  });

  assert.equal(staged.length, 1);
  const draftPath = staged[0].draftPath;
  assert.ok(fs.existsSync(draftPath));

  const draft = fs.readFileSync(draftPath, 'utf8');
  assert.match(draft, /Blue Bloom/);
  assert.match(draft, /Link in bio/);
  assert.match(draft, /Optional: post matching Story reminder/);

  const state = JSON.parse(fs.readFileSync(path.join(baseDir, 'instagram-drop-state.json'), 'utf8'));
  assert.ok(state.reminders[0].stagedAt);
});

test('does not stage reminders before the 24 hour mark', () => {
  const baseDir = makeTempDir();
  recordNewsletterSend({
    baseDir,
    campaignName: 'Saturday Drop',
    pieceTitle: 'Blue Bloom',
    sentAt: '2026-04-12T15:00:00.000Z'
  });

  const staged = stageDueReminders({
    baseDir,
    now: '2026-04-13T14:59:59.000Z'
  });

  assert.equal(staged.length, 0);
  assert.equal(fs.existsSync(path.join(baseDir, 'instagram-drafts')), false);
});

#!/usr/bin/env node
import assert from 'assert/strict';
import { buildBirthdayDrafts, renderBirthdayDraftsMarkdown } from './birthday-program.mjs';

const today = new Date('2026-04-12T00:00:00Z');

const customers = [
  {
    id: 'gid://shopify/Customer/1',
    firstName: 'Maya',
    lastName: 'Stone',
    email: 'maya@example.com',
    tags: ['vip', 'birthday:04-12'],
    note: '',
    numberOfOrders: 6,
    amountSpent: { amount: '3200.00' },
    metafields: { nodes: [] }
  },
  {
    id: 'gid://shopify/Customer/2',
    firstName: 'Ari',
    lastName: 'Bloom',
    email: 'ari@example.com',
    tags: [],
    note: 'birthday: 04/14',
    numberOfOrders: 2,
    amountSpent: { amount: '700.00' },
    metafields: { nodes: [] }
  },
  {
    id: 'gid://shopify/Customer/3',
    firstName: 'June',
    lastName: 'Rivera',
    email: 'june@example.com',
    tags: [],
    note: '',
    numberOfOrders: 1,
    amountSpent: { amount: '180.00' },
    metafields: { nodes: [{ namespace: 'custom', key: 'birthday', value: '2020-04-20' }] }
  },
  {
    id: 'gid://shopify/Customer/4',
    firstName: 'Nope',
    lastName: 'Later',
    email: 'later@example.com',
    tags: ['birthday:04-30'],
    note: '',
    numberOfOrders: 1,
    amountSpent: { amount: '120.00' },
    metafields: { nodes: [] }
  }
];

const drafts = buildBirthdayDrafts(customers, { today, lookaheadDays: 3 });
assert.equal(drafts.length, 2);
assert.equal(drafts[0].name, 'Maya Stone');
assert.equal(drafts[0].daysAway, 0);
assert.equal(drafts[0].segment, 'vip');
assert.equal(drafts[0].drafts.recommended, 'exclusivePreview');
assert.equal(drafts[1].name, 'Ari Bloom');
assert.equal(drafts[1].daysAway, 2);
assert.match(drafts[1].drafts.simpleWish, /Happy birthday/);

const markdown = renderBirthdayDraftsMarkdown(drafts, { today });
assert.match(markdown, /# Birthday Drafts/);
assert.match(markdown, /## Maya Stone/);
assert.match(markdown, /Exclusive preview/);

console.log('birthday-program tests passed');

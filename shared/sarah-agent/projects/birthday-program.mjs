#!/usr/bin/env node
import https from 'https';
import fs from 'fs';

const SHOPIFY_STORE = process.env.SARAH_SHOPIFY_STORE || 'yr5azj-q0.myshopify.com';
const ACCESS_TOKEN = process.env.SARAH_SHOPIFY_ACCESS_TOKEN;
const OUTPUT_DIR = '/root/.openclaw/workspace/shared/sarah-agent/projects';
const JSON_OUTPUT_PATH = `${OUTPUT_DIR}/birthday-drafts.json`;
const MD_OUTPUT_PATH = `${OUTPUT_DIR}/birthday-drafts.md`;
const LOOKAHEAD_DAYS = Number.parseInt(process.env.SARAH_BIRTHDAY_LOOKAHEAD_DAYS || '3', 10);
const BIRTHDAY_KEYS = new Set(['birthday', 'birthdate', 'date_of_birth', 'dob', 'birthday_date']);

function shopifyGraphQLRequest(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ query, variables });
    const options = {
      hostname: SHOPIFY_STORE,
      path: '/admin/api/2024-01/graphql.json',
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': ACCESS_TOKEN,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`Shopify GraphQL ${res.statusCode}: ${parsed.errors || data || 'Unknown error'}`));
            return;
          }
          if (parsed.errors?.length) {
            reject(new Error(`Shopify GraphQL errors: ${parsed.errors.map((error) => error.message).join('; ')}`));
            return;
          }
          resolve(parsed.data || {});
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(15000, () => req.destroy(new Error('Shopify GraphQL request timed out after 15s')));
    req.write(payload);
    req.end();
  });
}

function normalizeCustomer(customer = {}) {
  return {
    id: customer.id || null,
    firstName: customer.firstName || customer.first_name || '',
    lastName: customer.lastName || customer.last_name || '',
    email: customer.email || customer.defaultEmailAddress?.emailAddress || '',
    tags: Array.isArray(customer.tags)
      ? customer.tags
      : typeof customer.tags === 'string'
        ? customer.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : [],
    note: customer.note || '',
    numberOfOrders: Number(customer.numberOfOrders || customer.ordersCount || 0),
    amountSpent: Number.parseFloat(customer.amountSpent?.amount || customer.totalSpent || customer.amountSpent || '0') || 0,
    metafields: (customer.metafields?.nodes || customer.metafields || []).map((metafield) => ({
      namespace: metafield.namespace || '',
      key: metafield.key || '',
      value: metafield.value || ''
    }))
  };
}

function parseBirthdayValue(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const value = raw.trim();
  if (!value) return null;

  let match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return { month: Number(match[2]), day: Number(match[3]), source: value };

  match = value.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (match) return { month: Number(match[1]), day: Number(match[2]), source: value };

  match = value.match(/^(\d{1,2})-(\d{1,2})$/);
  if (match) return { month: Number(match[1]), day: Number(match[2]), source: value };

  return null;
}

function extractBirthday(customer) {
  const normalized = normalizeCustomer(customer);

  for (const metafield of normalized.metafields) {
    if (BIRTHDAY_KEYS.has(String(metafield.key || '').toLowerCase())) {
      const parsed = parseBirthdayValue(metafield.value);
      if (parsed) return { ...parsed, via: `metafield:${metafield.namespace}.${metafield.key}` };
    }
  }

  for (const tag of normalized.tags) {
    const [prefix, value] = tag.split(':');
    if (value && BIRTHDAY_KEYS.has(String(prefix || '').toLowerCase())) {
      const parsed = parseBirthdayValue(value.trim());
      if (parsed) return { ...parsed, via: `tag:${prefix}` };
    }
  }

  const noteMatch = normalized.note.match(/(?:birthday|birthdate|dob)\s*[:=-]\s*([0-9/\-]{4,10})/i);
  if (noteMatch) {
    const parsed = parseBirthdayValue(noteMatch[1]);
    if (parsed) return { ...parsed, via: 'note' };
  }

  return null;
}

function getDisplayName(customer) {
  const normalized = normalizeCustomer(customer);
  const full = `${normalized.firstName} ${normalized.lastName}`.trim();
  return full || normalized.email || 'Collector';
}

function daysUntilBirthday(month, day, today = new Date()) {
  const year = today.getUTCFullYear();
  const current = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  let birthday = Date.UTC(year, month - 1, day);
  if (birthday < current) birthday = Date.UTC(year + 1, month - 1, day);
  return Math.round((birthday - current) / 86400000);
}

function segmentCollector(customer) {
  const normalized = normalizeCustomer(customer);
  if (normalized.numberOfOrders >= 5 || normalized.amountSpent >= 2000) return 'vip';
  if (normalized.numberOfOrders >= 2 || normalized.amountSpent >= 500) return 'repeat';
  return 'emerging';
}

function buildDraftOptions(customer, birthdayInfo, today = new Date()) {
  const normalized = normalizeCustomer(customer);
  const name = normalized.firstName || getDisplayName(normalized).split(' ')[0] || 'friend';
  const segment = segmentCollector(normalized);
  const daysAway = daysUntilBirthday(birthdayInfo.month, birthdayInfo.day, today);
  const timing = daysAway === 0 ? 'today' : daysAway === 1 ? 'tomorrow' : `in ${daysAway} days`;

  const simple = `Happy birthday${daysAway === 0 ? '' : ' in advance'}, ${name}! I’m so grateful you’re part of this little art world. Hope this next year feels beautiful, inspiring, and very loved. 💛`;
  const preview = segment === 'vip'
    ? `Happy birthday${daysAway === 0 ? '' : ' in advance'}, ${name}! As a little birthday treat, I’d love to give you a first look at anything new that’s coming out around ${timing}. No pressure at all, just a quiet preview if that feels fun.`
    : `Happy birthday${daysAway === 0 ? '' : ' in advance'}, ${name}! I hope you get spoiled in all the best ways. If you’re in the mood for something beautiful for your home, I’d be happy to send over a few pieces I think you’d love.`;
  const gift = `Happy birthday${daysAway === 0 ? '' : ' in advance'}, ${name}! I wanted to celebrate you with a little studio love. If there’s a piece you’ve had your eye on, reply and I’ll send over something special as a birthday thank-you.`;

  return {
    simpleWish: simple,
    exclusivePreview: preview,
    studioGift: gift,
    recommended: segment === 'vip' ? 'exclusivePreview' : 'simpleWish'
  };
}

export function buildBirthdayDrafts(customers, options = {}) {
  const today = options.today || new Date();
  const lookaheadDays = options.lookaheadDays ?? LOOKAHEAD_DAYS;

  return customers
    .map(normalizeCustomer)
    .map((customer) => {
      const birthday = extractBirthday(customer);
      if (!birthday) return null;
      const daysAway = daysUntilBirthday(birthday.month, birthday.day, today);
      if (daysAway < 0 || daysAway > lookaheadDays) return null;
      const drafts = buildDraftOptions(customer, birthday, today);
      return {
        id: customer.id,
        name: getDisplayName(customer),
        firstName: customer.firstName || '',
        email: customer.email || '',
        month: birthday.month,
        day: birthday.day,
        daysAway,
        timingLabel: daysAway === 0 ? 'today' : daysAway === 1 ? 'tomorrow' : `in ${daysAway} days`,
        segment: segmentCollector(customer),
        source: birthday.via,
        orderCount: customer.numberOfOrders,
        amountSpent: Number(customer.amountSpent.toFixed(2)),
        drafts
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.daysAway - b.daysAway || b.amountSpent - a.amountSpent || a.name.localeCompare(b.name));
}

export function renderBirthdayDraftsMarkdown(entries, options = {}) {
  const today = options.today || new Date();
  const headerDate = today.toISOString().split('T')[0];
  const lines = [`# Birthday Drafts`, '', `Generated: ${headerDate}`, ''];

  if (entries.length === 0) {
    lines.push('No collector birthdays in the current lookahead window.');
    return lines.join('\n');
  }

  for (const entry of entries) {
    lines.push(`## ${entry.name} (${entry.timingLabel})`);
    lines.push(`- Segment: ${entry.segment}`);
    lines.push(`- Birthday source: ${entry.source}`);
    lines.push(`- Orders: ${entry.orderCount}, spend: $${entry.amountSpent.toFixed(2)}`);
    lines.push(`- Recommended draft: ${entry.drafts.recommended}`);
    lines.push('');
    lines.push(`**Simple wish**`);
    lines.push(entry.drafts.simpleWish);
    lines.push('');
    lines.push(`**Exclusive preview**`);
    lines.push(entry.drafts.exclusivePreview);
    lines.push('');
    lines.push(`**Studio gift**`);
    lines.push(entry.drafts.studioGift);
    lines.push('');
  }

  return lines.join('\n');
}

export async function fetchBirthdayCustomers() {
  if (!ACCESS_TOKEN) throw new Error('SARAH_SHOPIFY_ACCESS_TOKEN is required');

  const customers = [];
  let after = null;

  while (true) {
    const data = await shopifyGraphQLRequest(
      `query BirthdayCustomers($after: String) {
        customers(first: 100, after: $after, sortKey: CREATED_AT) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            firstName
            lastName
            note
            tags
            numberOfOrders
            amountSpent {
              amount
              currencyCode
            }
            defaultEmailAddress {
              emailAddress
            }
            metafields(first: 20) {
              nodes {
                namespace
                key
                value
                type
              }
            }
          }
        }
      }`,
      { after }
    );

    const connection = data.customers;
    customers.push(...(connection?.nodes || []));
    if (!connection?.pageInfo?.hasNextPage) break;
    after = connection.pageInfo.endCursor;
  }

  return customers;
}

export async function generateBirthdayDraftReport(options = {}) {
  const customers = options.customers || await fetchBirthdayCustomers();
  const entries = buildBirthdayDrafts(customers, options);
  const report = {
    generatedAt: new Date().toISOString(),
    lookaheadDays: options.lookaheadDays ?? LOOKAHEAD_DAYS,
    totalCustomersScanned: customers.length,
    draftCount: entries.length,
    entries
  };

  fs.writeFileSync(JSON_OUTPUT_PATH, JSON.stringify(report, null, 2));
  fs.writeFileSync(MD_OUTPUT_PATH, renderBirthdayDraftsMarkdown(entries, options));

  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateBirthdayDraftReport()
    .then((report) => {
      console.log(`Birthday drafts generated: ${report.draftCount}`);
      console.log(`JSON: ${JSON_OUTPUT_PATH}`);
      console.log(`MD: ${MD_OUTPUT_PATH}`);
    })
    .catch((error) => {
      console.error('Failed to generate birthday drafts:', error.message);
      process.exitCode = 1;
    });
}

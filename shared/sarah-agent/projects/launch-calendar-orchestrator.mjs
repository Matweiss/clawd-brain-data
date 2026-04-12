#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_OFFSETS = [
  {
    key: 'productPrep',
    label: 'Product prep',
    offsetDays: -5,
    owner: 'Arty',
    channel: 'Shopify admin',
    defaultChecklist: [
      'Upload pieces as hidden/orphan products with clean titles, pricing, and dimensions',
      'Confirm inventory, alt text, shipping weights, and collector-facing details',
      'Generate private product URLs for early-access sharing',
    ],
  },
  {
    key: 'landingPages',
    label: 'Landing pages',
    offsetDays: -3,
    owner: 'Arty',
    channel: 'Shopify pages',
    defaultChecklist: [
      'Refresh collection page and any collector-specific landing pages',
      'Swap sold pieces out and make sure all linked products are still available',
      'Align hero copy and CTA with the upcoming release story',
    ],
  },
  {
    key: 'newsletter',
    label: 'Newsletter early access',
    offsetDays: 0,
    owner: 'Sarah',
    channel: 'Shopify Email',
    defaultChecklist: [
      'Send subscriber-first drop email',
      'Use private/orphan product links for the 24-hour early-access window',
      'Call out release theme, best-fit collectors, and urgency clearly',
    ],
  },
  {
    key: 'instagramWarmup',
    label: 'Instagram warmup',
    offsetDays: 0,
    timeOfDay: '18:00',
    owner: 'Sarah',
    channel: 'Instagram Stories',
    defaultChecklist: [
      'Post a light teaser that points people toward the newsletter/VIP list',
      'Avoid fully opening the drop before the early-access window ends',
    ],
  },
  {
    key: 'instagramLaunch',
    label: 'Instagram public launch',
    offsetDays: 1,
    owner: 'Sarah',
    channel: 'Instagram feed + stories',
    defaultChecklist: [
      'Publish the public launch post 24 hours after the newsletter send',
      'Show what is still available versus sold',
      'Direct traffic to the public landing page or current collection page',
    ],
  },
];

function parseArgs(argv) {
  const args = { format: 'markdown' };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--input') args.input = argv[++i];
    else if (arg === '--output') args.output = argv[++i];
    else if (arg === '--format') args.format = argv[++i];
    else if (arg === '--help' || arg === '-h') args.help = true;
  }
  return args;
}

function showHelp() {
  console.log(`Launch Calendar Orchestrator

Usage:
  node launch-calendar-orchestrator.mjs --input ./launch-calendar-sample.json
  node launch-calendar-orchestrator.mjs --input ./launch-calendar-sample.json --format json
  node launch-calendar-orchestrator.mjs --input ./launch-calendar-sample.json --output ./launch-plan.md
`);
}

function requireInput(filePath) {
  if (!filePath) throw new Error('Missing --input path');
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function parseDateTime(date, time = '09:00') {
  return new Date(`${date}T${time}:00Z`);
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function shiftDate(dateString, offsetDays, timeOfDay = '09:00') {
  const base = parseDateTime(dateString, timeOfDay);
  base.setUTCDate(base.getUTCDate() + offsetDays);
  return base;
}

function mergeChecklist(defaults = [], extra = []) {
  return [...defaults, ...extra].filter(Boolean);
}

function buildTimeline(data) {
  if (!data.releaseDate) throw new Error('releaseDate is required');

  const timeline = DEFAULT_OFFSETS.map((step) => {
    const overrides = data.overrides?.[step.key] || {};
    const when = shiftDate(
      data.releaseDate,
      overrides.offsetDays ?? step.offsetDays,
      overrides.timeOfDay ?? step.timeOfDay ?? data.defaultTimeOfDay ?? '09:00'
    );

    return {
      key: step.key,
      label: overrides.label || step.label,
      date: formatDate(when),
      time: overrides.timeOfDay ?? step.timeOfDay ?? data.defaultTimeOfDay ?? '09:00',
      owner: overrides.owner || step.owner,
      channel: overrides.channel || step.channel,
      dependsOn: overrides.dependsOn || [],
      checklist: mergeChecklist(step.defaultChecklist, overrides.checklist),
      notes: overrides.notes || '',
    };
  }).sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));

  return {
    releaseName: data.releaseName || 'Untitled release',
    releaseDate: data.releaseDate,
    theme: data.theme || '',
    audience: data.audience || '',
    links: data.links || {},
    timeline,
  };
}

function renderMarkdown(plan) {
  const lines = [];
  lines.push(`# ${plan.releaseName} launch calendar`);
  lines.push('');
  lines.push(`- Release date: ${plan.releaseDate}`);
  if (plan.theme) lines.push(`- Theme: ${plan.theme}`);
  if (plan.audience) lines.push(`- Audience: ${plan.audience}`);
  if (Object.keys(plan.links).length) {
    lines.push(`- Links:`);
    for (const [key, value] of Object.entries(plan.links)) {
      lines.push(`  - ${key}: ${value}`);
    }
  }
  lines.push('');
  lines.push('## Timeline');
  lines.push('');

  for (const item of plan.timeline) {
    lines.push(`### ${item.date} ${item.time} — ${item.label}`);
    lines.push(`- Owner: ${item.owner}`);
    lines.push(`- Channel: ${item.channel}`);
    if (item.dependsOn.length) lines.push(`- Depends on: ${item.dependsOn.join(', ')}`);
    if (item.notes) lines.push(`- Notes: ${item.notes}`);
    lines.push('- Checklist:');
    for (const task of item.checklist) {
      lines.push(`  - ${task}`);
    }
    lines.push('');
  }

  return `${lines.join('\n').trim()}\n`;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    showHelp();
    process.exit(0);
  }

  const input = requireInput(args.input);
  const plan = buildTimeline(input);
  const output = args.format === 'json'
    ? `${JSON.stringify(plan, null, 2)}\n`
    : renderMarkdown(plan);

  if (args.output) {
    fs.writeFileSync(path.resolve(args.output), output, 'utf8');
  } else {
    process.stdout.write(output);
  }
}

main();

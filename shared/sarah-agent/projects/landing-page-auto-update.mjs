#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import process from 'node:process';

const WORKSPACE_ROOT = '/root/.openclaw/workspace/shared/sarah-agent/projects';
const LANDING_PAGES_DIR = path.join(WORKSPACE_ROOT, 'landing-pages');
const REPORT_JSON_PATH = path.join(WORKSPACE_ROOT, 'landing-page-sync-report.json');
const REPORT_MD_PATH = path.join(WORKSPACE_ROOT, 'landing-page-sync-report.md');
const UPDATE_LOG_PATH = path.join(LANDING_PAGES_DIR, 'update-log.json');

const SHOPIFY_STORE = process.env.SARAH_SHOPIFY_STORE || 'yr5azj-q0.myshopify.com';
const ACCESS_TOKEN = process.env.SARAH_SHOPIFY_ACCESS_TOKEN;
const STOREFRONT_BASE_URL = process.env.SARAH_STOREFRONT_BASE_URL || 'https://sarahjschwartz.com/products';

const ART_PRODUCT_TYPES = new Set([
  'Contemporary Frame',
  'Vintage Frame',
  'Gold Frame',
  'Unique Frame',
  'Canvas',
  'Skateboard'
]);

function parseArgs(argv) {
  const args = {
    apply: false,
    format: 'markdown',
    includeDrafts: false,
    manifestsDir: LANDING_PAGES_DIR,
    reportJson: REPORT_JSON_PATH,
    reportMd: REPORT_MD_PATH,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--apply') args.apply = true;
    else if (arg === '--include-drafts') args.includeDrafts = true;
    else if (arg === '--manifests-dir') args.manifestsDir = path.resolve(argv[++index]);
    else if (arg === '--report-json') args.reportJson = path.resolve(argv[++index]);
    else if (arg === '--report-md') args.reportMd = path.resolve(argv[++index]);
    else if (arg === '--help' || arg === '-h') args.help = true;
  }

  return args;
}

function showHelp() {
  console.log(`Landing page auto-update\n\nUsage:\n  node landing-page-auto-update.mjs\n  node landing-page-auto-update.mjs --apply\n  node landing-page-auto-update.mjs --manifests-dir ./landing-pages --report-md ./report.md\n\nBehavior:\n- Reads collector landing-page manifests from ./landing-pages/*.json\n- Pulls live Shopify product availability\n- Detects sold/unavailable products featured on pages\n- Recommends best-fit replacement pieces\n- Writes JSON + markdown report\n- With --apply, updates the local manifest files and appends update-log.json\n`);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function slugify(input = '') {
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeTags(tagString = '') {
  return String(tagString)
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function extractPrice(product) {
  const prices = (product.variants || [])
    .map((variant) => Number.parseFloat(variant.price || '0'))
    .filter(Number.isFinite);
  return prices.length ? Math.min(...prices) : 0;
}

function extractTier(tags = []) {
  const tierOrder = ['Minis', 'Darlings', 'Babes', 'Gems'];
  return tierOrder.find((tier) => tags.some((tag) => tag.toLowerCase() === tier.toLowerCase())) || 'Unassigned';
}

function isSellableArt(product) {
  if (!ART_PRODUCT_TYPES.has(product.product_type || '')) return false;
  return extractPrice(product) > 0;
}

function parseNextLink(linkHeader) {
  if (!linkHeader) return null;
  const links = linkHeader.split(',').map((part) => part.trim());
  for (const link of links) {
    const match = link.match(/<([^>]+)>;\s*rel="([^"]+)"/);
    if (match && match[2] === 'next') {
      const url = new URL(match[1]);
      return `${url.pathname}${url.search}`.replace('/admin/api/2024-01', '');
    }
  }
  return null;
}

function shopifyRequestWithHeaders(requestPath) {
  if (!ACCESS_TOKEN) {
    throw new Error('Missing SARAH_SHOPIFY_ACCESS_TOKEN');
  }

  return new Promise((resolve, reject) => {
    const options = {
      hostname: SHOPIFY_STORE,
      path: `/admin/api/2024-01${requestPath}`,
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`Shopify API ${res.statusCode}: ${parsed.errors || body || 'Unknown error'}`));
            return;
          }
          resolve({ data: parsed, nextUrl: parseNextLink(res.headers.link) });
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(15000, () => req.destroy(new Error('Shopify request timed out after 15s')));
    req.end();
  });
}

async function fetchAllProducts(includeDrafts = false) {
  const products = [];
  const statusFilter = includeDrafts ? 'active,draft' : 'active';
  let nextUrl = `/products.json?limit=250&status=${encodeURIComponent(statusFilter)}&fields=id,title,handle,product_type,tags,status,variants,image,published_at`;

  while (nextUrl) {
    const { data, nextUrl: following } = await shopifyRequestWithHeaders(nextUrl);
    products.push(...(data.products || []));
    nextUrl = following;
  }

  return products;
}

function buildProductIndex(products) {
  const byId = new Map();
  const byHandle = new Map();
  const available = [];

  for (const product of products) {
    const tags = normalizeTags(product.tags);
    const totalInventory = (product.variants || []).reduce((sum, variant) => sum + Number(variant.inventory_quantity || 0), 0);
    const price = extractPrice(product);
    const indexed = {
      id: product.id,
      title: product.title,
      handle: product.handle,
      productType: product.product_type || '',
      tags,
      status: product.status || 'unknown',
      publishedAt: product.published_at || null,
      price,
      tier: extractTier(tags),
      totalInventory,
      image: product.image?.src || null,
      url: `${STOREFRONT_BASE_URL}/${product.handle}`,
      raw: product,
    };

    byId.set(String(product.id), indexed);
    if (product.handle) byHandle.set(product.handle, indexed);

    if (isSellableArt(product) && totalInventory > 0 && product.status === 'active') {
      available.push(indexed);
    }
  }

  return { byId, byHandle, available };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function listManifestFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath)
    .filter((file) => file.endsWith('.json') && file !== 'update-log.json')
    .map((file) => path.join(dirPath, file))
    .sort();
}

function canonicalizeFeaturedProduct(entry) {
  if (typeof entry === 'string') return { handle: entry };
  return { ...entry };
}

function resolveManifestProduct(entry, productIndex) {
  const normalized = canonicalizeFeaturedProduct(entry);
  const idKey = normalized.productId ?? normalized.id;
  const handleKey = normalized.handle;
  const liveProduct = idKey != null
    ? productIndex.byId.get(String(idKey))
    : handleKey
      ? productIndex.byHandle.get(handleKey)
      : null;

  return {
    ...normalized,
    liveProduct: liveProduct || null,
    lookupKey: idKey != null ? String(idKey) : handleKey || 'unknown',
  };
}

function pieceSignature(product) {
  return slugify(`${product.title} ${product.productType} ${product.tags.join(' ')}`);
}

function similarityScore(source, candidate, collectorProfile = {}) {
  let score = 0;
  if (candidate.id === source.id) return Number.NEGATIVE_INFINITY;

  if (source.tier && candidate.tier === source.tier) score += 20;
  if (source.productType && candidate.productType === source.productType) score += 18;

  const sourceTags = new Set(source.tags.map((tag) => tag.toLowerCase()));
  for (const tag of candidate.tags) {
    if (sourceTags.has(tag.toLowerCase())) score += 6;
  }

  const sourceWords = new Set(pieceSignature(source).split('-').filter(Boolean));
  for (const word of pieceSignature(candidate).split('-')) {
    if (sourceWords.has(word)) score += 3;
  }

  const sourcePrice = source.price || 0;
  const candidatePrice = candidate.price || 0;
  const priceGap = Math.abs(candidatePrice - sourcePrice);
  if (sourcePrice > 0) {
    const ratio = priceGap / sourcePrice;
    if (ratio <= 0.1) score += 16;
    else if (ratio <= 0.2) score += 12;
    else if (ratio <= 0.35) score += 8;
    else if (ratio <= 0.5) score += 4;
  }

  const preferredTags = (collectorProfile.preferredTags || []).map((tag) => tag.toLowerCase());
  for (const tag of candidate.tags) {
    if (preferredTags.includes(tag.toLowerCase())) score += 5;
  }

  const preferredTiers = (collectorProfile.preferredTiers || []).map((tier) => tier.toLowerCase());
  if (preferredTiers.includes(String(candidate.tier || '').toLowerCase())) score += 8;

  return score;
}

function chooseReplacement(sourceProduct, candidates, usedIds, collectorProfile) {
  const ranked = candidates
    .filter((candidate) => !usedIds.has(candidate.id))
    .map((candidate) => ({ candidate, score: similarityScore(sourceProduct, candidate, collectorProfile) }))
    .filter((item) => Number.isFinite(item.score))
    .sort((a, b) => b.score - a.score || a.candidate.price - b.candidate.price || a.candidate.title.localeCompare(b.candidate.title));

  return ranked[0] || null;
}

function collectPageUpdates(manifest, productIndex) {
  const usedIds = new Set(
    (manifest.featuredProducts || [])
      .map((entry) => resolveManifestProduct(entry, productIndex).liveProduct?.id)
      .filter(Boolean)
  );

  const collectorProfile = manifest.collectorProfile || {};
  const updates = [];

  for (const entry of manifest.featuredProducts || []) {
    const resolved = resolveManifestProduct(entry, productIndex);
    const live = resolved.liveProduct;
    const unavailable = !live || live.totalInventory <= 0 || live.status !== 'active';
    if (!unavailable) continue;

    const sourceProduct = live || {
      id: resolved.productId ?? resolved.id ?? null,
      title: resolved.title || resolved.handle || 'Unknown piece',
      handle: resolved.handle || null,
      productType: resolved.productType || '',
      tags: resolved.tags || [],
      tier: resolved.tier || extractTier(resolved.tags || []),
      price: Number(resolved.price || 0),
    };

    const replacement = chooseReplacement(sourceProduct, productIndex.available, usedIds, collectorProfile);
    if (!replacement) {
      updates.push({
        status: 'needs-review',
        reason: 'No replacement candidate found',
        current: sourceProduct,
        replacement: null,
      });
      continue;
    }

    usedIds.add(replacement.candidate.id);
    updates.push({
      status: 'replace',
      reason: !live ? 'Featured product missing from Shopify response' : 'Featured product is sold out or inactive',
      current: sourceProduct,
      replacement: replacement.candidate,
      score: replacement.score,
    });
  }

  return updates;
}

function applyUpdatesToManifest(manifest, updates) {
  const replacementByHandle = new Map();
  const replacementById = new Map();

  for (const update of updates) {
    if (update.status !== 'replace' || !update.replacement) continue;
    if (update.current.handle) replacementByHandle.set(update.current.handle, update.replacement);
    if (update.current.id != null) replacementById.set(String(update.current.id), update.replacement);
  }

  const featuredProducts = (manifest.featuredProducts || []).map((entry) => {
    const normalized = canonicalizeFeaturedProduct(entry);
    const byId = normalized.productId != null ? replacementById.get(String(normalized.productId)) : null;
    const byHandle = normalized.handle ? replacementByHandle.get(normalized.handle) : null;
    const replacement = byId || byHandle;
    if (!replacement) return normalized;

    return {
      productId: replacement.id,
      handle: replacement.handle,
      title: replacement.title,
      price: replacement.price,
      tier: replacement.tier,
      productType: replacement.productType,
      tags: replacement.tags,
      url: replacement.url,
      swappedInAt: new Date().toISOString(),
      replacedHandle: normalized.handle || null,
    };
  });

  return {
    ...manifest,
    featuredProducts,
    lastEvaluatedAt: new Date().toISOString(),
  };
}

function renderMarkdown(report) {
  const lines = [];
  lines.push('# Landing Page Sync Report');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Landing pages scanned: ${report.pageCount}`);
  lines.push(`Pages needing updates: ${report.pagesNeedingUpdates}`);
  lines.push(`Replacement actions proposed: ${report.replacements}`);
  lines.push(`Manual review items: ${report.manualReviewItems}`);
  lines.push('');

  for (const page of report.pages) {
    lines.push(`## ${page.pageTitle}`);
    lines.push(`- File: ${page.file}`);
    if (page.collectorName) lines.push(`- Collector: ${page.collectorName}`);
    if (page.pageHandle) lines.push(`- Page handle: ${page.pageHandle}`);
    lines.push(`- Status: ${page.updates.length ? 'Needs refresh' : 'No changes needed'}`);
    lines.push('');

    if (!page.updates.length) {
      lines.push('- All featured pieces still look available.');
      lines.push('');
      continue;
    }

    for (const update of page.updates) {
      if (update.status === 'replace' && update.replacement) {
        lines.push(`- Replace **${update.current.title}** with **${update.replacement.title}**`);
        lines.push(`  - Why: ${update.reason}`);
        lines.push(`  - Match score: ${update.score}`);
        lines.push(`  - New link: ${update.replacement.url}`);
      } else {
        lines.push(`- Review needed for **${update.current.title}**`);
        lines.push(`  - Why: ${update.reason}`);
      }
    }
    lines.push('');
  }

  return `${lines.join('\n').trim()}\n`;
}

function loadUpdateLog(logPath) {
  if (!fs.existsSync(logPath)) return [];
  try {
    return readJson(logPath);
  } catch {
    return [];
  }
}

function appendUpdateLog(logPath, report) {
  const current = loadUpdateLog(logPath);
  current.push({
    generatedAt: report.generatedAt,
    replacements: report.replacements,
    pagesNeedingUpdates: report.pagesNeedingUpdates,
    pages: report.pages
      .filter((page) => page.updates.length)
      .map((page) => ({
        file: page.file,
        pageTitle: page.pageTitle,
        updates: page.updates,
      })),
  });
  writeJson(logPath, current);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    showHelp();
    process.exit(0);
  }

  ensureDir(args.manifestsDir);
  ensureDir(path.dirname(args.reportJson));
  ensureDir(path.dirname(args.reportMd));

  const manifestFiles = listManifestFiles(args.manifestsDir);
  if (!manifestFiles.length) {
    throw new Error(`No landing-page manifest files found in ${args.manifestsDir}`);
  }

  const products = await fetchAllProducts(args.includeDrafts);
  const productIndex = buildProductIndex(products);

  const pages = manifestFiles.map((filePath) => {
    const manifest = readJson(filePath);
    const updates = collectPageUpdates(manifest, productIndex);
    const relativeFile = path.relative(WORKSPACE_ROOT, filePath);
    return {
      filePath,
      relativeFile,
      manifest,
      updates,
      pageTitle: manifest.pageTitle || manifest.collectorName || path.basename(filePath, '.json'),
      collectorName: manifest.collectorName || null,
      pageHandle: manifest.pageHandle || null,
    };
  });

  const report = {
    generatedAt: new Date().toISOString(),
    pageCount: pages.length,
    pagesNeedingUpdates: pages.filter((page) => page.updates.length > 0).length,
    replacements: pages.reduce((sum, page) => sum + page.updates.filter((update) => update.status === 'replace').length, 0),
    manualReviewItems: pages.reduce((sum, page) => sum + page.updates.filter((update) => update.status !== 'replace').length, 0),
    availableCatalogCount: productIndex.available.length,
    pages: pages.map((page) => ({
      file: page.relativeFile,
      pageTitle: page.pageTitle,
      collectorName: page.collectorName,
      pageHandle: page.pageHandle,
      updates: page.updates,
    })),
  };

  writeJson(args.reportJson, report);
  fs.writeFileSync(args.reportMd, renderMarkdown(report), 'utf8');

  if (args.apply) {
    for (const page of pages) {
      if (!page.updates.some((update) => update.status === 'replace')) continue;
      const updatedManifest = applyUpdatesToManifest(page.manifest, page.updates);
      writeJson(page.filePath, updatedManifest);
    }
    appendUpdateLog(UPDATE_LOG_PATH, report);
  }

  process.stdout.write(`${JSON.stringify({
    ok: true,
    reportJson: args.reportJson,
    reportMd: args.reportMd,
    pageCount: report.pageCount,
    pagesNeedingUpdates: report.pagesNeedingUpdates,
    replacements: report.replacements,
    manualReviewItems: report.manualReviewItems,
    applied: args.apply,
  }, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

#!/usr/bin/env node
import https from 'https';
import fs from 'fs';

const SHOPIFY_STORE = process.env.SARAH_SHOPIFY_STORE || 'yr5azj-q0.myshopify.com';
const ACCESS_TOKEN = process.env.SARAH_SHOPIFY_ACCESS_TOKEN;
const OUTPUT_DIR = '/root/.openclaw/workspace/shared/sarah-agent/projects';
const JSON_OUTPUT_PATH = `${OUTPUT_DIR}/collection-merchandising-advisor.json`;
const MD_OUTPUT_PATH = `${OUTPUT_DIR}/collection-merchandising-advisor.md`;
const STOREFRONT_BASE_URL = process.env.SARAH_STOREFRONT_BASE_URL || 'https://sarahjschwartz.com/products';

const ART_PRODUCT_TYPES = new Set([
  'Contemporary Frame',
  'Vintage Frame',
  'Gold Frame',
  'Unique Frame',
  'Canvas',
  'Skateboard'
]);

const STORY_EDITS = [
  {
    key: 'soft-light-open-air',
    title: 'Soft Light + Open Air',
    shopperHook: 'For collectors who want a room to feel brighter, calmer, and a little more expansive.',
    merchandisingNote: 'Lead with airy landscapes and sky/ocean energy, then support with dreamy color pieces.',
    keywords: ['soft', 'landing', 'treetops', 'horizon', 'aurora', 'cloud', 'sky', 'morning', 'fog', 'ocean', 'oceanic', 'wave', 'tide', 'lagoon', 'golden', 'sunset', 'ridge', 'dunes', 'canyon', 'desert', 'beach']
  },
  {
    key: 'garden-party',
    title: 'Garden Party',
    shopperHook: 'For collectors drawn to romance, bloom, and playful botanical color.',
    merchandisingNote: 'Keep the page feeling lush and giftable, with florals and optimistic color stories together.',
    keywords: ['bloom', 'budding', 'flower', 'flowers', 'flora', 'garden', 'hibiscus', 'orchid', 'orchids', 'bouquet', 'petals', 'rose', 'lady slipper', 'flourishing']
  },
  {
    key: 'iridescent-pop',
    title: 'Iridescent Pop',
    shopperHook: 'For collectors who want the bold, glossy, dopamine-hit side of Sarah’s work.',
    merchandisingNote: 'Cluster the gradients, glow, and candy-color pieces so the visual impact compounds instead of scattering.',
    keywords: ['iridescent', 'gradient', 'glow', 'inner glow', 'disco', 'electric', 'magenta', 'cotton candy', 'bubble gum', 'pink', 'neon', 'opalite', 'gemstone', 'crystal', 'dazzle', 'shine']
  },
  {
    key: 'cozy-inner-life',
    title: 'Cozy Inner Life',
    shopperHook: 'For collectors who love intimate, bookish, homebody energy with emotional warmth.',
    merchandisingNote: 'Merchandise these as mood pieces for reading nooks, bedrooms, and thoughtful gifting.',
    keywords: ['book', 'books', 'bookshelf', 'bookworm', 'bed', 'sweater', 'candlelit', 'lullaby', 'postcard', 'note', 'notes', 'thought', 'thoughts', 'musings', 'solitude', 'closer', 'kiss', 'cozied', 'cozy']
  },
  {
    key: 'play-motion',
    title: 'Play + Motion',
    shopperHook: 'For collectors who want movement, travel, and a little mischief.',
    merchandisingNote: 'Use these for a higher-energy edit that feels social, youthful, and momentum-forward.',
    keywords: ['play', 'ride', 'rollercoaster', 'cannonball', 'camping', 'jet setter', 'showgirl', 'decked', 'balloon', 'run', 'go', 'nomadic', 'hikes', 'hiking', 'drive', 'wild']
  }
];

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

function shopifyRequestWithHeaders(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SHOPIFY_STORE,
      path: `/admin/api/2024-01${path}`,
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': ACCESS_TOKEN,
        'Content-Type': 'application/json'
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
            reject(new Error(`Shopify API ${res.statusCode}: ${parsed.errors || data || 'Unknown error'}`));
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

async function fetchAllProducts() {
  const products = [];
  let url = '/products.json?limit=250&status=active&fields=id,title,handle,product_type,tags,status,variants,image,published_at';
  while (url) {
    const { data, nextUrl } = await shopifyRequestWithHeaders(url);
    products.push(...(data.products || []));
    url = nextUrl;
  }
  return products;
}

function normalizeTags(tagString = '') {
  return tagString.split(',').map((tag) => tag.trim()).filter(Boolean);
}

function extractTier(tags = []) {
  const tierOrder = ['Minis', 'Darlings', 'Babes', 'Gems'];
  return tierOrder.find((tier) => tags.some((tag) => tag.toLowerCase() === tier.toLowerCase())) || 'Unassigned';
}

function extractPrice(product) {
  const prices = (product.variants || []).map((variant) => Number.parseFloat(variant.price || '0')).filter(Number.isFinite);
  return prices.length ? Math.min(...prices) : 0;
}

function slugify(input) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]+/g, ' ').split(/\s+/).filter(Boolean);
}

function isSellableArt(product) {
  if (!ART_PRODUCT_TYPES.has(product.product_type || '')) return false;
  return extractPrice(product) > 0;
}

function scoreProductForEdit(product, edit) {
  const haystack = `${product.title} ${(product.tags || '').replace(/,/g, ' ')} ${product.product_type || ''}`.toLowerCase();
  let score = 0;
  for (const keyword of edit.keywords) {
    if (haystack.includes(keyword.toLowerCase())) score += keyword.includes(' ') ? 3 : 2;
  }

  if (edit.key === 'iridescent-pop' && /iridescent gradient|mini iridescent/.test(haystack)) score += 3;
  if (edit.key === 'garden-party' && /(rose|orchid|garden|bloom)/.test(haystack)) score += 2;
  if (edit.key === 'soft-light-open-air' && /(cloud|ocean|morning|sunset|lagoon|desert)/.test(haystack)) score += 2;
  if (edit.key === 'cozy-inner-life' && /(book|note|thought|cozy|kiss|sweater)/.test(haystack)) score += 2;
  if (edit.key === 'play-motion' && /(play|ride|camping|jet setter|go\b|run\b|nomadic)/.test(haystack)) score += 2;

  return score;
}

function buildCandidate(product, score) {
  const tags = normalizeTags(product.tags);
  const tier = extractTier(tags);
  const price = extractPrice(product);
  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    productType: product.product_type || '',
    tier,
    tags,
    price,
    score,
    url: `${STOREFRONT_BASE_URL}/${product.handle}`
  };
}

function pickEditProducts(products, edit, globallyUsedIds) {
  const ranked = products
    .map((product) => buildCandidate(product, scoreProductForEdit(product, edit)))
    .filter((product) => product.score > 0 && !globallyUsedIds.has(product.id))
    .sort((a, b) => b.score - a.score || b.price - a.price || a.title.localeCompare(b.title));

  const picks = [];
  const tierTargets = ['Babes', 'Darlings', 'Darlings', 'Minis', 'Gems'];

  for (const tier of tierTargets) {
    const match = ranked.find((candidate) => candidate.tier === tier && !picks.some((pick) => pick.id === candidate.id));
    if (match) picks.push(match);
  }

  for (const candidate of ranked) {
    if (picks.length >= 6) break;
    if (!picks.some((pick) => pick.id === candidate.id)) picks.push(candidate);
  }

  picks.forEach((pick) => globallyUsedIds.add(pick.id));
  return picks;
}

function summarizeEdit(edit, picks) {
  const tiers = picks.reduce((acc, pick) => {
    acc[pick.tier] = (acc[pick.tier] || 0) + 1;
    return acc;
  }, {});
  const prices = picks.map((pick) => pick.price);
  return {
    key: edit.key,
    title: edit.title,
    shopperHook: edit.shopperHook,
    merchandisingNote: edit.merchandisingNote,
    pieceCount: picks.length,
    priceRange: picks.length ? `$${Math.min(...prices).toFixed(0)}-$${Math.max(...prices).toFixed(0)}` : '$0-$0',
    tierMix: Object.entries(tiers).map(([tier, count]) => `${tier} x${count}`).join(', '),
    hero: picks[0] || null,
    pieces: picks
  };
}

function buildCrossSellSections(products) {
  const byTier = products.reduce((acc, product) => {
    const tier = extractTier(normalizeTags(product.tags));
    (acc[tier] ||= []).push(product);
    return acc;
  }, {});

  return {
    minisUpsellTargets: (byTier.Minis || []).slice(0, 8).map((product) => product.title),
    darlingAnchors: (byTier.Darlings || []).slice(0, 8).map((product) => product.title),
    babeStatementPieces: (byTier.Babes || []).slice(0, 8).map((product) => product.title),
    gemsHeroMoments: (byTier.Gems || []).slice(0, 8).map((product) => product.title)
  };
}

function renderMarkdown(report) {
  const lines = [];
  lines.push('# Collection Merchandising Advisor');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Active art pieces analyzed: ${report.totalPieces}`);
  lines.push('');
  lines.push('## Recommended story-led shop edits');
  lines.push('');

  report.edits.forEach((edit, index) => {
    lines.push(`### ${index + 1}. ${edit.title}`);
    lines.push(`- Shopper hook: ${edit.shopperHook}`);
    lines.push(`- Merchandising note: ${edit.merchandisingNote}`);
    lines.push(`- Price range: ${edit.priceRange}`);
    lines.push(`- Size mix: ${edit.tierMix || 'Mixed'}`);
    if (edit.hero) {
      lines.push(`- Hero piece: **${edit.hero.title}** (${edit.hero.tier}, $${edit.hero.price.toFixed(0)})`);
    }
    lines.push('- Piece stack:');
    edit.pieces.forEach((piece) => {
      lines.push(`  - ${piece.title} (${piece.tier}, ${piece.productType}, $${piece.price.toFixed(0)})`);
    });
    lines.push('');
  });

  lines.push('## Merchandising moves');
  lines.push('');
  lines.push('- Keep each edit visually tight on color and mood instead of mixing every size family together.');
  lines.push('- Lead each edit with one higher-ticket anchor, then ladder in Darlings and Minis for easier entry points.');
  lines.push('- Reuse repeating families like Iridescent Gradient or Pink Lady as intentional series, not scattered singles.');
  lines.push('- Hide or separate non-art products from these edits so the shop reads like a curated gallery first.');
  lines.push('');
  lines.push('## Tier-based cross-sell notes');
  lines.push('');
  lines.push(`- Minis to feature near checkout: ${report.crossSell.minisUpsellTargets.slice(0, 5).join(', ')}`);
  lines.push(`- Darling anchors to repeat across category pages: ${report.crossSell.darlingAnchors.slice(0, 5).join(', ')}`);
  lines.push(`- Babe statement pieces to use as heroes: ${report.crossSell.babeStatementPieces.slice(0, 5).join(', ')}`);
  lines.push(`- Gems for premium spotlight moments: ${report.crossSell.gemsHeroMoments.slice(0, 5).join(', ')}`);
  lines.push('');
  return `${lines.join('\n')}\n`;
}

export async function generateCollectionMerchandisingAdvisor() {
  if (!ACCESS_TOKEN) {
    throw new Error('SARAH_SHOPIFY_ACCESS_TOKEN environment variable required');
  }

  const allProducts = await fetchAllProducts();
  const artProducts = allProducts.filter(isSellableArt);
  const globallyUsedIds = new Set();
  const edits = STORY_EDITS
    .map((edit) => summarizeEdit(edit, pickEditProducts(artProducts, edit, globallyUsedIds)))
    .filter((edit) => edit.pieces.length > 0);

  const report = {
    generatedAt: new Date().toISOString(),
    totalProductsFetched: allProducts.length,
    totalPieces: artProducts.length,
    edits,
    crossSell: buildCrossSellSections(artProducts)
  };

  fs.writeFileSync(JSON_OUTPUT_PATH, JSON.stringify(report, null, 2));
  fs.writeFileSync(MD_OUTPUT_PATH, renderMarkdown(report));
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateCollectionMerchandisingAdvisor()
    .then((report) => {
      console.log(`Wrote ${report.edits.length} shop edits to:`);
      console.log(`- ${MD_OUTPUT_PATH}`);
      console.log(`- ${JSON_OUTPUT_PATH}`);
    })
    .catch((error) => {
      console.error('Collection merchandising advisor error:', error.message);
      process.exit(1);
    });
}

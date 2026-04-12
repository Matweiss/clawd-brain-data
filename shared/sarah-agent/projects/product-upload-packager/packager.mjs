#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const DEFAULT_MAX_IMAGE_SIDE = 2400;

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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function normalizeList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function inferCategory(price) {
  const amount = Number(price || 0);
  if (amount <= 250) return 'Minis';
  if (amount <= 800) return 'Darlings';
  if (amount <= 1800) return 'Babes';
  return 'Gems';
}

function normalizePiece(piece, index) {
  const title = piece.title || normalizeList(piece.titleIdeas)[0] || `Untitled Piece ${index + 1}`;
  const width = Number(piece.widthInches ?? piece.width ?? 0) || null;
  const height = Number(piece.heightInches ?? piece.height ?? 0) || null;
  const depth = Number(piece.depthInches ?? piece.depth ?? 0) || null;
  const price = Number(piece.price ?? 0) || 0;
  const medium = String(piece.medium || '').trim();
  const storyNotes = normalizeList(piece.storyNotes || piece.notes);
  const palette = normalizeList(piece.palette);
  const subject = normalizeList(piece.subject);
  const mood = normalizeList(piece.mood);
  const tags = normalizeList(piece.tags);
  const seoKeywords = normalizeList(piece.seoKeywords || piece.keywords);
  const photos = normalizeList(piece.photos || piece.images);
  const productType = piece.productType || 'Original Artwork';
  const category = piece.category || inferCategory(price);
  const printSizes = Array.isArray(piece.printSizes) ? piece.printSizes : [];

  return {
    id: piece.id || `${slugify(title)}-${index + 1}`,
    title,
    handle: piece.handle || slugify(title),
    medium,
    widthInches: width,
    heightInches: height,
    depthInches: depth,
    price,
    storyNotes,
    palette,
    subject,
    mood,
    tags,
    seoKeywords,
    photos,
    status: piece.status || 'draft',
    productType,
    category,
    room: piece.room || '',
    collection: piece.collection || '',
    framing: piece.framing || '',
    orientation: piece.orientation || (width && height ? (width >= height ? 'landscape' : 'portrait') : ''),
    printSizes,
    titleIdeas: normalizeList(piece.titleIdeas)
  };
}

function buildDescription(piece) {
  const lines = [];
  if (piece.storyNotes.length) {
    lines.push(`<p>${piece.storyNotes.join(' ')}</p>`);
  }

  const details = [];
  if (piece.medium) details.push(`<li><strong>Medium:</strong> ${piece.medium}</li>`);
  if (piece.widthInches && piece.heightInches) details.push(`<li><strong>Dimensions:</strong> ${piece.widthInches}\" x ${piece.heightInches}\"${piece.depthInches ? ` x ${piece.depthInches}\"` : ''}</li>`);
  if (piece.framing) details.push(`<li><strong>Framing:</strong> ${piece.framing}</li>`);
  if (piece.orientation) details.push(`<li><strong>Orientation:</strong> ${piece.orientation}</li>`);
  if (piece.collection) details.push(`<li><strong>Collection:</strong> ${piece.collection}</li>`);
  if (piece.room) details.push(`<li><strong>Best fit:</strong> ${piece.room}</li>`);
  if (details.length) lines.push(`<ul>${details.join('')}</ul>`);

  lines.push('<p>This listing is staged as a draft for Sarah review before publish.</p>');
  return lines.join('\n');
}

function buildSeo(piece) {
  const keywordText = [...piece.palette, ...piece.subject, ...piece.seoKeywords].slice(0, 6).join(', ');
  const seoTitle = `${piece.title} | ${piece.medium || 'Original Artwork'} by Sarah Schwartz`.slice(0, 70);
  const seoDescription = `${piece.title}${piece.medium ? ` is a ${piece.medium.toLowerCase()}` : ''}${piece.widthInches && piece.heightInches ? ` sized ${piece.widthInches} x ${piece.heightInches} inches` : ''}${keywordText ? `. Keywords: ${keywordText}` : ''}.`.slice(0, 320);
  return { seoTitle, seoDescription };
}

function buildTags(piece) {
  const combined = [
    piece.category,
    piece.productType,
    piece.medium,
    piece.collection,
    piece.orientation,
    ...piece.palette,
    ...piece.subject,
    ...piece.mood,
    ...piece.tags
  ];
  return [...new Set(combined.map((item) => String(item || '').trim()).filter(Boolean))];
}

function optimizeImage(sourcePath, outputPath, maxSide = DEFAULT_MAX_IMAGE_SIDE) {
  ensureDir(path.dirname(outputPath));
  const python = `
from PIL import Image, ImageOps
src = r'''${sourcePath.replace(/'/g, "\\'")}'''
out = r'''${outputPath.replace(/'/g, "\\'")}'''
max_side = ${Number(maxSide) || DEFAULT_MAX_IMAGE_SIDE}
img = Image.open(src)
img = ImageOps.exif_transpose(img)
if img.mode not in ('RGB', 'L'):
    img = img.convert('RGB')
if max(img.size) > max_side:
    img.thumbnail((max_side, max_side))
img.save(out, optimize=True, quality=90)
print(f"{img.size[0]}x{img.size[1]}")
`;
  const dimensions = execFileSync('python3', ['-c', python], { encoding: 'utf8' }).trim();
  const [width, height] = dimensions.split('x').map((value) => Number(value));
  return { width, height, outputPath };
}

function resolvePhotoPath(baseDir, photoPath) {
  return path.isAbsolute(photoPath) ? photoPath : path.resolve(baseDir, photoPath);
}

function packagePiece(piece, options) {
  const imageOutputDir = path.join(options.outputDir, 'images', piece.handle);
  const optimizedImages = piece.photos.map((photoPath, index) => {
    const sourcePath = resolvePhotoPath(options.inputDir, photoPath);
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Photo not found for ${piece.title}: ${sourcePath}`);
    }
    const ext = '.jpg';
    const outputPath = path.join(imageOutputDir, `${piece.handle}-${String(index + 1).padStart(2, '0')}${ext}`);
    const optimized = optimizeImage(sourcePath, outputPath, options.maxImageSide);
    return {
      src: path.relative(options.outputDir, outputPath),
      alt: `${piece.title} by Sarah Schwartz, view ${index + 1}`,
      position: index + 1,
      width: optimized.width,
      height: optimized.height
    };
  });

  const tags = buildTags(piece);
  const seo = buildSeo(piece);
  const variants = piece.printSizes.length
    ? piece.printSizes.map((variant, index) => ({
        option1: variant.label || `${variant.widthInches}\" x ${variant.heightInches}\"`,
        price: Number(variant.price || 0).toFixed(2),
        sku: `${piece.handle}-print-${index + 1}`,
        inventory_policy: 'continue',
        fulfillment_service: 'manual'
      }))
    : [{
        option1: 'Original',
        price: Number(piece.price || 0).toFixed(2),
        sku: `${piece.handle}-original`,
        inventory_policy: 'deny',
        fulfillment_service: 'manual'
      }];

  return {
    title: piece.title,
    handle: piece.handle,
    status: piece.status,
    product_type: piece.productType,
    vendor: 'Sarah Schwartz',
    tags: tags.join(', '),
    template_suffix: 'orphan-draft',
    body_html: buildDescription(piece),
    seo,
    metafields: {
      category: piece.category,
      widthInches: piece.widthInches,
      heightInches: piece.heightInches,
      depthInches: piece.depthInches,
      palette: piece.palette,
      subject: piece.subject,
      mood: piece.mood,
      titleIdeas: piece.titleIdeas
    },
    options: [{ name: 'Edition', values: variants.map((variant) => variant.option1) }],
    variants,
    images: optimizedImages
  };
}

function buildMarkdownReport(result) {
  const lines = [];
  lines.push('# Product Upload Packager');
  lines.push('');
  lines.push(`Generated: ${result.generatedAt}`);
  lines.push(`Pieces packaged: ${result.summary.pieceCount}`);
  lines.push(`Images optimized: ${result.summary.imageCount}`);
  lines.push('');
  result.listings.forEach((listing, index) => {
    lines.push(`## ${index + 1}. ${listing.title}`);
    lines.push(`- Handle: ${listing.handle}`);
    lines.push(`- Status: ${listing.status}`);
    lines.push(`- Product type: ${listing.product_type}`);
    lines.push(`- Tags: ${listing.tags}`);
    lines.push(`- Variants: ${listing.variants.map((variant) => `${variant.option1} ($${variant.price})`).join(', ')}`);
    lines.push(`- Images: ${listing.images.map((image) => image.src).join(', ')}`);
    lines.push(`- SEO title: ${listing.seo.seoTitle}`);
    lines.push('');
  });
  return `${lines.join('\n')}\n`;
}

function buildCsv(listings) {
  const rows = [['Handle', 'Title', 'Status', 'Product Type', 'Tags', 'Variant Options', 'Image Count', 'SEO Title']];
  for (const listing of listings) {
    rows.push([
      listing.handle,
      listing.title,
      listing.status,
      listing.product_type,
      listing.tags,
      listing.variants.map((variant) => variant.option1).join(' | '),
      listing.images.length,
      listing.seo.seoTitle
    ]);
  }
  return `${rows.map((row) => row.map(csvEscape).join(',')).join('\n')}\n`;
}

export function packageListings({ inputFile, outputDir, maxImageSide = DEFAULT_MAX_IMAGE_SIDE }) {
  const resolvedInputFile = path.resolve(inputFile);
  const resolvedOutputDir = path.resolve(outputDir);
  const inputDir = path.dirname(resolvedInputFile);
  const payload = readJson(resolvedInputFile);
  const pieces = Array.isArray(payload.pieces) ? payload.pieces : [];
  if (!pieces.length) {
    throw new Error('Input must include a non-empty pieces array');
  }

  ensureDir(resolvedOutputDir);
  const listings = pieces.map((piece, index) => packagePiece(normalizePiece(piece, index), {
    inputDir,
    outputDir: resolvedOutputDir,
    maxImageSide
  }));

  const result = {
    generatedAt: new Date().toISOString(),
    source: resolvedInputFile,
    summary: {
      pieceCount: listings.length,
      imageCount: listings.reduce((sum, listing) => sum + listing.images.length, 0)
    },
    listings
  };

  writeJson(path.join(resolvedOutputDir, 'shopify-draft-listings.json'), result);
  fs.writeFileSync(path.join(resolvedOutputDir, 'shopify-draft-listings.csv'), buildCsv(listings));
  fs.writeFileSync(path.join(resolvedOutputDir, 'shopify-draft-listings.md'), buildMarkdownReport(result));
  return result;
}

function printUsage() {
  console.log(`Usage:\n  node packager.mjs --input ./raw-pieces.json --output-dir ./product-upload-output [--max-image-side 2400]`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.input || !args['output-dir']) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  const result = packageListings({
    inputFile: args.input,
    outputDir: args['output-dir'],
    maxImageSide: args['max-image-side'] ? Number(args['max-image-side']) : DEFAULT_MAX_IMAGE_SIDE
  });
  console.log(JSON.stringify({ ok: true, outputDir: path.resolve(args['output-dir']), summary: result.summary }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

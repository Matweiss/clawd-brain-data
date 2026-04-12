import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { packageListings } from './product-upload-packager/packager.mjs';

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'product-upload-packager-'));
}

function createImage(filePath, width = 3000, height = 2000, color = 'skyblue') {
  execFileSync('python3', ['-c', `from PIL import Image; Image.new('RGB', (${width}, ${height}), '${color}').save(r'''${filePath}''')`]);
}

test('packages multiple pieces into draft shopify outputs with optimized images', () => {
  const baseDir = makeTempDir();
  const assetsDir = path.join(baseDir, 'assets');
  const outputDir = path.join(baseDir, 'output');
  fs.mkdirSync(assetsDir, { recursive: true });

  createImage(path.join(assetsDir, 'piece-one.png'), 3200, 1800, 'pink');
  createImage(path.join(assetsDir, 'piece-two.png'), 1600, 2400, 'navy');

  const inputPath = path.join(baseDir, 'raw-pieces.json');
  fs.writeFileSync(inputPath, JSON.stringify({
    pieces: [
      {
        titleIdeas: ['Rose Drift'],
        medium: 'Oil on canvas',
        widthInches: 20,
        heightInches: 24,
        price: 950,
        storyNotes: ['Romantic floral study with warm light.'],
        palette: ['rose', 'cream'],
        subject: ['floral'],
        mood: ['romantic'],
        tags: ['drop-a'],
        photos: ['./assets/piece-one.png']
      },
      {
        title: 'Night Current',
        medium: 'Acrylic on canvas',
        widthInches: 12,
        heightInches: 12,
        price: 175,
        storyNotes: ['Deep blue piece with calm movement.'],
        palette: ['navy', 'white'],
        subject: ['abstract'],
        mood: ['calm'],
        tags: ['drop-a'],
        photos: ['./assets/piece-two.png'],
        printSizes: [{ label: '8x8 print', widthInches: 8, heightInches: 8, price: 55 }]
      }
    ]
  }, null, 2));

  const result = packageListings({ inputFile: inputPath, outputDir, maxImageSide: 1200 });

  assert.equal(result.summary.pieceCount, 2);
  assert.equal(result.summary.imageCount, 2);

  const jsonPath = path.join(outputDir, 'shopify-draft-listings.json');
  const csvPath = path.join(outputDir, 'shopify-draft-listings.csv');
  const mdPath = path.join(outputDir, 'shopify-draft-listings.md');
  assert.ok(fs.existsSync(jsonPath));
  assert.ok(fs.existsSync(csvPath));
  assert.ok(fs.existsSync(mdPath));

  const packaged = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  assert.equal(packaged.listings[0].handle, 'rose-drift');
  assert.match(packaged.listings[0].tags, /Babes/);
  assert.equal(packaged.listings[1].variants[0].option1, '8x8 print');

  const optimizedImage = path.join(outputDir, packaged.listings[0].images[0].src);
  assert.ok(fs.existsSync(optimizedImage));
  assert.match(optimizedImage, /rose-drift-01\.jpg$/);
  assert.ok(packaged.listings[0].images[0].width <= 1200);
  assert.ok(packaged.listings[0].images[0].height <= 1200);

  const csv = fs.readFileSync(csvPath, 'utf8');
  assert.match(csv, /Rose Drift/);
  assert.match(csv, /Night Current/);

  const markdown = fs.readFileSync(mdPath, 'utf8');
  assert.match(markdown, /Pieces packaged: 2/);
});

test('throws when a referenced photo is missing', () => {
  const baseDir = makeTempDir();
  const inputPath = path.join(baseDir, 'raw-pieces.json');
  fs.writeFileSync(inputPath, JSON.stringify({
    pieces: [{
      title: 'Missing Image Piece',
      medium: 'Acrylic',
      price: 100,
      photos: ['./assets/not-found.jpg']
    }]
  }, null, 2));

  assert.throws(() => packageListings({ inputFile: inputPath, outputDir: path.join(baseDir, 'output') }), /Photo not found/);
});

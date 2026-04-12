# Product Upload Packager

Purpose: turn Sarah's raw piece notes and photos into draft Shopify-ready listings she can review before publish.

## What it does
- accepts one JSON file with one or more pieces
- optimizes and renames source images into a clean Shopify import asset folder
- generates draft listing output in JSON, CSV, and markdown
- creates tags, SEO copy, dimensions, product body copy, and print variants when provided
- keeps everything in draft/orphan-review mode for Sarah approval

## Run it
```bash
node /root/.openclaw/workspace/shared/sarah-agent/projects/product-upload-packager/packager.mjs \
  --input /root/.openclaw/workspace/shared/sarah-agent/projects/product-upload-packager/sample-raw-pieces.json \
  --output-dir /root/.openclaw/workspace/shared/sarah-agent/projects/product-upload-packager/output
```

## Input shape
```json
{
  "pieces": [
    {
      "titleIdeas": ["Blue Bloom", "Bloom Study"],
      "medium": "Acrylic on canvas",
      "widthInches": 24,
      "heightInches": 30,
      "price": 1200,
      "storyNotes": [
        "Painted after a beach walk at dusk.",
        "Soft blue and warm gold tones."
      ],
      "palette": ["blue", "gold", "white"],
      "subject": ["floral", "abstract"],
      "mood": ["calm", "uplifting"],
      "tags": ["newsletter-drop", "spring"],
      "seoKeywords": ["blue floral painting", "original acrylic art"],
      "photos": ["./sample-assets/blue-bloom-source.jpg"],
      "printSizes": [
        { "label": "8x10 print", "widthInches": 8, "heightInches": 10, "price": 65 }
      ]
    }
  ]
}
```

## Output files
- `shopify-draft-listings.json` — full draft payload with images/metafields
- `shopify-draft-listings.csv` — quick spreadsheet/import review format
- `shopify-draft-listings.md` — human-readable checklist/report
- `images/` — optimized, renamed source assets

## Review rule
This tool does not publish anything to Shopify. It stages draft listing packs for Sarah to review first.

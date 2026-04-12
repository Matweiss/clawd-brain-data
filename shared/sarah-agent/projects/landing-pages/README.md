# Landing page manifests

Each collector page lives in one JSON file.

## Shape

```json
{
  "collectorName": "Ashley Wall",
  "pageTitle": "Ashley Wall Collector Edit",
  "pageHandle": "collectors-ashley-wall",
  "collectorProfile": {
    "preferredTiers": ["Babes", "Darlings"],
    "preferredTags": ["Iridescent", "Glow", "Pink"]
  },
  "featuredProducts": [
    {
      "productId": 123456789,
      "handle": "piece-handle",
      "title": "Piece Title",
      "price": 1200,
      "tier": "Babes",
      "productType": "Contemporary Frame",
      "tags": ["Babes", "Glow"]
    }
  ]
}
```

## Usage

Preview recommendations:

```bash
node /root/.openclaw/workspace/shared/sarah-agent/projects/landing-page-auto-update.mjs
```

Apply replacements into the local manifests and append `update-log.json`:

```bash
node /root/.openclaw/workspace/shared/sarah-agent/projects/landing-page-auto-update.mjs --apply
```

Notes:
- Shopify is the source of truth for live product availability.
- Local manifest JSON is the source of truth for which pieces appear on each collector page.
- This version updates manifest files and generates a review report. It does not push Shopify page-body edits yet.

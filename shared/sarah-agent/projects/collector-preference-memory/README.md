# Collector preference memory

A lightweight Sarah-side tool for remembering collector tastes and ranking likely buyers for a new piece before public launch.

## What it does
- stores reusable collector preference profiles
- captures aesthetic preferences, size comfort, budget lanes, and VIP/first-look status
- scores a new piece against known collectors
- generates a review-first shortlist with reasons and draft outreach angles

## Files
- `memory.mjs` — CLI for managing collector profiles and generating buyer matches
- `data/collector-preferences.json` — local source of truth
- `reports/` — generated shortlist reports
- `new-piece-template.json` — starter schema for a new work

## Add or update a collector
```bash
node shared/sarah-agent/projects/collector-preference-memory/memory.mjs upsert-collector \
  --name "Ashley Wall" \
  --email "ashley@example.com" \
  --segment VIP \
  --lifetime-spend 18420 \
  --first-look yes \
  --mediums acrylic,mixed-media \
  --palette bold-color,pink,blue,gold \
  --themes abstract,floral,statement \
  --moods energetic,optimistic,lush \
  --orientations portrait,square \
  --min-width 20 \
  --max-width 48 \
  --min-height 20 \
  --max-height 60 \
  --min-price 1800 \
  --max-price 8000 \
  --notes "Responds best to private first-look access and strong color stories."
```

## Match a new piece before launch
```bash
node shared/sarah-agent/projects/collector-preference-memory/memory.mjs match-piece \
  --piece-file shared/sarah-agent/projects/collector-preference-memory/new-piece-template.json \
  --min-score 0.45
```

## List collector profiles
```bash
node shared/sarah-agent/projects/collector-preference-memory/memory.mjs list-collectors
```

## Matching model
The score is weighted across:
- medium fit
- theme overlap
- mood overlap
- palette overlap
- size fit
- price fit
- orientation fit
- relationship priority (VIP / first-look)

This tool never sends outbound messages. It only creates a ranked shortlist for Sarah to review.

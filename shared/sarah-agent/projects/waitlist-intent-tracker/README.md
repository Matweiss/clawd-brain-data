# Waitlist intent tracker

A lightweight Sarah-side tool for capturing interest in sold pieces and reviewing who should get a personal heads-up when similar work is coming.

## What it does
- stores missed-piece interest with collector details
- captures piece attributes that matter for matching
- scores new pieces against open waitlist entries
- generates a review-first report Sarah can use before sending any outreach

## Files
- `tracker.mjs` — CLI for adding interest and generating match reports
- `data/waitlist-intents.json` — local source of truth
- `reports/` — generated match reports
- `new-piece-template.json` — starter schema for new work

## Add a collector to the waitlist
```bash
node shared/sarah-agent/projects/waitlist-intent-tracker/tracker.mjs add-interest \
  --collector-name "Jane Doe" \
  --collector-email "jane@example.com" \
  --piece-title "Blue Horizon" \
  --piece-id "blue-horizon" \
  --medium acrylic \
  --width 24 \
  --height 30 \
  --orientation portrait \
  --palette blue,gold,white \
  --subject seascape,horizon \
  --mood calm,hopeful \
  --intent "Loved the sold piece and wants first shot at anything similar"
```

## Generate a match report for a new piece
```bash
node shared/sarah-agent/projects/waitlist-intent-tracker/tracker.mjs alert-matches \
  --piece-file shared/sarah-agent/projects/waitlist-intent-tracker/new-piece-template.json \
  --min-score 0.45
```

## Review open entries
```bash
node shared/sarah-agent/projects/waitlist-intent-tracker/tracker.mjs list-open
```

## Matching model
The score is weighted across:
- medium
- subject overlap
- mood overlap
- palette overlap
- size similarity
- orientation

This is meant to create a short, believable outreach queue, not auto-send messages.

## Sarah control rule
The tool never sends outbound communication. It only creates a shortlist and draft language for Sarah to review.

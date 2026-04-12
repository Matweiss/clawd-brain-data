# Launch Calendar Orchestrator

Purpose: map Sarah's release workflow into one timeline across product prep, landing pages, newsletter, and Instagram.

## What it does
- Takes a single release date
- Builds the default Sarah launch cadence
- Outputs a clean markdown plan or JSON
- Lets you override owners, channels, offsets, notes, and checklist items per step

## Default launch rhythm
- Day -5: product prep
- Day -3: landing page updates
- Day 0: newsletter early access
- Day 0 evening: Instagram warmup
- Day +1: Instagram public launch

This matches Sarah's real workflow from the interview: hidden/orphan product setup first, subscriber-first launch, then Instagram 24 hours later.

## Run it
```bash
node /root/.openclaw/workspace/shared/sarah-agent/projects/launch-calendar-orchestrator.mjs \
  --input /root/.openclaw/workspace/shared/sarah-agent/projects/launch-calendar-sample.json
```

## Write output to a file
```bash
node /root/.openclaw/workspace/shared/sarah-agent/projects/launch-calendar-orchestrator.mjs \
  --input /root/.openclaw/workspace/shared/sarah-agent/projects/launch-calendar-sample.json \
  --output /root/.openclaw/workspace/shared/sarah-agent/projects/launch-calendar-sample.md
```

## Input shape
```json
{
  "releaseName": "Spring Minis Drop",
  "releaseDate": "2026-04-18",
  "defaultTimeOfDay": "16:00",
  "theme": "Fresh spring color story",
  "audience": "Newsletter first, then Instagram",
  "links": {
    "privateCollectionPage": "https://...",
    "publicCollectionPage": "https://..."
  },
  "overrides": {
    "newsletter": {
      "notes": "Saturday send",
      "checklist": ["Add VIP CTA"]
    }
  }
}
```

## Step keys you can override
- `productPrep`
- `landingPages`
- `newsletter`
- `instagramWarmup`
- `instagramLaunch`

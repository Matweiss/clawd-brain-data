# Production Source Recovery

Recovered on 2026-08-26 from the active Lucra ROI Calculator production deployment.

## Production identity

- Vercel project: `lucra-roi-calculator`
- Vercel project ID: `prj_cptCMUoHbrcg9nGAuYOVkai5yWOz`
- Production deployment ID: `dpl_9e6JH8NrZwmAKZpRq9ZVb3J4XrsT`
- Production deployment URL: `lucra-roi-calculator-m52rxp8co-mats-projects-bc1a3570.vercel.app`
- Canonical alias: `lucra-roi-calculator.vercel.app`
- Vercel-recorded Git commit: `b4bf4b614451a588114331d45a39146c02e68059`
- Vercel-recorded Git ref: `feature/digital-media-roi`

## Canonical served source

- File: `apps/lucra-roi/api/app.html`
- Size: `481072` bytes
- SHA-256: `dff7231344915007dd91d79c0e76867438289277f802a879c5a49825adbb2422`
- Raw SHA-1: `e8a5efbc1c18c29fa4c79d446e994de1ed9520eb`

The file downloaded from Vercel's authenticated deployment-file API is byte-for-byte identical to the HTTP response served at the canonical production alias. No normalization or formatting changes were applied.

Thirty deployed files under `apps/lucra-roi/` match the recovered Git commit by raw SHA-1. The only deployment-only file was the generated Playwright state file `test-results/.last-run.json`; it is not required to reproduce the deployment.

## Required markers

- `Launch Forecast`
- `Wager Break-even`
- `Digital Media ROI`
- `tab-digitalmedia`
- `audienceBasis==='location'`

## Lineage

`6c14f680bc0f6d4f270a55493b6774a56720457c` is an ancestor of the recovered production commit. The Digital Media implementation was added in `ba7a7f84b9d59339deef5e0876a48291efc0482e`, followed by the production fixes in `b4bf4b614451a588114331d45a39146c02e68059`.

Before merging this recovery branch, preserve the canonical file hash above and use a normal merge or pull request. Do not replace it with the stale `apps/lucra-roi/index.html`.

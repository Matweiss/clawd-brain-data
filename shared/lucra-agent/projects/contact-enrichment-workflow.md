# Contact Enrichment Workflow
**Owner:** Luke
**Human:** Mat Weiss
**Company:** Lucra
**Created:** 2026-04-11
**Status:** Active

## Purpose
When a new prospect enters the CRM with missing fields, fill the gaps fast enough to improve call prep and routing without pretending uncertain data is fact.

## Trigger
Run this workflow when a prospect record is missing any of the following:
- contact title
- LinkedIn URL
- company size / employee range
- company description
- HQ / location
- source confidence

## Required Output
For each enriched prospect, return:
- **Name**
- **Company**
- **Title**
- **LinkedIn URL**
- **Company size**
- **HQ**
- **Company description**
- **Evidence links**
- **Confidence:** high / medium / low
- **Open gaps:** anything still unknown

## Source Priority
Use sources in this order:
1. company website team/about pages
2. LinkedIn company or profile pages
3. recent press releases or newsroom pages
4. Crunchbase or other secondary databases
5. reputable directories only if primary sources fail

Rule: prefer fewer high-quality sources over many weak ones.

## Confidence Rules
### High
- Two independent sources agree, or
- One primary source states it directly

### Medium
- One strong secondary source, or
- Older source that is probably still valid

### Low
- Partial match only
- Directory data without primary confirmation
- Anything inferred from context

If confidence is low, label it low. Do not upgrade it just to fill the field.

## Field-by-Field Rules
### Title
- Use exact current title when found
- If multiple titles appear, prefer newest dated source
- If unclear, log both possibilities in notes and mark low confidence

### LinkedIn URL
- Capture the canonical profile URL when possible
- If only a search result is available, mark medium or low confidence

### Company size
- Prefer company About page or LinkedIn company page
- If range differs across sources, note the discrepancy

### Company description
- Keep to one sentence
- Use the company's own language where possible

### HQ
- Prefer company site footer, contact page, or official filings

## Research Steps
1. Confirm person and company are the right match
2. Find current title
3. Find LinkedIn profile
4. Find company size and HQ
5. Write one-sentence company description
6. Attach 2 to 4 evidence links
7. Assign confidence per field and overall confidence
8. Flag anything unresolved instead of guessing

## Suggested Output Format
```markdown
# Contact Enrichment Card
- Name:
- Company:
- Title:
- LinkedIn:
- Company size:
- HQ:
- Company description:
- Confidence:
- Open gaps:

## Evidence
- [Source title](URL)
- [Source title](URL)
- [Source title](URL)
```

## CRM Update Standard
If Luke copies this into HubSpot or another CRM, only update fields supported by evidence.
Unknown stays unknown.

## Why This Matters
Cleaner contact data means:
- faster pre-call prep
- better routing by persona
- cleaner ICP analysis
- fewer wasted touches to the wrong contact

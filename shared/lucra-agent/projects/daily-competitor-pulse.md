# Daily Competitor Pulse
**Owner:** Luke
**Human:** Mat Weiss
**Company:** Lucra
**Created:** 2026-04-11
**Status:** Active

## Purpose
Give Mat fresh competitive context each workday so Lucra positioning stays current in live calls, follow-ups, and outbound.

## Delivery
Include a short competitor section in Luke's weekday morning briefing.

Output format:
```markdown
## Competitor Pulse
- [Competitor] — [what happened] | Why it matters to Lucra: [one line] | Source: [link]
- [Competitor] — [what happened] | Why it matters to Lucra: [one line] | Source: [link]
```

If there is no meaningful update:
```markdown
## Competitor Pulse
- No material competitor news in the last 24 hours.
```

## Competitor Set
Start with these names and expand when Lucra's real field view gets sharper:
- Skillz
- GAN
- Arkadium
- Wildfire
- Betr
- PrizePicks
- Underdog
- Sleeper

Rule: prioritize companies that overlap with Lucra's positioning around gaming, engagement, loyalty, white-label competition, or real-money social play.

## What Counts As Signal
Only surface items that could change positioning, urgency, or objections:
- funding rounds
- product launches
- major partnerships
- venue or distribution wins
- regulatory or compliance developments
- leadership hires or departures
- customer wins / losses
- shutdowns, layoffs, or strategic pivots

Skip low-signal noise like generic blog posts or recycled thought leadership.

## Research Window
- Default: last 24 hours on weekdays
- If no signal in 24 hours, widen to 7 days once, then report only truly material items

## Research Standard
For each item:
1. confirm the company match
2. capture the event in one sentence
3. explain why Mat should care in one sentence
4. attach the source
5. avoid speculation beyond the evidence

## Prioritization
### High priority
- a move that strengthens a competitor in Lucra's core wedge
- a new partnership or rollout in hospitality, sports, or entertainment venues
- a compliance or payments development that changes objections

### Medium priority
- adjacent product launches or expansions
- relevant executive hires
- new audience or channel expansion

### Low priority
- soft PR with no commercial implication
- old news resurfacing without a new development

## Logging
Track the last completed pulse in `memory/heartbeat-state.json` under:
```json
{
  "lastCompetitorPulse": "2026-04-11"
}
```

## Operating Rules
- Weekdays only, PT
- Keep it brief, useful, and sourced
- Maximum 3 items per morning briefing
- If nothing matters, say so clearly
- Do not invent a competitive threat just to fill space

## Why This Matters
Mat sells better when he knows:
- which competitors are getting louder
- where Lucra's differentiation is sharpening
- what proof points and objection handling matter today

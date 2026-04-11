# Custom Research Requests Framework

TL;DR
- Intake every ad hoc request with 5 required fields: topic, depth, deadline, format, decision to support.
- Execute with a fixed research pipeline: scope, source, verify, synthesize, deliver.
- Every deliverable must include citations and confidence labels.
- Archive each request so future research compounds instead of restarting from zero.

## 1. Intake Standard
Create one request record per assignment.

Required fields:
- **Request name**
- **Topic / question**
- **Why it matters**
- **Depth**: quick scan, standard brief, deep dive
- **Deadline**
- **Output format**: bullets, memo, report, slides outline, talking points
- **Audience**
- **Known constraints**

Suggested intake template:
```markdown
# Research Request
- Request name:
- Topic / question:
- Why this matters:
- Deadline:
- Audience:
- Depth: quick scan | standard brief | deep dive
- Output format: bullets | memo | report | slides outline | talking points
- Constraints:
- Known context:
- Priority sources:
```

## 2. Depth Levels
### Quick scan
- Goal: answer fast
- Timebox: 10 to 20 minutes
- Sources: 2 to 4 quality sources
- Output: 3 to 7 bullets with links

### Standard brief
- Goal: support a meeting, decision, or outreach
- Timebox: 30 to 60 minutes
- Sources: 4 to 8 sources
- Output: concise brief with synthesis, implications, citations, confidence

### Deep dive
- Goal: full landscape understanding
- Timebox: 90+ minutes
- Sources: 8+ sources across primary and secondary material
- Output: structured report or slides outline with risks, open questions, and recommendation

## 3. Research Pipeline
### Step 1: Frame the question
Define:
- what must be answered
- what would be nice to know
- what decision the research should support

### Step 2: Source plan
Prioritize sources in this order:
1. company primary sources
2. regulatory / legal / public filings
3. reputable press
4. partner or customer sources
5. analyst / market context

### Step 3: Evidence capture
For every fact worth keeping, log:
- claim
- source URL or file path
- date
- confidence: high | medium | low
- note on ambiguity if needed

### Step 4: Synthesis
Convert evidence into:
- what happened
- why it matters
- what is uncertain
- what the user should do next

### Step 5: Delivery
Match the output to the requested format, but always include:
- TL;DR first
- source citations
- explicit confidence labels where uncertainty matters

## 4. Output Formats
### Brief
Best for fast decisions.
```markdown
# [Topic]
## TL;DR
- ...

## Key Findings
- Finding | Why it matters | Source

## Risks / Unknowns
- ...

## Recommended Next Step
- ...
```

### Report
Best for deeper synthesis.
```markdown
# [Topic]
## TL;DR
## Question
## Findings
## Implications
## Risks / Unknowns
## Recommendation
## Sources
```

### Slides Outline
Best for executive use.
```markdown
# [Topic] Slides Outline
1. Executive takeaway
2. Market / context
3. Evidence
4. Implications
5. Recommendation
6. Appendix / sources
```

### Talking Points
Best for meetings and calls.
```markdown
# [Topic] Talking Points
- Main point:
- Proof point:
- Likely objection:
- Response:
- Source:
```

## 5. Quality Bar
Every finished request should pass this check:
- answer is matched to the question asked
- sources are visible
- claims and implications are separated
- stale information is dated
- uncertainty is acknowledged, not hidden
- next step is clear

## 6. Progress Updates
For longer work, send lightweight updates at these milestones:
- scope locked
- source collection complete
- synthesis underway
- final delivered

Suggested format:
- **Progress:** scoped / sourcing / synthesizing / finalizing
- **What changed:** one line
- **Risk:** only if blocked

## 7. Archive Standard
Save each request under `research-archive/YYYY-MM-DD-topic.md`.

Archive fields:
- request metadata
- final output
- source list
- open questions
- reusable notes

Why:
- avoids duplicate work
- preserves source trails
- builds institutional memory

## 8. Confidence Scoring
Use this simple rubric:
- **High**: primary source or multiple strong sources agree
- **Medium**: good secondary source, limited corroboration
- **Low**: directional signal only, incomplete evidence

## 9. Default Recommendation
If the user does not specify depth or format:
- default to **standard brief**
- default format is **brief**
- include recommendation + sources

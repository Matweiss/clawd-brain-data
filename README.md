# 🧠 CLAWD Brain Data - Memory Vault

**Private Repository** — Personal knowledge base, memories, handoffs, and decisions.

## 📁 Repository Structure

```
clawd-brain-data/
├── memories/              # Daily memories, thoughts, events
│   ├── YYYY/
│   │   └── MM/
│   │       └── YYYY-MM-DD-{slug}.md
├── handoffs/              # Agent handoffs and task transfers
│   ├── active/
│   │   └── {from}-{to}-{date}.md
│   └── archived/
│       └── YYYY/MM/
├── docs/                  # Documentation & reference
│   ├── decisions/         # ADR-style decision records
│   ├── people/            # Contact notes, relationship context
│   └── processes/         # How-to guides, workflows
├── daily/                 # Auto-generated daily summaries
│   └── YYYY-MM-DD-daily.md
└── README.md              # This file
```

---

## 📂 Important Document Collections

### Lucra Employment
- **Full Document Repository:** `docs/lucra-employment-document-repository.md`
  - Offer Letter (countersigned)
  - Commission Plan (countersigned)
  - PIIA (countersigned)
  - Compensation breakdown
  - Next steps checklist

- **Pitch Deck Summary:** `docs/lucra-pitch-deck-overview.md`
  - Value proposition
  - Target industries
  - Key metrics (110% visit increase, 40% dwell time)
  - Sales angles for Craftable prospects

### Tools & Capabilities
- **Voice Tools:** `memory/2026-03-07-voice-capabilities-update.md`
  - TTS: Grok (✅), ElevenLabs (✅), Minimax (❌)
  - STT: Groq Whisper transcription
  - Transcription script: `/root/.openclaw/workspace/scripts/transcribe.sh`

---

## 🔄 Daily Sync

**Automatic commits:** Daily at 11:00 PM PT
**Commit message format:** `[memory] 2026-03-07: 3 memories, 1 handoff`
**Manual commit:** Available via Mission Control dashboard

## 🚨 Fresh Start Recovery

**If you need to start fresh with a new agent:**

1. **Clone this repo:**
   ```bash
   git clone https://github.com/Matweiss/clawd-brain-data.git
   ```

2. **Key files to read first:**
   - `MEMORY.md` — Long-term curated memories
   - `SOUL.md` — Identity and operating principles
   - `USER.md` — Information about Mat
   - `AGENTS.md` — Agent architecture and roles
   - `BACKUP_HANDOFF.md` — Recent critical handoffs

3. **Recent memories:**
   - Check `memories/YYYY/MM/` for latest entries
   - Check `daily/` for daily summaries
   - Check `handoffs/active/` for in-flight work

4. **Mission Control:**
   - URL: https://clawd-mission-control-v2.vercel.app
   - This dashboard reads from this repo
   - All memories editable via UI

## 🔗 Integration Points

- **Mission Control Dashboard:** Reads/writes to this repo
- **Daily Cron:** Auto-commits at 11 PM PT
- **File Format:** Markdown with YAML frontmatter
- **Backup:** GitHub + local clone

## 📝 File Format

```markdown
---
title: "Memory Title"
date: 2026-03-07T00:30:00-08:00
type: memory | handoff | decision
tags: [tag1, tag2]
author: Mat
related: [path/to/related.md]
---

Content here...
```

## ⚠️ Privacy

This repository contains personal thoughts, work details, and sensitive information. **Keep it private.**

---

*Last updated: 2026-03-07*
*Managed by: CLAWD Mission Control*

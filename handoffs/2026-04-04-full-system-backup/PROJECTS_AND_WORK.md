# PROJECTS & ACTIVE WORK — April 4, 2026

## 🚀 ACTIVE PROJECTS

### 1. Lucra ROI Calculator (Luke)
**Status:** ✅ Built, needs PDF generation fix
**Files:**
- `/root/.openclaw/workspace/scripts/roi-pdf-generator.py`
- `/root/.openclaw/workspace/templates/roi-leave-behind.html`
- Live at: `lucra-roi-calculator.vercel.app`

**Known Issues:**
- PDF generation had JS string escaping bug (apostrophes breaking inline strings)
- Should always use dark mode for PDFs
- Should require company name, website, logo before generating

### 2. Agent Evolution System
**Status:** ✅ Active
**Paperclip Project:** `dbd17147-fe6b-47c9-ab0b-9ecc1c82b967`
**Daily Task:** Surface top 3 unbuilt ideas to Mat each morning

**Recent Additions (April 2):**
- Hermes VIP Sender Scoring
- Bob Integration Health Dashboard
- Hermes Auto Follow-Up Tracker (pending)

### 3. Memory Assist System
**Status:** ✅ Active
**Scripts:**
- `scripts/memory-assist.cjs` — digest, weekly-prune
- `scripts/memory-checkpoint.cjs` — checkpoints, project tracking

### 4. Integration Health Monitoring
**Status:** ✅ Active
**Script:** `scripts/integration-health-check.sh`
**Cron:** Daily 9am PT
**Output:** `memory/integration-health-state.json`

### 5. Siri Replacement / Voice Control
**Status:** 🅿️ Parked
**Notes:** Revisit after ROI calculator complete
**Plan:** iOS Shortcut → Telegram → Clawd → response

### 6. Apple Health Integration
**Status:** 🅿️ In planning
**Doc:** `docs/apple-health-shortcut.md`
**Assigned:** Sage

---

## 📋 BACKLOG / TODO

### High Priority
- [ ] Fix Anthropic OAuth → get direct API key
- [ ] Fix ROI calculator PDF generation
- [ ] Complete Hermes follow-up tracker

### Medium Priority
- [ ] Setup ElevenLabs TTS
- [ ] Setup Supabase
- [ ] Fix Minimax (new key needed)

### Low Priority
- [ ] Siri replacement iOS Shortcut
- [ ] Apple Health full integration
- [ ] Tesla integration

---

## 🗂️ PROJECT DIRECTORIES

```
/root/.openclaw/workspace/
├── clawd-brain-data/          # This workspace (GitHub)
├── clawd-mission-control-v2/  # Mission control (GitHub)
├── docs/                      # Process docs, runbooks
├── handoffs/                  # Handoff documents
├── memory/
│   ├── projects/              # Sarah's projects (separate!)
│   │   ├── sarah-art-assistant-design-spec.md
│   │   ├── sarah-art-assistant-system-prompt.md
│   │   ├── sarah-tool-integrations-research.md
│   │   └── sarah-tool-stack.md
│   └── [daily notes]          # YYYY-MM-DD.md files
├── scripts/                   # Automation scripts
├── shared/                    # Shared agent resources
│   ├── bob-agent/
│   ├── hermes-agent/
│   ├── luke-agent/
│   └── sarah-agent/
├── skills/                    # OpenClaw skills
└── templates/                 # HTML templates
```

---

## 🔗 KEY EXTERNAL RESOURCES

- **Dashboard:** https://clawd-dashboard-eight.vercel.app
- **Paperclip:** https://paperclip.thematweiss.com
- **GitHub:** https://github.com/Matweiss
- **Domain:** https://thematweiss.com

---

*Last updated: April 4, 2026*
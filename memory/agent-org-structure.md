# Agent Org Structure

**Decided:** 2026-03-30 | **Updated:** 2026-03-31

## The Org

```
Mat
└── Clawd 🤖 (Chief of Staff / Orchestrator)
    ├── Arty 🎨 (Sarah Dept Head)
    │   ├── Shopify/Ops worker
    │   ├── Content/Newsletter worker
    │   ├── ManyChat worker
    │   └── Dashboard/Metrics worker
    │
    ├── Luke 💼 (Lucra Dept Head)
    │   ├── Scout 🔍 (research worker)
    │   ├── Hermes 📬 (email — mat.weiss@lucrasports.com, reports to Luke)
    │   ├── Pipeline worker
    │   └── Comms worker
    │
    └── Sage 🌿 (Lifestyle Dept Head)
        ├── Pixel 📅 (schedule worker — CorePower, Regal)
        ├── Hermes 📬 (email — thematweiss@gmail.com + sarahmat0816@gmail.com CorePower, reports to Sage)
        ├── Home Assistant worker
        ├── Yoga/health worker
        └── Fun/movies worker
```

## Email Accounts
- **mat.weiss@lucrasports.com** — Lucra work (Hermes → Luke)
- **thematweiss@gmail.com** — Personal primary (Hermes → Sage)
- **sarahmat0816@gmail.com** — Shared with Sarah; Hermes watches for CorePower emails only (→ Sage)
- **mat@craftable.com** — INACTIVE, ignore

## Routing Logic
- "Put on my work calendar" → Clawd → Luke → calendar
- "Put on my personal calendar" → Clawd → Sage → calendar
- "Check my email" → Clawd → Hermes (via Luke for work, via Sage for personal)
- "Tell Arty to..." → Clawd → Arty
- Each dept head owns its context; Hermes serves both Luke and Sage for their respective inboxes

## Hermes Note
Hermes is a dual-reporting worker:
- Under **Luke**: monitors mat.weiss@lucrasports.com
- Under **Sage**: monitors thematweiss@gmail.com and sarahmat0816@gmail.com (CorePower only)
All three Google accounts are OAuth authorized ✅

## Build Order
1. ✅ Luke (Lucra) — active
2. ✅ Sage (Lifestyle) — active
3. ✅ Scout (research, under Luke) — active
4. ✅ Pixel (schedule, under Sage) — active
5. ✅ Hermes (email, dual-reporting) — active
6. Pipeline worker — TBD after onboarding
7. Remaining Arty workers — TBD

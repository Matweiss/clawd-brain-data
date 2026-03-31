# Agent Org Structure

**Decided:** 2026-03-30

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
    │   ├── Lucra calendar worker (mat.weiss@lucrasports.com)
    │   ├── Lucra email worker
    │   ├── Pipeline worker
    │   ├── Research worker
    │   └── Comms worker
    │
    └── Sage 🌿 (Lifestyle Dept Head)
        ├── Personal calendar worker (thematweiss@gmail.com)
        ├── Hermes 📬 (personal email — thematweiss@gmail.com + sarahmat0816@gmail.com for CorePower)
        ├── Home Assistant worker
        ├── Yoga/health worker
        └── Fun/movies worker
```

## Routing Logic
- "Put on my work calendar" → Clawd → Luke → Lucra calendar worker
- "Put on my personal calendar" → Clawd → Sage → personal calendar worker
- "Tell Arty to..." → Clawd → Arty
- Each dept head owns its own email, calendar, and context

## Build Order
1. Luke (Lucra) — highest priority, Mat starts at Lucra April 1, 2026
2. Sage (Lifestyle) — second priority
3. Worker agents — built under each dept head as needed

## OpenClaw Agent IDs (planned)
- main → Clawd (exists ✅)
- sarah → Arty (exists ✅)
- lucra → Luke (to build)
- lifestyle → Sage (to build)

## Paperclip
Build agents in OpenClaw first, then wire into Paperclip departments.

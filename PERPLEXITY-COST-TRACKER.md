# 🔬 Perplexity Cost Tracker & Stress Test

**Setup Date:** 2026-02-22  
**Credit Available:** $50  
**Purpose:** Stress test Perplexity to understand monthly usage patterns

---

## Configuration

### Active Setup
- **Model:** Perplexity Sonar (Web Search)
- **Agent:** Research Agent
- **API Key:** `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`
- **Status:** ✅ Live & Active

### Model Routing
```
Research Agent (research-agent):
├─ Primary: perplexity/sonar (web search + reasoning)
├─ Fallback 1: GLM-5 (free, fast)
└─ Fallback 2: Kimi K2.5 (reliable backup)
```

---

## Pricing Model

| Metric | Cost | Notes |
|--------|------|-------|
| Input Token | $0.005 / 1K | Cheaper than most models |
| Output Token | $0.015 / 1K | Includes web search cost |
| Context Window | 127K tokens | Good for detailed research |
| Max Response | 4096 tokens | Reasonable limit |

### Cost Estimates
```
1 query (avg 100 input, 200 output): ~$0.004
10 queries/day: ~$0.04/day = ~$1.20/month
100 queries/day: ~$0.40/day = ~$12/month
1000 queries/day: ~$4.00/day = ~$120/month
```

**Your $50 credit covers:**
- Low usage: ~4 months
- Medium usage: ~1 month  
- High usage: ~1 week

---

## Stress Test Plan

### **Phase 1: Baseline** (Week 1 - Feb 22-28)
**Goal:** Light usage, see system stability

Activities:
- [ ] Daily prospect research (3-5 queries/day)
- [ ] Company intelligence lookups
- [ ] Sales intelligence research
- [ ] Monitor response quality & speed

**Expected cost:** ~$1-2/week

---

### **Phase 2: Medium Load** (Week 2 - Mar 1-7)
**Goal:** Moderate usage, test real workload

Activities:
- [ ] Research 10 deals/day (leads, competitors, companies)
- [ ] Prospecting research
- [ ] Market intelligence
- [ ] Industry research

**Expected cost:** ~$5-10/week

---

### **Phase 3: High Load** (Week 3 - Mar 8-14)
**Goal:** Push limits, find breaking points

Activities:
- [ ] Research 20+ queries/day
- [ ] Batch processing leads
- [ ] Competitive analysis
- [ ] Deep dives on prospects

**Expected cost:** ~$15-25/week

---

### **Phase 4: Analyze** (Week 4 - Mar 15+)
**Goal:** Calculate sustainable level

Review:
- Total queries run
- Total cost incurred
- Cost per query (average)
- Recommended monthly budget
- Optimal agent allocation

---

## Cost Tracking Format

Record each research query:

```
Date | Query | Tokens (In/Out) | Cost | Result Quality | Agent
-----|-------|-----------------|------|----------------|------
2026-02-22 | "Kava Culture founder Matt?" | 50/150 | $0.003 | ★★★★★ | research-agent
2026-02-22 | "Craftable restaurants using it" | 80/200 | $0.004 | ★★★★☆ | research-agent
```

### Logging Command
```bash
# View recent Perplexity queries
grep -i "perplexity\|research-agent" /data/.openclaw/workspace/logs/*.log | tail -20
```

---

## Budget Milestones

| Spent | Timeline | Status | Action |
|-------|----------|--------|--------|
| $0-10 | Week 1 | Light test | Continue |
| $10-25 | Week 2 | Medium load | Monitor |
| $25-40 | Week 3 | High load | Evaluate |
| $40-50 | Week 4 | Analyze | Decide next month |

---

## Decision Points

### If usage is LOW ($5-15/month)
✅ Keep Perplexity as primary for research  
✅ Can support unlimited research queries  
✅ Budget: ~$20/month (comfortable margin)

### If usage is MEDIUM ($20-40/month)
⚠️ Use Perplexity for important research only  
⚠️ Use GLM-5 (free) for simple lookups  
📊 Budget: ~$50/month (2x current)

### If usage is HIGH ($40-60+/month)
❌ Switch Perplexity to fallback-only  
✅ Use GLM-5 (free) as primary for research  
💡 Use Perplexity for critical queries only  
📊 Budget: Evaluate ROI vs. cost

---

## Key Questions to Answer

1. **How many research queries/day is realistic?**
   - Sales prospecting rate
   - Deal research depth
   - Competitive analysis frequency

2. **What's the ROI of each query?**
   - Time saved vs. manual research
   - Deal size impact
   - Quality of leads improved

3. **Which queries are worth paying for?**
   - Hot leads → Perplexity
   - Cold leads → GLM-5 (free)
   - Internal research → GLM-5 (free)

4. **Should we tier by importance?**
   - VIP prospects → Perplexity web search
   - Standard prospects → GLM-5
   - Batch research → GLM-5

---

## Integration Notes

### Research Agent Access
The Research Agent now has:
- ✅ Primary: Perplexity Sonar (web search)
- ✅ Fallback 1: GLM-5 (free, fast)
- ✅ Fallback 2: Kimi K2.5 (reliable)

### When Perplexity is Used
Automatically triggered for research tasks:
- Company research
- Prospect intelligence
- Market analysis
- Competitor lookups
- Industry research

### Monitoring
Track in:
- OpenClaw logs: `/data/.openclaw/workspace/logs/`
- Gateway dashboard: `localhost:18789`
- Cost reports: This file (updated weekly)

---

## Weekly Cost Reports

### Week 1 Report (Template)
```
Period: 2026-02-22 to 2026-02-28
Total Queries: __
Total Cost: $__
Avg Cost/Query: $__
Quality Rating: __ / 5
Recommendation: ___________
```

---

## Next Steps

1. ✅ Perplexity configured for Research Agent
2. ⏳ Run Phase 1 baseline (1 week)
3. ⏳ Analyze usage patterns
4. ⏳ Decide monthly budget & strategy

---

## Quick Reference

**API Key:** `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`  
**Model:** `sonar`  
**Base URL:** `https://api.perplexity.ai`  
**Cost Tracking:** This file  
**Status:** 🟢 Live & Active

Ready to stress test! 🚀

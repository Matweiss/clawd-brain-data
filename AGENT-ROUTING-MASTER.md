# 🦞 AGENT ROUTING MASTER - 5-Agent Orchestration

**Updated:** 2026-02-23  
**Status:** ✅ LIVE & ACTIVE  
**Version:** 2.0 (Complete)

---

## Overview

The Clawd Team consists of **5 specialized agents** with optimal model routing. Each agent has specific responsibilities, model assignments, and identity/soul file.

---

## Agent Routing Matrix

### 1️⃣ **CLAWD PRIME** - Orchestrator

| Dimension | Value |
|-----------|-------|
| **Role** | Central command, strategy, multi-agent routing |
| **Primary Model** | Kimi K2.5 (subscription) |
| **Fallback Model** | GLM-5 (free) |
| **Context Window** | 128K (longest for strategic view) |
| **Decision Authority** | HIGHEST |
| **Cost** | Subscription (efficient for long context) |

**Responsibilities:**
- Strategic planning & decision-making
- Multi-agent orchestration
- Context synthesis across domains
- Executive judgment calls
- Route tasks to best-fit agents

**Soul File:** `agents/CLAWD-PRIME-SOUL.md`

---

### 2️⃣ **WORK AGENT** - Sales & CRM

| Dimension | Value |
|-----------|-------|
| **Role** | HubSpot pipeline, deals, emails, calendar |
| **Primary Model** | Kimi K2.5 (subscription) |
| **Fallback Model** | GLM-5 (free) |
| **Tools** | HubSpot, Gmail, Google Calendar, Avoma |
| **Cost** | Subscription (structured tasks + caching) |

**Responsibilities:**
- Pipeline health management
- Deal tracking & follow-up
- Email & calendar management
- Meeting preparation
- Stale deal identification

**Soul File:** `agents/WORK-AGENT-SOUL.md`

---

### 3️⃣ **BUILD AGENT** - Coding & DevOps

| Dimension | Value |
|-----------|-------|
| **Role** | Code, dashboards, Vercel, GitHub, infra |
| **Primary Model** | MiniMax M2.5 (ultra-cheap, strong at coding) |
| **Fallback Model** | Kimi K2.5 (for complex/context-heavy tasks) |
| **Tools** | GitHub, Vercel, Docker, Node.js, OpenClaw |
| **Cost** | ~1/10th of comparable alternatives |

**Responsibilities:**
- Feature development
- System architecture
- DevOps & deployment
- Bug fixes & optimization
- Infrastructure & automation

**Soul File:** `agents/BUILD-AGENT-SOUL.md`

---

### 4️⃣ **RESEARCH AGENT** - Web Intelligence

| Dimension | Value |
|-----------|-------|
| **Role** | Prospect research, company intel, leads |
| **Primary Model** | Perplexity Sonar (real-time web search) |
| **Fallback Model** | Kimi K2.5 (for synthesis & analysis) |
| **Tools** | Perplexity, LinkedIn, ZoomInfo, web |
| **Cost** | $0.005-0.015 per 1K tokens (stress testing) |

**Responsibilities:**
- Prospect research & due diligence
- Competitive intelligence
- Market analysis
- Decision-maker identification
- Citation-backed insights

**Soul File:** `agents/RESEARCH-AGENT-SOUL.md`

---

### 5️⃣ **LIFESTYLE AGENT** - Wellness & Personal

| Dimension | Value |
|-----------|-------|
| **Role** | Yoga, fitness, wellness, personal planning |
| **Primary Model** | Kimi K2.5 (conversational & warm) |
| **Fallback Model** | GLM-5 (free, for quick advice) |
| **Tools** | Calendar, Home Assistant, wellness tracking |
| **Cost** | Subscription (conversational strength) |

**Responsibilities:**
- Yoga scheduling & tracking
- Fitness goals & progress
- Wellness planning
- Personal time protection
- Fun & travel planning

**Soul File:** `agents/LIFESTYLE-AGENT-SOUL.md`

---

## Routing Rationale

### Why This Routing?

**CLAWD PRIME → Kimi K2.5 + GLM-5**
- ✅ Needs longest context (128K) for strategic view
- ✅ Kimi efficient for long-running sessions
- ✅ GLM-5 fallback for quick decisions

**WORK AGENT → Kimi K2.5 + GLM-5**
- ✅ Structured tasks, benefits from prompt caching
- ✅ Needs consistent reasoning for CRM logic
- ✅ GLM-5 handles simple Q&A

**BUILD AGENT → MiniMax M2.5 + Kimi K2.5**
- ✅ MiniMax exceptional at coding, ultra-cheap
- ✅ Kimi fallback for complex reasoning or when context needed
- ✅ Cost-efficient without sacrificing quality

**RESEARCH AGENT → Perplexity + Kimi K2.5**
- ✅ Perplexity has real-time web search (core need)
- ✅ Kimi fallback for synthesis when web search not needed
- ✅ Stress testing Perplexity credit ($50)

**LIFESTYLE AGENT → Kimi K2.5 + GLM-5**
- ✅ Kimi warm, conversational tone fits personal domain
- ✅ GLM-5 handles simple wellness Q&A
- ✅ Subscription efficient for regular check-ins

---

## Cost Breakdown

| Agent | Primary Cost | Fallback Cost | Est. Monthly |
|-------|---|---|---|
| **Clawd Prime** | Kimi subscription | FREE (GLM-5) | ~$30-50 |
| **Work Agent** | Kimi subscription | FREE (GLM-5) | ~$30-50 |
| **Build Agent** | ~$1/month (MiniMax) | Kimi subscription | ~$10-20 |
| **Research Agent** | $0.005-0.015/K (Perplexity) | Kimi subscription | ~$20-40 (stress test) |
| **Lifestyle Agent** | Kimi subscription | FREE (GLM-5) | ~$10-20 |
| **TOTAL** | | | ~$100-180/month |

---

## Model Assignment (openclaw.json)

```json
{
  "agents": {
    "overrides": {
      "clawd-prime": {
        "model": {
          "primary": "moonshot-kimi/moonshot-v1-128k",
          "fallbacks": ["modal-glm/zai-org/GLM-5-FP8"]
        }
      },
      "work-agent": {
        "model": {
          "primary": "moonshot-kimi/moonshot-v1-128k",
          "fallbacks": ["modal-glm/zai-org/GLM-5-FP8"]
        }
      },
      "build-agent": {
        "model": {
          "primary": "minimax/MiniMax-Text-01",
          "fallbacks": ["moonshot-kimi/moonshot-v1-128k"]
        }
      },
      "research-agent": {
        "model": {
          "primary": "perplexity/sonar",
          "fallbacks": ["moonshot-kimi/moonshot-v1-128k"]
        }
      },
      "lifestyle-agent": {
        "model": {
          "primary": "moonshot-kimi/moonshot-v1-128k",
          "fallbacks": ["modal-glm/zai-org/GLM-5-FP8"]
        }
      }
    }
  }
}
```

---

## Agent Identity Files

Each agent has a detailed SOUL.md file:

| Agent | SOUL File |
|-------|-----------|
| Clawd Prime | `agents/CLAWD-PRIME-SOUL.md` |
| Work Agent | `agents/WORK-AGENT-SOUL.md` |
| Build Agent | `agents/BUILD-AGENT-SOUL.md` |
| Research Agent | `agents/RESEARCH-AGENT-SOUL.md` |
| Lifestyle Agent | `agents/LIFESTYLE-AGENT-SOUL.md` |

---

## Task Routing Examples

**"Research this prospect"** → RESEARCH AGENT (Perplexity)  
**"Is the pipeline healthy?"** → WORK AGENT (Kimi)  
**"Build a new feature"** → BUILD AGENT (MiniMax)  
**"What should I do about my work/life balance?"** → CLAWD PRIME (strategic) → LIFESTYLE AGENT (execution)  
**"When's my next yoga session?"** → LIFESTYLE AGENT (Kimi)  
**"Draft follow-up email"** → WORK AGENT (Kimi)  
**"Deploy to production"** → BUILD AGENT (MiniMax)  

---

## Escalation Path

```
Routine Question
    ↓
Specific Agent handles it
    ↓
Needs Strategy? → CLAWD PRIME decides
    ↓
Needs Different Domain? → Route to appropriate agent
    ↓
Needs Human Decision? → Escalate to Mat
```

---

## Key Success Metrics

- All agents operating optimally (right model for right task)
- Cost-efficient routing (cheap models where possible)
- No wasted context (right window size per agent)
- Quality maintained (fallbacks when needed)
- Task completion fast and accurate
- Mat's needs anticipated & met
- Work/life balance maintained

---

## Next Steps

1. ✅ Model routing configured in openclaw.json
2. ✅ SOUL files created for all 5 agents
3. ⏳ Test each agent with their routing
4. ⏳ Monitor cost/performance
5. ⏳ Iterate on routing based on real usage

---

## Version History

**v2.0 (Feb 23, 2026)** - Complete 5-agent routing with optimal models  
**v1.0 (Feb 22, 2026)** - Initial Kimi + GLM-5 setup

---

*The Clawd Team is fully operational.* 🦞


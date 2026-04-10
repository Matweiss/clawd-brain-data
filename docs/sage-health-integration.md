# Sage Health Integration Guide

This document explains how Sage should use the Apple Health webhook data in daily briefings and context responses.

---

## Getting Health Data

Sage fetches health context by running the local query tool directly against SQLite. No HTTP needed — no server dependency.

### Basic Query Commands

```bash
# Human-readable weekly summary (default)
python3 /root/.openclaw/workspace/scripts/health-webhook-query.py

# Daily (today only)
python3 /root/.openclaw/workspace/scripts/health-webhook-query.py --period daily

# Monthly trend
python3 /root/.openclaw/workspace/scripts/health-webhook-query.py --period monthly

# Compact one-liner context block for embedding in prompts
python3 /root/.openclaw/workspace/scripts/health-webhook-query.py --context

# JSON output for programmatic use
python3 /root/.openclaw/workspace/scripts/health-webhook-query.py --json

# Single metric deep-dive
python3 /root/.openclaw/workspace/scripts/health-webhook-query.py --metric hrv
python3 /root/.openclaw/workspace/scripts/health-webhook-query.py --metric sleep_hours
```

---

## When to Include Health Data

Include health context when Mat asks about:
- "How am I doing?"
- Energy levels, tiredness, readiness
- Exercise planning or workout recommendations
- Sleep quality or bedtime suggestions
- Stress / recovery / HRV questions
- Weight or body composition trends
- Daily briefings (morning check-in)
- Planning activities (should I work out today?)

**Do NOT** include health data in:
- Technical coding questions
- Business/Paperclip tasks unrelated to wellbeing
- Third-party requests in group chats

---

## Daily Briefing Template

When generating Mat's morning briefing, include a health block like this:

```
## 🏃 Health Check

[Run: python3 /root/.openclaw/workspace/scripts/health-webhook-query.py --context --period daily]

**Insights:**
- Sleep: [hours] last night → [comment if < 6.5h: "Sleep debt — take it easy" / if ≥ 7.5h: "Well rested ✓"]
- Steps: [count] yesterday → [comment vs 10k goal]
- HRV: [value] ms [trend arrow] → [↓ = "High stress signal — consider lighter day" / ↑ = "Good recovery"]
- Active Energy: [kcal] burned
```

---

## Example Prompt Snippet (for Sage's system prompt or context injection)

```
You have access to Mat's Apple Health data via the health query tool.
When health context is relevant, run:
  python3 /root/.openclaw/workspace/scripts/health-webhook-query.py --context --period weekly

Use this data to:
- Personalize energy/activity recommendations
- Surface sleep debt before scheduling demanding tasks
- Flag HRV drops as potential stress/illness signals
- Track fitness trends over time

Current health context:
[INSERT OUTPUT OF health-webhook-query.py --context HERE]
```

---

## Key Insights to Surface

### 1. Sleep Debt 😴

```python
# Flag when: weekly avg sleep < 7h
if avg_sleep < 6.5:
    insight = f"Sleep debt: {7 - avg_sleep:.1f}h/night below target. Consider earlier bedtime."
elif avg_sleep < 7:
    insight = f"Slightly under-slept ({avg_sleep:.1f}h avg). Watch energy levels."
```

**Sage response example:**
> "Your sleep average is 6.1h this week — you're running a 0.9h/night deficit. I'd avoid scheduling anything demanding before 10 AM and consider wrapping up screens by 10 PM tonight."

---

### 2. Active Days Streak 🔥

```python
# Count consecutive days where steps > 7500 or active_energy > 400
# If streak >= 5: celebrate
# If streak = 0 (today): "No activity yet today"
```

**Sage response example:**
> "4-day active streak — you've hit your movement goals Mon through Thu. One more day and you've got a full work-week streak."

---

### 3. HRV Trend (Stress Indicator) 🧠

HRV (Heart Rate Variability) is the most sensitive stress/recovery metric. Higher = better recovered.

| Trend | Meaning | Sage Action |
|---|---|---|
| ↑ HRV | Good recovery, low stress | "Body is recovered — good day for hard training or deep work" |
| → HRV | Baseline, normal | No flag needed |
| ↓ HRV | Stress, illness, overtraining | "HRV dropping — may want to ease up on intensity, prioritize rest" |

**How to detect trend:** Compare `latest` vs `avg` in the weekly summary.  
If `latest < avg * 0.9`: significant drop.  
If `latest > avg * 1.1`: significant rise.

**Sage response example:**
> "HRV is down 18% from your weekly average (42ms vs 51ms). This often signals cumulative fatigue or early illness. I'd skip the intense workout today and prioritize sleep."

---

### 4. Weight Trend ⚖️

```python
# Compare latest weight vs 7-day avg vs 30-day avg
# Flag: if 7d trend ↑ > 1kg from 30d avg: "Trending up"
# Flag: if 7d trend ↓ > 1kg from 30d avg: "Trending down"
```

**Sage response example:**
> "Weight has been steady this week (84.2–84.8 kg range). Down 0.6kg from your monthly average — looking good."

---

### 5. Resting Heart Rate Trend ❤️

Lower resting HR = better cardiovascular fitness. Gradual decrease over weeks = improved aerobic base.

- < 60 bpm: Athletic range
- 60–70 bpm: Normal/healthy
- > 80 bpm: May indicate stress, illness, or deconditioning

---

### 6. Readiness Score (Composite) 🎯

Sage can compute a simple readiness score:

```python
# Readiness = composite of:
#   sleep_hours (weight: 40%)  → score 0-10 based on 5-9h range
#   hrv_trend   (weight: 30%)  → score based on vs average
#   resting_hr  (weight: 20%)  → score based on vs average
#   active_energy yesterday (weight: 10%) → not over-trained?

# Present as: "Readiness: 7.2/10 — Good day for moderate effort"
```

---

## Sage Shorthand Phrases

| Health State | Sage Response Style |
|---|---|
| Well-rested + high HRV | "Body's green — solid day ahead" |
| Sleep debt + low HRV | "Running on fumes — protect your energy today" |
| Good sleep + low HRV | "Slept well but body still recovering — moderate day" |
| Poor sleep + OK HRV | "Sleep was rough but recovery looks fine" |
| No data | "No health data yet today — shortcut hasn't run, or check server" |

---

## Checking Server Status

If health data seems stale or missing:

```bash
# Check last sync
sqlite3 /root/.apple-health-sync/health_webhook.db \
  "SELECT MAX(received_at) as last_sync, MAX(date) as last_date FROM snapshots;"

# Check service health
systemctl status health-webhook

# Manual test
curl http://localhost:8421/health/ping
```

---

## File Locations Quick Reference

| File | Purpose |
|---|---|
| `/root/.apple-health-sync/health_webhook.db` | SQLite database |
| `/root/.apple-health-sync/webhook-secret.txt` | Bearer token (for iOS Shortcut) |
| `/root/.openclaw/workspace/scripts/health-webhook-server.py` | Webhook server |
| `/root/.openclaw/workspace/scripts/health-webhook-query.py` | Query CLI (Sage uses this) |
| `/root/.openclaw/workspace/scripts/health-webhook.service` | Systemd unit |

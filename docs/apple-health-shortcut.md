# Apple Health → OpenClaw: iOS Shortcut Setup Guide

This guide walks you through building the iOS Shortcut that reads every HealthKit metric and POSTs it to your VPS webhook. No third-party apps required — just the built-in Shortcuts app.

---

## Prerequisites

- iPhone with iOS 16+ (iOS 17 recommended)
- Shortcuts app installed (pre-installed on iOS 14+)
- Health app with data (at least a few days of activity)
- Webhook server running on VPS (see server setup)

---

## Configuration

```
Webhook URL:  http://srv882799.hstgr.cloud:8421/health
Bearer Token: REPLACE_WITH_TOKEN_FROM_CLAWD
```

> **Get your token:** SSH to VPS and run:
> ```bash
> cat /root/.apple-health-sync/webhook-secret.txt
> ```
> Then replace `REPLACE_WITH_TOKEN_FROM_CLAWD` in the shortcut with that value.

---

## Building the Shortcut

Open **Shortcuts app** → tap **+** (top right) to create a new shortcut.  
Tap **Add Action** to add each step below.

---

### Step 1 — Get Today's Date

**Action:** `Format Date`

```
Input:    Current Date
Format:   Custom
Custom:   YYYY-MM-DD
```

> In the action picker, search "Format Date" → select it → tap the date field → choose "Current Date" → tap the format → select "Custom" → type `YYYY-MM-DD`.

Name this variable: **`formatted_date`**  
(Tap the variable bubble, rename it.)

---

### Step 2 — Create the Metrics Dictionary

**Action:** `Dictionary`  
Create a new empty Dictionary variable. We'll call it **`metrics_dict`**.

> Search "Dictionary" in actions → add it → tap the `{}` to add keys.

---

### Step 3 — Collect Each Metric

For each metric below, add this pattern:

```
1. Find Health Samples Where [Type] is [MetricType]
   - Start Date: Start of Today
   - End Date:   Now
   - Sort:       Latest First
   - Limit:      (depends on metric — see table)

2. Calculate [aggregation] of [Health Samples]

3. Set Dictionary Value  key: "[metric_key]"  value: { "value": result, "unit": "unit_string" }
```

Since Shortcuts doesn't natively support nested dicts as values, we use a workaround:  
**Create a sub-Dictionary for each metric** with keys `value` and `unit`, then set it on the main `metrics_dict`.

---

#### Full Metric List

| Metric Key | HealthKit Type | Aggregation | Unit | Limit |
|---|---|---|---|---|
| `steps` | Step Count | Sum | count | All |
| `distance_walking_running` | Walking + Running Distance | Sum | km | All |
| `active_energy` | Active Energy Burned | Sum | kcal | All |
| `resting_energy` | Resting Energy Burned | Sum | kcal | All |
| `exercise_minutes` | Exercise Time | Sum | min | All |
| `stand_hours` | Apple Stand Hour | Sum | hours | All |
| `heart_rate` | Heart Rate | Average | bpm | All |
| `resting_heart_rate` | Resting Heart Rate | Latest First | bpm | 1 |
| `hrv` | Heart Rate Variability (SDNN) | Average | ms | All |
| `respiratory_rate` | Respiratory Rate | Average | breaths/min | All |
| `blood_oxygen` | Oxygen Saturation | Average | % | All |
| `sleep_hours` | Sleep Analysis (Asleep) | Sum | hours | All |
| `sleep_in_bed` | Sleep Analysis (In Bed) | Sum | hours | All |
| `weight` | Body Mass | Latest First | kg | 1 |
| `bmi` | Body Mass Index | Latest First | count | 1 |
| `body_fat` | Body Fat Percentage | Latest First | % | 1 |
| `mindful_minutes` | Mindful Session | Sum | min | All |
| `flights_climbed` | Flights Climbed | Sum | count | All |
| `headphone_audio_exposure` | Headphone Audio Exposure | Average | dBASPL | All |
| `walking_heart_rate_avg` | Walking Heart Rate Average | Average | bpm | All |
| `vo2_max` | VO₂ Max | Latest First | mL/min·kg | 1 |

---

### Step 3A — Detailed: Steps Example

This is the template. Repeat for each metric.

**3A-1. Find Health Samples**
```
Action:     Find Health Samples
Type:       Step Count
Start Date: Start of Today
End Date:   Now
Sort by:    Start Date → Latest First
Limit:      (none — get all samples for the day)
```

**3A-2. Calculate Sum**
```
Action:   Calculate Statistics on [Health Samples from previous action]
Statistic: Sum
```
→ Result variable name: `steps_result`

**3A-3. Create sub-dict**
```
Action:    Dictionary
Contents:
  value →  steps_result     (type: Variable)
  unit  →  "count"          (type: Text)
```
→ Variable: `steps_dict`

**3A-4. Set on main dict**
```
Action:  Set Dictionary Value
Key:     steps
Value:   steps_dict
Input:   metrics_dict
```

Repeat this 4-action block for each metric in the table above.

---

### Step 4 — Build the Outer Payload

**Action:** `Dictionary`

```
Contents:
  date    → formatted_date      (Variable, Text)
  source  → "iphone-shortcut"   (Text)
  metrics → metrics_dict        (Variable, Dictionary)
```

→ Variable: `health_payload`

---

### Step 5 — POST to Webhook

**Action:** `Get Contents of URL`

```
URL:     http://srv882799.hstgr.cloud:8421/health
Method:  POST
Headers:
  Content-Type:   application/json
  Authorization:  Bearer REPLACE_WITH_TOKEN_FROM_CLAWD
Body:
  Type:   JSON
  Content: health_payload
```

> - Tap "Get Contents of URL"
> - Tap "Show More"
> - Method → POST
> - Tap "Add new header" twice: add Content-Type and Authorization
> - Request Body → JSON → Variable: health_payload

→ Variable: `webhook_response`

---

### Step 6 — Count Metrics Synced

**Action:** `Count`
```
Input:  Values in metrics_dict
```
→ Variable: `metric_count`

---

### Step 7 — Show Notification

**Action:** `Show Notification`
```
Title:   Health synced ✓
Body:    metric_count metrics sent for formatted_date
```

---

### Step 8 — (Optional) Error Handling

After Step 5, add an **If** block:

```
If:         webhook_response  contains  "error"
   Show Notification
     Title: Health sync failed ⚠️
     Body:  webhook_response
Otherwise:
   (continue)
```

---

## Complete Shortcut Structure (Summary)

```
[1]  Format Date → formatted_date (YYYY-MM-DD)
[2]  Dictionary  → metrics_dict {}

// === METRICS (repeat block for each) ===
[3]  Find Health Samples (Step Count, today)
[4]  Calculate Sum → steps_result
[5]  Dictionary {value: steps_result, unit: "count"} → steps_dict
[6]  Set Dictionary Value metrics_dict[steps] = steps_dict

[7]  Find Health Samples (Walking+Running Distance, today)
[8]  Calculate Sum → distance_result
[9]  Dictionary {value: distance_result, unit: "km"} → distance_dict
[10] Set Dictionary Value metrics_dict[distance_walking_running] = distance_dict

... (repeat for all 21 metrics)

[n-3] Dictionary {date, source, metrics} → health_payload
[n-2] Get Contents of URL (POST /health) → webhook_response
[n-1] Count (Values in metrics_dict) → metric_count
[n]   Show Notification "Health synced ✓ (N metrics)"
```

---

## Setting Up Daily Automation

1. Open **Shortcuts** app
2. Tap **Automation** tab (bottom)
3. Tap **+** → **Create Personal Automation**
4. Choose **Time of Day**
5. Set time: **11:00 PM**
6. Repeat: **Daily**
7. Tap **Next** → tap **Add Action** → search "Run Shortcut"
8. Select your health shortcut
9. **Disable "Ask Before Running"** (toggle off) → tap Done

> ⚠️ iOS may still prompt once to grant Health permissions the first time it runs. Approve all categories.

---

## Granting Health Permissions

First manual run will trigger permission dialogs:

1. Open Shortcuts → tap your shortcut → tap ▶ (play)
2. For each Health category, tap **Allow** when prompted
3. If a prompt doesn't appear but data is missing, go to:
   - **Settings → Privacy & Security → Health → Shortcuts**
   - Enable all metric categories

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `401 Unauthorized` in response | Token mismatch — double-check `webhook-secret.txt` vs shortcut header |
| `0 metrics` in notification | Health data not collected yet — check Health app has data for today |
| Shortcut crashes | iOS memory limit — try removing the highest-frequency metrics (sleep, HRV) if using many |
| No notification | Check iOS Focus modes aren't blocking notifications |
| Metric shows `null` | That HealthKit type not available on this device (e.g., VO₂ Max needs Apple Watch) |
| `Connection refused` | VPS webhook server not running — SSH in and check `systemctl status health-webhook` |

---

## Quick Test

After building the shortcut, tap ▶ to run it manually.  
Then on the VPS:

```bash
# Check data arrived
python3 /root/.openclaw/workspace/scripts/health-webhook-query.py --period daily

# Or check raw DB
sqlite3 /root/.apple-health-sync/health_webhook.db \
  "SELECT date, metric, value, unit FROM metrics ORDER BY updated_at DESC LIMIT 20;"
```

---

## Notes on Metric Availability

- **VO₂ Max**: Requires Apple Watch
- **HRV**: Requires Apple Watch (captured during sleep/Breathe app)
- **Blood Oxygen**: Requires iPhone 13+ or Apple Watch Series 6+
- **Sleep Analysis**: Requires "Sleep" tracking enabled in Health app
- **Headphone Audio**: Only populated if you use AirPods with Transparency/Active Noise Cancellation
- **Resting Heart Rate**: Aggregated by Apple Watch overnight; may be blank without Watch

# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## API Quick Reference

| Service | Status | Notes |
|---------|--------|-------|
| Google OAuth | ✅ Active | Client: clawdasst, Calendar: mat@craftable.com only |
| GitHub | ✅ Active | Repo: Matweiss/clawd-brain-data (PRIVATE) |
| Vercel | ✅ Active | Dashboard deployed |
| Telegram | ✅ Active | User: 8001393940 |
| Google Sheets | ✅ CRM | Primary CRM (replaced HubSpot) |
| Perplexity | ✅ Active | Research Agent |
| Grok | ✅ Active | Trends + TTS |
| Avoma | ✅ Active | Meeting transcripts |
| ElevenLabs | ⏳ Pending | Voice generation |
| Supabase | ⏳ Pending | Database (if needed) |
| Minimax | ❌ Broken | Needs new API key |
| ~~HubSpot~~ | ❌ Removed | Migrated to Google Sheets CRM |

### Google OAuth Config
```
Client ID: 391258212025-nafc7rponmj6i0ot2326j8ontcete0gn.apps.googleusercontent.com
Project ID: clawdasst
Client Secret: [in .env]
Redirect: http://localhost
Scopes: Gmail, Calendar, Docs, Sheets, Slides, Forms
```

### CRM: Google Sheets (Primary)
**HubSpot has been removed.** Use Google Sheets as the main CRM.

```
Sheet Name: "Mat's Pipeline" (create this)
Structure:
- Column A: Company Name
- Column B: Stage (Qualification/Evaluation/Proposal/etc.)
- Column C: Amount ($)
- Column D: Close Date
- Column E: Last Contact
- Column F: Notes
- Column G: Next Action
```

**Sheet ID:** Get from URL after creating: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`

**API Access:** Use existing Google OAuth (sheets scope already included)

---

### GitHub Private Repo Access
To access Mat's private repos, you need:
1. Personal Access Token with `repo` scope, OR
2. Be added as a collaborator

Ask Mat for: `[REDACTED - see Vercel or 1Password]` token

Primary repos:
- `Matweiss/clawd-brain-data` (this workspace)
- `Matweiss/clawd-dashboard` (Vercel dashboard)
- `Matweiss/clawd-command-center` (mission control)

### HubSpot Filter
```json
{
  "filterGroups": [
    {"filters": [
      {"propertyName": "hubspot_owner_id", "value": "728033696"},
      {"propertyName": "dealstage", "value": "c9e227ad-c38d-4922-9501-fc2053229be9"}
    ]},
    {"filters": [
      {"propertyName": "hubspot_owner_id", "value": "728033696"},
      {"propertyName": "dealstage", "value": "997831554"}
    ]},
    {"filters": [
      {"propertyName": "hubspot_owner_id", "value": "728033696"},
      {"propertyName": "dealstage", "value": "eb3b0309-9555-4de9-bdec-b653a0a1efeb"}
    ]},
    {"filters": [
      {"propertyName": "hubspot_owner_id", "value": "728033696"},
      {"propertyName": "dealstage", "value": "94890f5c-dbc4-4c28-865c-fc032a485684"}
    ]},
    {"filters": [
      {"propertyName": "hubspot_owner_id", "value": "728033696"},
      {"propertyName": "dealstage", "value": "17b10f58-1abb-447b-a8bc-c7965662690d"}
    ]}
  ],
  "properties": ["dealname", "dealstage", "amount", "closedate", "notes_last_updated", "hs_lastmodifieddate"],
  "limit": 20
}
```

---

## Home Assistant Entity IDs (Updated March 2026)

### Mat's Location Tracking

**Watch (Apple Watch Ultra):**
- Area: `sensor.mat_s_ultra_watch_area`
- Geolocation: `device_tracker.mat_s_ultra_watch_bermuda_tracker`

**iPhone:**
- Area: `sensor.mat_s_phone_area`
- Geocoded Location: `sensor.mat_s_iphone_geocoded_location`
- Home Detection: `device_tracker.mat_s_phone_bermuda_tracker`
- Audio Output: `sensor.mat_s_iphone_audio_output` (detects car/Tesla audio)
- Device Tracker: `device_tracker.mat_s_iphone`

**iPhone Sensors:**
- Battery Level: `sensor.mat_s_iphone_battery_level`
- Battery State: `sensor.mat_s_iphone_battery_state`
- SSID: `sensor.mat_s_iphone_ssid`
- BSSID: `sensor.mat_s_iphone_bssid`
- Connection Type: `sensor.mat_s_iphone_connection_type`
- Storage: `sensor.mat_s_iphone_storage`
- SIM 1: `sensor.mat_s_iphone_sim_1`
- SIM 2: `sensor.mat_s_iphone_sim_2`
- Last Update Trigger: `sensor.mat_s_iphone_last_update_trigger`
- Activity: `sensor.mat_s_iphone_activity`
- Distance: `sensor.mat_s_iphone_distance`
- Focus Mode: `binary_sensor.mat_s_iphone_focus`
- Floors Ascended: `sensor.mat_s_iphone_floors_ascended`
- Floors Descended: `sensor.mat_s_iphone_floors_descended`
- Steps: `sensor.mat_s_iphone_steps`
- Average Active Pace: `sensor.mat_s_iphone_average_active_pace`
- App Version: `sensor.mat_s_iphone_app_version`
- Location Permission: `sensor.mat_s_iphone_location_permission`

### Pet Tracking

**Diggy:**
- Area: `sensor.diggy_big_beacon_area`

**Theo:**
- Area: `sensor.theo_white_ibeacon_area`

### Use Cases

**Location Awareness:**
- `sensor.mat_s_phone_area` → Home/Away/In Car
- `sensor.mat_s_iphone_audio_output` → Detects car audio (Tesla/Sarah's Tesla)
- `device_tracker.mat_s_phone_bermuda_tracker` → Home detection

**Mode Detection:**
- Focus mode → `binary_sensor.mat_s_iphone_focus`
- Activity → `sensor.mat_s_iphone_activity` (walking, driving, etc.)
- Connection type → WiFi vs Cellular

## Deployed Systems

| System | URL | Notes |
|--------|-----|-------|
| Clawd Dashboard | https://clawd-dashboard-eight.vercel.app | Needs HUBSPOT_TOKEN env var |
| Dashboard GitHub | https://github.com/Matweiss/clawd-dashboard | Source code |
| Brain Data | https://github.com/Matweiss/clawd-brain-data | Memory + docs |

---

## Examples

```markdown
### Cameras
- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH
- home-server → 192.168.1.100, user: admin

### TTS
- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.

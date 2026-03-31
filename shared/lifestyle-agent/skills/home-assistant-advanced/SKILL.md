---
name: home-assistant-advanced
description: Advanced Home Assistant control via curl - entity discovery, state queries, service calls
metadata:
  openclaw:
    emoji: 🏠
    requires:
      env:
        - HA_URL
        - HA_TOKEN
---

# Home Assistant Advanced Skill

Full-featured Home Assistant integration using proven curl-based API calls.

## Commands

### Get Entity State
```
ha-get-entity <entity_id>
```
Get current state of any entity.

### List Entities  
```
ha-list-entities [domain]
```
List all entities, optionally filtered by domain (sensor, light, button, etc.)

### Call Service
```
ha-call-service <domain> <service> [entity_id] [data]
```
Call any HA service - press buttons, trigger automations, control devices.

### Search Entities
```
ha-search <query>
```
Search entities by name or ID.

## Examples

```bash
# Get Theo's location
ha-get-entity device_tracker.theo_ble

# List all buttons
ha-list-entities button

# Feed Theo!
ha-call-service button press button.theo_s_food_feed

# Trigger lock-it-down automation
ha-call-service automation trigger automation.lock_it_down

# Search for Theo entities
ha-search theo
```

## Environment

Requires `HA_URL` and `HA_TOKEN` in OpenClaw environment.

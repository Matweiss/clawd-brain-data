---
name: home-assistant
description: Control Home Assistant entities via REST API - buttons, automations, sensors, locks
metadata: {"openclaw":{"emoji":"🏠","requires":{"env":["HA_URL","HA_TOKEN"]}}}
---

## Endpoints

- `POST /services/button/press` — Press a button entity (e.g., feed Theo)
- `POST /services/automation/trigger` — Trigger an automation (e.g., lock it down)
- `GET /states/{entity_id}` — Get entity state (sensors, trackers)
- `POST /services/lock/lock` — Lock a door lock
- `POST /services/lock/unlock` — Unlock a door lock

## Usage

```typescript
import { HomeAssistantClient } from "./api";

const client = new HomeAssistantClient();
// Use the client methods...
```

## Auth

No auth required

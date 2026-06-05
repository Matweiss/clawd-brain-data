---
name: hubspot-lookup
description: Look up a company and its contacts in Lucra's HubSpot (do we already have this account/contact?). Uses the stable private-app token, NOT the flaky claude.ai HS MCP. Use before prospecting a brand or to find an existing relationship.
metadata:
  type: tool
---

# hubspot-lookup

Reliable HubSpot reads via the private-app token (the claude.ai HS MCP is flaky).

## How
Reuse `scripts/luke-hubspot-smoke.py` helpers: `load_token()` + `request(path, token, body)`.
- Company search: `POST /crm/v3/objects/companies/search` with `{"query":"<brand>", "properties":["name","domain"]}`. Match strictly (normalized name equality) to avoid false positives on generic names (Target/Uber/Nike).
- Contacts: `GET /crm/v3/objects/companies/{id}/associations/contacts` → `POST /crm/v3/objects/contacts/batch/read` props `[firstname,lastname,jobtitle,email]`.
- Record link: `https://app.hubspot.com/contacts/39922003/record/0-2/{companyId}` (portal 39922003).
- Validate: a contact email whose domain != brand domain may be a false positive (e.g. GOAT→"Goated Golf").

Mat's owner id = 90593891. Token: `clawd-mission-control-v2/.env.local`.

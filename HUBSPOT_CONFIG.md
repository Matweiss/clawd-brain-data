# HubSpot Configuration

## Authentication
- **Token:** Stored in env var `HUBSPOT_TOKEN`
- **Owner ID:** 728033696 (Mat's deals only)

## Deal Stages to Monitor
Your active pipeline stages:
- `c9e227ad-c38d-4922-9501-fc2053229be9`
- `997831554`
- `eb3b0309-9555-4de9-bdec-b653a0a1efeb`
- `94890f5c-dbc4-4c28-865c-fc032a485684`
- `17b10f58-1abb-447b-a8bc-c7965662690d`

## Default Filter Query
```json
{
  "filterGroups": [
    {
      "filters": [
        { "propertyName": "hubspot_owner_id", "operator": "EQ", "value": "728033696" },
        { "propertyName": "dealstage", "operator": "EQ", "value": "c9e227ad-c38d-4922-9501-fc2053229be9" }
      ]
    },
    {
      "filters": [
        { "propertyName": "hubspot_owner_id", "operator": "EQ", "value": "728033696" },
        { "propertyName": "dealstage", "operator": "EQ", "value": "997831554" }
      ]
    },
    {
      "filters": [
        { "propertyName": "hubspot_owner_id", "operator": "EQ", "value": "728033696" },
        { "propertyName": "dealstage", "operator": "EQ", "value": "eb3b0309-9555-4de9-bdec-b653a0a1efeb" }
      ]
    },
    {
      "filters": [
        { "propertyName": "hubspot_owner_id", "operator": "EQ", "value": "728033696" },
        { "propertyName": "dealstage", "operator": "EQ", "value": "94890f5c-dbc4-4c28-865c-fc032a485684" }
      ]
    },
    {
      "filters": [
        { "propertyName": "hubspot_owner_id", "operator": "EQ", "value": "728033696" },
        { "propertyName": "dealstage", "operator": "EQ", "value": "17b10f58-1abb-447b-a8bc-c7965662690d" }
      ]
    }
  ],
  "properties": ["dealname", "dealstage", "amount", "closedate", "notes_last_updated", "hs_lastmodifieddate"],
  "limit": 20
}
```

## Properties to Track
- `dealname`
- `dealstage`
- `amount`
- `closedate`
- `notes_last_updated`
- `hs_lastmodifieddate`

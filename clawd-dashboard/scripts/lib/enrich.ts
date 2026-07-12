import type { HubSpotClient, HubSpotOwner } from "./hubspot";

// Pre-fetched lookup tables used to enrich raw HubSpot records with
// human-readable labels at sync time. Doing this once per sync run (not
// per record) keeps API call volume low — we make 1-3 extra requests at
// the start regardless of how many records we then page through.

export interface EnrichmentMaps {
  // For deals
  pipelineLabels: Map<string, string>;
  dealstageLabels: Map<string, string>;
  // For contacts
  lifecyclestageLabels: Map<string, string>;
  // For both
  ownerNames: Map<string, string>; // owner_id -> "First Last"
}

export async function buildContactEnrichmentMaps(
  hs: HubSpotClient
): Promise<EnrichmentMaps> {
  const [lifecyclestage, owners] = await Promise.all([
    hs.getProperty("contacts", "lifecyclestage"),
    hs.listOwners(),
  ]);

  return {
    pipelineLabels: new Map(),
    dealstageLabels: new Map(),
    lifecyclestageLabels: optionsToMap(lifecyclestage.options),
    ownerNames: ownersToMap(owners),
  };
}

export async function buildDealEnrichmentMaps(
  hs: HubSpotClient
): Promise<EnrichmentMaps> {
  const [pipeline, dealstage, owners] = await Promise.all([
    hs.getProperty("deals", "pipeline"),
    hs.getProperty("deals", "dealstage"),
    hs.listOwners(),
  ]);

  return {
    pipelineLabels: optionsToMap(pipeline.options),
    dealstageLabels: optionsToMap(dealstage.options),
    lifecyclestageLabels: new Map(),
    ownerNames: ownersToMap(owners),
  };
}

function optionsToMap(
  options?: { value: string; label: string }[]
): Map<string, string> {
  const m = new Map<string, string>();
  for (const o of options ?? []) m.set(o.value, o.label);
  return m;
}

function ownersToMap(owners: HubSpotOwner[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const o of owners) {
    const name =
      [o.firstName, o.lastName].filter(Boolean).join(" ").trim() ||
      o.email ||
      `Owner ${o.id}`;
    m.set(o.id, name);
  }
  return m;
}

/**
 * Look up a label, returning the original value if not found. The fallback
 * matters: if HubSpot adds a new stage/pipeline/owner between syncs we
 * want the raw ID to flow through rather than ending up with `undefined`
 * in the JSONB.
 */
export function resolveLabel(
  map: Map<string, string>,
  value: string | null | undefined
): string | null {
  if (!value) return null;
  return map.get(value) ?? value;
}

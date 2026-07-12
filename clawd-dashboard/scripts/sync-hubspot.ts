#!/usr/bin/env tsx
/**
 * sync-hubspot — one-shot HubSpot → Supabase mirror.
 *
 * Usage:
 *   npm run sync:hubspot -- --object-type contact
 *   npm run sync:hubspot -- --object-type deal
 *   npm run sync:hubspot -- --object-type deal --pipeline 794686386
 *   npm run sync:hubspot -- --object-type contact --dry-run --limit 50
 *
 * Phase 1 scope: contacts and deals only. Default-pipeline filter for deals.
 * Read-only — never reads from or writes to hs_pending_writes.
 */

import { config as dotenvConfig } from "dotenv";
import { resolve } from "node:path";

// Load .env.local first (Next.js convention) then .env as a fallback.
// We do this BEFORE any other import that reads env vars.
dotenvConfig({ path: resolve(process.cwd(), ".env.local") });
dotenvConfig({ path: resolve(process.cwd(), ".env") });

import { loadEnv } from "./lib/env";
import { HubSpotClient, type HubSpotObject } from "./lib/hubspot";
import { createSupabaseAdminClient } from "./lib/supabase-admin";
import {
  buildContactEnrichmentMaps,
  buildDealEnrichmentMaps,
  resolveLabel,
  type EnrichmentMaps,
} from "./lib/enrich";

// ---- Constants tied to the locked Phase 1 property scope ----

const DEFAULT_PIPELINE_ID = "794686386"; // "Sales Deals Pipeline"

const CONTACT_PROPERTIES = [
  "firstname",
  "lastname",
  "email",
  "phone",
  "mobilephone",
  "company",
  "lifecyclestage",
  "hubspot_owner_id",
  "notes_last_contacted",
  "createdate",
  "lastmodifieddate",
];

const DEAL_PROPERTIES = [
  "dealname",
  "amount",
  "dealstage",
  "closedate",
  "pipeline",
  "hubspot_owner_id",
  "createdate",
  "hs_lastmodifieddate",
];

// HubSpot's modified-date column differs by object type.
const MODIFIED_DATE_PROPERTY: Record<"contact" | "deal", string> = {
  contact: "lastmodifieddate",
  deal: "hs_lastmodifieddate",
};

const HS_OBJECT_TYPE: Record<"contact" | "deal", string> = {
  contact: "contact",
  deal: "deal",
};

// Search API endpoint takes plural object type names; our crm_objects
// table stores singular names per the schema. Keep both around.
const HS_SEARCH_TYPE: Record<"contact" | "deal", string> = {
  contact: "contacts",
  deal: "deals",
};

// Upsert in chunks. 100 was rejected by some Supabase clients in the past
// due to payload size; 50 is a safe round number that still gets us the
// throughput we want.
const UPSERT_CHUNK_SIZE = 50;

// ---- CLI parsing (no commander dep — argv is small enough) ----

interface Args {
  objectType: "contact" | "deal";
  pipeline: string;
  limit: number | null;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Partial<Args> = {
    pipeline: DEFAULT_PIPELINE_ID,
    limit: null,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--object-type":
      case "-t": {
        const v = argv[++i];
        if (v !== "contact" && v !== "deal") {
          fail(`--object-type must be 'contact' or 'deal' (got: ${v})`);
        }
        args.objectType = v as "contact" | "deal";
        break;
      }
      case "--pipeline":
        args.pipeline = argv[++i];
        break;
      case "--limit":
        args.limit = parseInt(argv[++i], 10);
        if (!Number.isFinite(args.limit!) || args.limit! <= 0) {
          fail("--limit must be a positive integer");
        }
        break;
      case "--dry-run":
        args.dryRun = true;
        break;
      case "--help":
      case "-h":
        printUsage();
        process.exit(0);
      default:
        fail(`Unknown argument: ${a}`);
    }
  }

  if (!args.objectType) {
    fail("--object-type is required (contact | deal)");
  }
  return args as Args;
}

function printUsage(): void {
  console.log(`
  Usage: npm run sync:hubspot -- --object-type <contact|deal> [options]

  Options:
    -t, --object-type <type>   Required. 'contact' or 'deal'.
        --pipeline <id>        Deal pipeline filter. Default: ${DEFAULT_PIPELINE_ID}
                               (Sales Deals Pipeline). Ignored for contacts.
        --limit <n>            Stop after upserting <n> records (testing).
        --dry-run              Fetch + log, but do not write to Supabase.
    -h, --help                 Show this help.
`);
}

function fail(msg: string): never {
  console.error(`\n  ERROR: ${msg}\n`);
  printUsage();
  process.exit(2);
}

// ---- Main ----

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const env = loadEnv();
  const hs = new HubSpotClient(env.hubspotToken);
  const sb = createSupabaseAdminClient(
    env.supabaseUrl,
    env.supabaseServiceRoleKey
  );

  const t0 = Date.now();
  log(`▸ sync-hubspot starting`, {
    objectType: args.objectType,
    pipeline: args.objectType === "deal" ? args.pipeline : "n/a",
    dryRun: args.dryRun,
    limit: args.limit ?? "(no limit)",
  });

  // 1. Build enrichment maps once for the whole run
  const enrichT0 = Date.now();
  const maps =
    args.objectType === "contact"
      ? await buildContactEnrichmentMaps(hs)
      : await buildDealEnrichmentMaps(hs);
  log(`  enrichment loaded in ${Date.now() - enrichT0}ms`, {
    pipelines: maps.pipelineLabels.size,
    dealstages: maps.dealstageLabels.size,
    lifecyclestages: maps.lifecyclestageLabels.size,
    owners: maps.ownerNames.size,
  });

  // 2. Stream pages from HubSpot, upserting each into Supabase
  const properties =
    args.objectType === "contact" ? CONTACT_PROPERTIES : DEAL_PROPERTIES;

  const filters =
    args.objectType === "deal"
      ? [{ propertyName: "pipeline", operator: "EQ", value: args.pipeline }]
      : [];

  const sortProperty = MODIFIED_DATE_PROPERTY[args.objectType];

  let totalFetched = 0;
  let totalUpserted = 0;
  let totalErrors = 0;

  outer: for await (const page of hs.searchPages({
    objectType: HS_SEARCH_TYPE[args.objectType],
    properties,
    filters,
    sortBy: sortProperty,
    sortDirection: "DESCENDING",
  })) {
    totalFetched += page.length;

    const rows = page.map((obj) => toCrmObjectRow(obj, args.objectType, maps));

    if (!args.dryRun) {
      // Chunk to avoid hitting Supabase request size limits
      for (let i = 0; i < rows.length; i += UPSERT_CHUNK_SIZE) {
        const chunk = rows.slice(i, i + UPSERT_CHUNK_SIZE);
        const { error, count } = await sb
          .from("crm_objects")
          .upsert(chunk, {
            onConflict: "hs_object_type,hs_object_id",
            count: "exact",
          });
        if (error) {
          totalErrors += chunk.length;
          console.error(`  upsert error on chunk of ${chunk.length}:`, error.message);
        } else {
          totalUpserted += count ?? chunk.length;
        }
      }
    } else {
      totalUpserted += rows.length;
    }

    log(
      `  page processed: fetched=${totalFetched} upserted=${totalUpserted} errors=${totalErrors}`
    );

    if (args.limit !== null && totalUpserted >= args.limit) {
      log(`  --limit ${args.limit} reached, stopping`);
      break outer;
    }
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  log(
    `▸ done in ${elapsed}s — fetched=${totalFetched} upserted=${totalUpserted} errors=${totalErrors}${
      args.dryRun ? " (dry run, nothing written)" : ""
    }`
  );

  process.exit(totalErrors > 0 ? 1 : 0);
}

// ---- Row construction ----

interface CrmObjectRow {
  hs_object_type: string;
  hs_object_id: number;
  properties: Record<string, string | null>;
  hs_updated_at: string | null;
  last_synced_at: string;
  synced_by: string;
}

function toCrmObjectRow(
  obj: HubSpotObject,
  objectType: "contact" | "deal",
  maps: EnrichmentMaps
): CrmObjectRow {
  // Start with the raw properties HubSpot returned. Properties that aren't
  // set on a given record are simply omitted from `obj.properties` — we
  // don't synthesize nulls for them, which keeps the JSONB tight.
  const properties: Record<string, string | null> = { ...obj.properties };

  // Owner name (both object types)
  const ownerId = obj.properties.hubspot_owner_id;
  if (ownerId) {
    properties.hubspot_owner_name = resolveLabel(maps.ownerNames, ownerId);
  }

  if (objectType === "deal") {
    properties.dealstage_label = resolveLabel(
      maps.dealstageLabels,
      obj.properties.dealstage
    );
    properties.pipeline_label = resolveLabel(
      maps.pipelineLabels,
      obj.properties.pipeline
    );
  } else {
    properties.lifecyclestage_label = resolveLabel(
      maps.lifecyclestageLabels,
      obj.properties.lifecyclestage
    );
  }

  // hs_updated_at varies by object type — centralize the asymmetry
  const modField = MODIFIED_DATE_PROPERTY[objectType];
  const hsUpdatedAt = obj.properties[modField] ?? obj.updatedAt ?? null;

  return {
    hs_object_type: HS_OBJECT_TYPE[objectType],
    hs_object_id: Number(obj.id),
    properties,
    hs_updated_at: hsUpdatedAt,
    last_synced_at: new Date().toISOString(),
    synced_by: "claude_code",
  };
}

// ---- Logging ----

function log(msg: string, meta?: Record<string, unknown>): void {
  if (meta) {
    console.log(msg, meta);
  } else {
    console.log(msg);
  }
}

main().catch((err) => {
  console.error("fatal:", err);
  process.exit(1);
});

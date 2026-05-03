"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { CrmObject } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

// Column definition for a CRM table. Each column reads from
// crm_objects.properties via a `key` and renders via an optional `render`.
export interface CrmTableColumn {
  // Property key inside `crm_objects.properties` JSONB. Special key
  // 'hs_updated_at' reads the top-level column instead.
  key: string;
  // Header label
  label: string;
  // Width hint — Tailwind class (e.g., "w-32")
  width?: string;
  // Sort behavior. 'string' (default), 'number', 'date'.
  sortType?: "string" | "number" | "date";
  // Tailwind alignment for both header + cell
  align?: "left" | "right";
  // Custom cell renderer. Receives the raw string value and the full row.
  render?: (value: string | null, row: CrmObject) => React.ReactNode;
}

interface CrmTableProps {
  hsObjectType: "contact" | "deal";
  columns: CrmTableColumn[];
  // Default sort: `key` references either a column key or 'hs_updated_at'
  defaultSort: { key: string; dir: "asc" | "desc" };
  // Initial fetch limit; real-world max here is the search API's 10k cap
  pageSize?: number;
}

type SortDir = "asc" | "desc";

export function CrmTable({
  hsObjectType,
  columns,
  defaultSort,
  pageSize = 200,
}: CrmTableProps) {
  const [rows, setRows] = useState<CrmObject[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<string>(defaultSort.key);
  const [sortDir, setSortDir] = useState<SortDir>(defaultSort.dir);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from("crm_objects")
        .select("*")
        .eq("hs_object_type", hsObjectType)
        .order("hs_updated_at", { ascending: false, nullsFirst: false })
        .limit(pageSize);

      if (cancelled) return;
      if (error) {
        setLoadError(error.message);
        setRows([]);
      } else {
        setRows((data ?? []) as CrmObject[]);
      }
      setLoaded(true);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [hsObjectType, pageSize]);

  const sortedRows = useMemo(
    () => sortRows(rows, columns, sortKey, sortDir),
    [rows, columns, sortKey, sortDir]
  );

  function onHeaderClick(col: CrmTableColumn) {
    if (col.sortType === undefined && col.key !== "hs_updated_at") {
      // Treat all columns as sortable — they're all strings by default.
    }
    if (sortKey === col.key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(col.key);
      setSortDir(col.sortType === "string" ? "asc" : "desc");
    }
  }

  if (!loaded) {
    return (
      <div className="py-10 font-mono text-xs text-bone-300">Loading…</div>
    );
  }
  if (loadError) {
    return (
      <div className="border border-status-blocked/40 bg-status-blocked/5 p-4 font-mono text-xs text-status-blocked">
        Load error: {loadError}
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="border hairline p-8 text-center">
        <div className="font-mono text-[10px] uppercase tracking-capwide text-bone-300">
          empty
        </div>
        <p className="mt-3 text-[14px] text-bone-200">
          No {hsObjectType}s mirrored yet. Run{" "}
          <code className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-[12px] text-bone-100">
            npm run sync:hubspot -- --object-type {hsObjectType}
          </code>{" "}
          to populate.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b hairline">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "py-3 font-mono text-[10px] font-medium uppercase tracking-capwide text-bone-300",
                  col.align === "right" ? "text-right" : "text-left",
                  "cursor-pointer select-none transition-colors hover:text-bone-100",
                  col.width
                )}
                onClick={() => onHeaderClick(col)}
              >
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5",
                    col.align === "right" && "justify-end"
                  )}
                >
                  {col.label}
                  <SortGlyph
                    active={sortKey === col.key}
                    dir={sortKey === col.key ? sortDir : null}
                  />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-700/60">
          {sortedRows.map((row) => (
            <tr
              key={row.id}
              className="text-[13px] text-bone-100 transition-colors hover:bg-ink-800/40"
            >
              {columns.map((col) => {
                const raw = readValue(row, col.key);
                return (
                  <td
                    key={col.key}
                    className={cn(
                      "py-3 align-top",
                      col.align === "right" ? "text-right font-mono" : "text-left"
                    )}
                  >
                    {col.render ? col.render(raw, row) : raw ?? <Em>—</Em>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 font-mono text-[10px] uppercase tracking-capwide text-bone-400">
        showing {rows.length} of mirrored records · sorted by {sortKey} {sortDir}
      </div>
    </div>
  );
}

// Read a value from a row by key. Special-cases the top-level
// `hs_updated_at` and `last_synced_at` columns; everything else is from
// the JSONB properties bag.
function readValue(row: CrmObject, key: string): string | null {
  if (key === "hs_updated_at") return row.hs_updated_at;
  if (key === "last_synced_at") return row.last_synced_at;
  return row.properties?.[key] ?? null;
}

function sortRows(
  rows: CrmObject[],
  columns: CrmTableColumn[],
  key: string,
  dir: SortDir
): CrmObject[] {
  const col = columns.find((c) => c.key === key);
  const sortType = col?.sortType ?? (key === "hs_updated_at" ? "date" : "string");
  const factor = dir === "asc" ? 1 : -1;

  // Build a comparator with stable null handling — nulls always sort
  // last regardless of direction
  return [...rows].sort((a, b) => {
    const av = readValue(a, key);
    const bv = readValue(b, key);
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;

    if (sortType === "number") {
      const an = Number(av);
      const bn = Number(bv);
      if (!Number.isFinite(an) && !Number.isFinite(bn)) return 0;
      if (!Number.isFinite(an)) return 1;
      if (!Number.isFinite(bn)) return -1;
      return (an - bn) * factor;
    }
    if (sortType === "date") {
      const at = Date.parse(av);
      const bt = Date.parse(bv);
      if (Number.isNaN(at) && Number.isNaN(bt)) return 0;
      if (Number.isNaN(at)) return 1;
      if (Number.isNaN(bt)) return -1;
      return (at - bt) * factor;
    }
    return av.localeCompare(bv) * factor;
  });
}

function SortGlyph({
  active,
  dir,
}: {
  active: boolean;
  dir: SortDir | null;
}) {
  if (!active) {
    return <span className="text-bone-400/40">↕</span>;
  }
  return (
    <span className="text-ember-500">{dir === "asc" ? "↑" : "↓"}</span>
  );
}

function Em({ children }: { children: React.ReactNode }) {
  return <span className="text-bone-400">{children}</span>;
}

// Small helpers exposed for use in renderers in the page files
export function fmtDate(value: string | null): string {
  if (!value) return "—";
  return timeAgo(value);
}

export function fmtMoney(value: string | null): string {
  if (!value) return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

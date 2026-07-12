import { PageShell } from "@/app/components/ui/page-shell";
import {
  CrmTable,
  fmtDate,
  fmtMoney,
  type CrmTableColumn,
} from "@/app/components/crm-table";
import { StatusPill } from "@/app/components/ui/status-pill";

export const dynamic = "force-dynamic";

const COLUMNS: CrmTableColumn[] = [
  {
    key: "dealname",
    label: "Deal",
    sortType: "string",
    render: (v) =>
      v ? (
        <span className="text-bone-50">{v}</span>
      ) : (
        <em className="text-bone-400">—</em>
      ),
  },
  {
    key: "amount",
    label: "Amount",
    sortType: "number",
    align: "right",
    render: (v) => (
      <span className={v ? "text-bone-50" : "text-bone-400"}>
        {fmtMoney(v)}
      </span>
    ),
  },
  {
    key: "dealstage_label",
    label: "Stage",
    sortType: "string",
    render: (v) =>
      v ? <StatusPill label={v} variant={stageVariant(v)} /> : <em className="text-bone-400">—</em>,
  },
  {
    key: "hubspot_owner_name",
    label: "Owner",
    sortType: "string",
  },
  {
    key: "closedate",
    label: "Close",
    sortType: "date",
    align: "right",
    render: (v) => <span className="text-bone-300">{fmtDate(v)}</span>,
  },
  {
    key: "hs_updated_at",
    label: "Modified",
    sortType: "date",
    align: "right",
    render: (v) => <span className="text-bone-300">{fmtDate(v)}</span>,
  },
];

function stageVariant(
  label: string
): "open" | "progress" | "blocked" | "done" | "neutral" {
  // Stage name → pill variant. The color does the work of "where in the
  // funnel is this deal", which beats alphabetical sort for at-a-glance
  // scanning.
  const k = label.toLowerCase();
  if (k.includes("won")) return "open";
  if (k.includes("lost") || k.includes("churned")) return "blocked";
  if (
    k.includes("verbal") ||
    k.includes("commercial") ||
    k.includes("negotiation") ||
    k.includes("contract") ||
    k.includes("decision maker")
  ) {
    return "progress";
  }
  if (k.includes("scheduled") || k.includes("discovery") || k.includes("demo"))
    return "progress";
  return "neutral";
}

export default function DealsPage() {
  return (
    <PageShell
      eyebrow="phase 1 · crm mirror"
      title="Deals."
      tagline={
        <>
          Default pipeline only — Sales Deals Pipeline. Stage colors map to
          funnel position. Sortable on every column.
        </>
      }
    >
      <CrmTable
        hsObjectType="deal"
        columns={COLUMNS}
        defaultSort={{ key: "hs_updated_at", dir: "desc" }}
      />
    </PageShell>
  );
}

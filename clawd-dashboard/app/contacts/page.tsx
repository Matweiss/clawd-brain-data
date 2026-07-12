import { PageShell } from "@/app/components/ui/page-shell";
import {
  CrmTable,
  fmtDate,
  type CrmTableColumn,
} from "@/app/components/crm-table";
import { StatusPill } from "@/app/components/ui/status-pill";
import type { CrmObject } from "@/lib/types";

export const dynamic = "force-dynamic";

const COLUMNS: CrmTableColumn[] = [
  {
    key: "lastname",
    label: "Name",
    sortType: "string",
    render: (_v, row) => {
      const first = row.properties.firstname ?? "";
      const last = row.properties.lastname ?? "";
      const full = [first, last].filter(Boolean).join(" ").trim();
      return (
        <span className="text-bone-50">{full || <em className="text-bone-400">—</em>}</span>
      );
    },
  },
  {
    key: "email",
    label: "Email",
    sortType: "string",
    render: (v) =>
      v ? (
        <a
          href={`mailto:${v}`}
          className="font-mono text-[12px] text-bone-200 hover:text-ember-500"
        >
          {v}
        </a>
      ) : (
        <em className="text-bone-400">—</em>
      ),
  },
  {
    key: "company",
    label: "Company",
    sortType: "string",
  },
  {
    key: "lifecyclestage_label",
    label: "Lifecycle",
    sortType: "string",
    render: (v) =>
      v ? <StatusPill label={v} variant={lifecycleVariant(v)} /> : <em className="text-bone-400">—</em>,
  },
  {
    key: "hubspot_owner_name",
    label: "Owner",
    sortType: "string",
  },
  {
    key: "phone",
    label: "Phone",
    sortType: "string",
    render: (v, row) => {
      const phone = v ?? row.properties.mobilephone ?? null;
      if (!phone) return <em className="text-bone-400">—</em>;
      return <span className="font-mono text-[12px]">{phone}</span>;
    },
  },
  {
    key: "hs_updated_at",
    label: "Modified",
    sortType: "date",
    align: "right",
    render: (v) => <span className="text-bone-300">{fmtDate(v)}</span>,
  },
];

function lifecycleVariant(
  label: string
): "open" | "progress" | "blocked" | "done" | "neutral" {
  // Map HubSpot lifecycle stages to status pill variants. Roughly:
  //   early → neutral, mid-funnel → progress, customer/evangelist → open,
  //   other → done. This is opinionated but it gives the column visual
  //   weight and matches the rest of the dashboard's color system.
  const k = label.toLowerCase();
  if (k.includes("customer") || k.includes("evangelist")) return "open";
  if (k.includes("opportunity") || k.includes("sales qualified"))
    return "progress";
  if (k.includes("marketing qualified") || k.includes("lead")) return "neutral";
  if (k.includes("subscriber")) return "neutral";
  return "done";
}

export default function ContactsPage() {
  return (
    <PageShell
      eyebrow="phase 1 · crm mirror"
      title="Contacts."
      tagline={
        <>
          People in your HubSpot, mirrored on demand. Sortable on every
          column. Run the sync to refresh.
        </>
      }
    >
      <CrmTable
        hsObjectType="contact"
        columns={COLUMNS}
        defaultSort={{ key: "hs_updated_at", dir: "desc" }}
      />
    </PageShell>
  );
}

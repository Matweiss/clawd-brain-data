import Link from "next/link";
import { PageShell } from "@/app/components/ui/page-shell";
import { DevicesClient } from "./DevicesClient";

export const dynamic = "force-dynamic";

export default function DevicesPage() {
  return (
    <PageShell
      eyebrow="phase 2 · meeting insights · devices"
      title="Capture devices."
      tagline={
        <>
          Macs heartbeating frame captures into Supabase. Stale chip
          appears when a device has been silent for over 24 hours.
        </>
      }
      rightMeta={
        <Link
          href="/meetings"
          className="border border-ink-700 px-3 py-1.5 font-mono text-[11px] uppercase tracking-capwide text-bone-300 transition-colors hover:border-ink-500 hover:text-bone-100"
        >
          ← Meetings
        </Link>
      }
    >
      <DevicesClient />
    </PageShell>
  );
}

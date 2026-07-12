import Link from "next/link";
import { PageShell } from "@/app/components/ui/page-shell";
import { MeetingsListClient } from "./MeetingsListClient";

export const dynamic = "force-dynamic";

export default function MeetingsPage() {
  return (
    <PageShell
      eyebrow="phase 2 · meeting insights"
      title="Meetings."
      tagline={
        <>
          Cross-referenced transcripts and visuals from Google Meet
          captures. Surfaces slides shared but never spoken about.
        </>
      }
      rightMeta={
        <Link
          href="/meetings/devices"
          className="border border-ink-700 px-3 py-1.5 font-mono text-[11px] uppercase tracking-capwide text-bone-300 transition-colors hover:border-ink-500 hover:text-bone-100"
        >
          Devices →
        </Link>
      }
    >
      <MeetingsListClient />
    </PageShell>
  );
}

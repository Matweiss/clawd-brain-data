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
    >
      <MeetingsListClient />
    </PageShell>
  );
}

import { PageShell } from "@/app/components/ui/page-shell";

export default function Loading() {
  return (
    <PageShell
      eyebrow="phase 2 · meeting insights"
      title="Loading…"
    >
      <div className="py-10 font-mono text-xs text-bone-300">
        Fetching meeting…
      </div>
    </PageShell>
  );
}

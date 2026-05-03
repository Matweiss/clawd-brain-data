import { StatusPill } from "@/app/components/ui/status-pill";
import type { MeetingReviewStatus, MeetingReviewFailureCode } from "@shared/db";

type StatusVariant = "open" | "progress" | "blocked" | "done" | "neutral";

const STATUS_MAP: Record<
  NonNullable<MeetingReviewStatus> | "null",
  { label: string; variant: StatusVariant; dot?: boolean }
> = {
  complete: { label: "complete", variant: "done" },
  analyzing: { label: "analyzing", variant: "progress", dot: true },
  pending_transcript: { label: "waiting transcript", variant: "neutral" },
  failed: { label: "failed", variant: "blocked" },
  null: { label: "not analyzed", variant: "neutral" },
};

export function MeetingStatusPill({
  status,
  failure_code,
}: {
  status: MeetingReviewStatus | null;
  failure_code?: MeetingReviewFailureCode | null;
}) {
  const key = status ?? "null";
  const config = STATUS_MAP[key];
  return (
    <span className="inline-flex items-center gap-2">
      <StatusPill
        label={config.label}
        variant={config.variant}
        dot={config.dot}
      />
      {status === "failed" && failure_code && (
        <span className="font-mono text-[10px] uppercase tracking-capwide text-status-blocked/80">
          {failure_code}
        </span>
      )}
    </span>
  );
}

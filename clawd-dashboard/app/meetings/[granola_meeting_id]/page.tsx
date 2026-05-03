import { notFound } from "next/navigation";
import { PageShell } from "@/app/components/ui/page-shell";
import { fetchMeetingDetail } from "@/lib/meetings/fetch-detail";
import { MeetingClient } from "./MeetingClient";

export const dynamic = "force-dynamic";

export default async function MeetingDetailPage({
  params,
}: {
  params: { granola_meeting_id: string };
}) {
  const detail = await fetchMeetingDetail(params.granola_meeting_id);

  // 404 only when there is no Granola meta AND no review row — no way to
  // identify the meeting at all. If either source has it, render the page
  // (the empty / analyzing / failed states render inline below).
  if (!detail.meeting && !detail.review) {
    notFound();
  }

  const title =
    detail.meeting?.title ??
    detail.review?.granola_meeting_id ??
    params.granola_meeting_id;

  return (
    <PageShell
      eyebrow="phase 2 · meeting insights"
      title={title}
      tagline={
        detail.meeting?.started_at && (
          <>
            {new Date(detail.meeting.started_at).toLocaleString(undefined, {
              dateStyle: "long",
              timeStyle: "short",
            })}
            {detail.meeting.ended_at && (
              <>
                {" → "}
                {new Date(detail.meeting.ended_at).toLocaleTimeString(
                  undefined,
                  { timeStyle: "short" }
                )}
              </>
            )}
          </>
        )
      }
    >
      <MeetingClient
        granolaMeetingId={params.granola_meeting_id}
        initialDetail={detail}
      />
    </PageShell>
  );
}

import { fetchMeetingDetail } from "@/lib/meetings/fetch-detail";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { granola_meeting_id: string } }
) {
  try {
    const detail = await fetchMeetingDetail(params.granola_meeting_id);
    return Response.json(detail);
  } catch (e) {
    return Response.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}

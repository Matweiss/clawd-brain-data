export const dynamic = "force-dynamic";

export async function POST() {
  return Response.json(
    {
      error: "not_implemented",
      message: "Notion writeback ships in Phase 3.",
    },
    { status: 501 }
  );
}

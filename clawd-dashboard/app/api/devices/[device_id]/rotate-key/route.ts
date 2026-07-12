export const dynamic = "force-dynamic";

export async function POST() {
  return Response.json(
    {
      error: "not_implemented",
      message: "Per-device anon-key rotation ships in Phase 3.",
    },
    { status: 501 }
  );
}

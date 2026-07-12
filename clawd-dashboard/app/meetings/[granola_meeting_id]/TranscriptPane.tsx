import type { MeetingDetailTranscriptChunk } from "@/lib/meetings/fetch-detail";

export function TranscriptPane({
  chunks,
}: {
  chunks: MeetingDetailTranscriptChunk[];
}) {
  if (chunks.length === 0) {
    return (
      <section className="border hairline p-4">
        <div className="font-mono text-[10px] uppercase tracking-capwide text-bone-300">
          transcript
        </div>
        <p className="mt-3 text-[13px] italic text-bone-400">
          No transcript chunks yet. Granola may still be processing, or the
          analyzer has not run.
        </p>
      </section>
    );
  }

  return (
    <section className="border hairline">
      <header className="flex items-baseline justify-between border-b hairline px-4 py-3">
        <div className="font-mono text-[10px] uppercase tracking-capwide text-bone-300">
          transcript
        </div>
        <div className="font-mono text-[10px] uppercase tracking-capwide text-bone-500">
          {chunks.length} {chunks.length === 1 ? "chunk" : "chunks"}
        </div>
      </header>
      <div className="max-h-[700px] divide-y divide-ink-700/60 overflow-y-auto">
        {chunks.map((c) => (
          <div key={c.id} className="px-4 py-3">
            <div className="mb-1 font-mono text-[10px] uppercase tracking-capwide text-bone-500">
              {new Date(c.chunk_start_ts).toLocaleTimeString()} —{" "}
              {new Date(c.chunk_end_ts).toLocaleTimeString()}
            </div>
            <p className="text-[13px] leading-relaxed text-bone-100">
              {c.chunk_text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

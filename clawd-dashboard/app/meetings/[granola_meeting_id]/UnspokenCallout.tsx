"use client";

import { cn } from "@/lib/utils";
import { DeviceChip } from "./DeviceChip";
import type {
  MeetingDetailVisual,
  MeetingDetailReview,
} from "@/lib/meetings/fetch-detail";

const ARCHIVED_COPY = "Image archived after 90 days — caption preserved.";

export function UnspokenCallout({
  unspoken,
  visualsById,
  onOpen,
}: {
  unspoken: MeetingDetailReview["unspoken_visuals"];
  visualsById: Map<string, MeetingDetailVisual>;
  onOpen: (visualId: string) => void;
}) {
  if (unspoken.length === 0) return null;

  return (
    <section className="border border-ember-500/30 bg-ember-500/5 p-6">
      <header className="mb-4 flex items-baseline justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-capwide text-ember-500">
            unspoken visuals · the killer feature
          </div>
          <h2 className="mt-2 font-display text-2xl tracking-tightest text-bone-50">
            {unspoken.length}{" "}
            {unspoken.length === 1 ? "slide" : "slides"} shared but never
            spoken about
          </h2>
        </div>
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {unspoken.map((u) => {
          const visual = visualsById.get(u.frame_id);
          return (
            <UnspokenCard
              key={u.frame_id}
              unspoken={u}
              visual={visual}
              onOpen={() => visual && onOpen(visual.id)}
            />
          );
        })}
      </div>
    </section>
  );
}

function UnspokenCard({
  unspoken,
  visual,
  onOpen,
}: {
  unspoken: MeetingDetailReview["unspoken_visuals"][number];
  visual: MeetingDetailVisual | undefined;
  onOpen: () => void;
}) {
  const archived =
    !visual?.signed_url || visual?.signed_url_error === "not_found";
  const slideText = unspoken.slide_text ?? visual?.slide_text ?? null;

  return (
    <article className="flex flex-col gap-3 border hairline bg-ink-900/40 p-4">
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "group relative aspect-video overflow-hidden border border-ink-700 bg-ink-950",
          visual && "cursor-zoom-in hover:border-ember-500/50"
        )}
        disabled={!visual}
      >
        {visual && !archived ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={visual.signed_url!}
            alt={slideText ?? "Unspoken slide"}
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center">
            <div className="font-mono text-[10px] uppercase tracking-capwide text-bone-400">
              archived
            </div>
            <p className="text-[12px] text-bone-300">{ARCHIVED_COPY}</p>
          </div>
        )}
      </button>

      <div className="space-y-2">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-capwide text-bone-400">
          <span>{new Date(unspoken.frame_ts).toLocaleTimeString()}</span>
          {visual && <DeviceChip label={visual.device_label} />}
          {unspoken.deictic_fallback_used && (
            <span className="text-ember-500/70">deictic-fallback</span>
          )}
        </div>
        {slideText ? (
          <p className="text-[13px] leading-relaxed text-bone-100">
            {slideText}
          </p>
        ) : (
          <p className="font-mono text-[12px] italic text-bone-500">
            No OCR text — {unspoken.reason}
          </p>
        )}
        {typeof unspoken.max_chunk_cosine === "number" && (
          <div className="font-mono text-[10px] text-bone-500">
            max cosine: {unspoken.max_chunk_cosine.toFixed(3)}
          </div>
        )}
      </div>
    </article>
  );
}

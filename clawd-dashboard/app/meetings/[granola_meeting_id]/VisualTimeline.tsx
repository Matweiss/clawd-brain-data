"use client";

import { cn } from "@/lib/utils";
import { DeviceChip } from "./DeviceChip";
import type { MeetingDetailVisual } from "@/lib/meetings/fetch-detail";

const ARCHIVED_COPY = "Image archived after 90 days — caption preserved.";

export function VisualTimeline({
  visuals,
  onOpen,
}: {
  visuals: MeetingDetailVisual[];
  onOpen: (index: number) => void;
}) {
  if (visuals.length === 0) {
    return (
      <section className="border hairline p-4">
        <div className="font-mono text-[10px] uppercase tracking-capwide text-bone-300">
          visuals
        </div>
        <p className="mt-3 text-[13px] italic text-bone-400">
          No frames captured for this meeting. Either no Mac was capturing
          while the meeting ran, or the analyzer has not run yet.
        </p>
      </section>
    );
  }

  return (
    <section className="border hairline">
      <header className="flex items-baseline justify-between border-b hairline px-4 py-3">
        <div className="font-mono text-[10px] uppercase tracking-capwide text-bone-300">
          visuals
        </div>
        <div className="font-mono text-[10px] uppercase tracking-capwide text-bone-500">
          {visuals.length} {visuals.length === 1 ? "frame" : "frames"}
        </div>
      </header>
      <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3">
        {visuals.map((v, i) => (
          <Thumb key={v.id} v={v} onClick={() => onOpen(i)} />
        ))}
      </div>
    </section>
  );
}

function Thumb({
  v,
  onClick,
}: {
  v: MeetingDetailVisual;
  onClick: () => void;
}) {
  const archived = !v.signed_url || v.signed_url_error === "not_found";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex flex-col gap-2 border hairline p-2 text-left transition-colors",
        "hover:border-ember-500/50"
      )}
    >
      <div className="relative aspect-video overflow-hidden border border-ink-700 bg-ink-950">
        {!archived ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={v.signed_url!}
            alt={v.slide_text ?? "Meeting frame"}
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center">
            <div className="font-mono text-[9px] uppercase tracking-capwide text-bone-400">
              archived
            </div>
            <p className="text-[10px] text-bone-300">{ARCHIVED_COPY}</p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-capwide text-bone-400">
        <span>{new Date(v.frame_ts).toLocaleTimeString()}</span>
        <DeviceChip label={v.device_label} />
      </div>
      {archived && v.slide_text && (
        <p className="line-clamp-3 text-[11px] leading-snug text-bone-300">
          {v.slide_text}
        </p>
      )}
    </button>
  );
}

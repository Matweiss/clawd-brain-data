"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { DeviceChip } from "./DeviceChip";
import type { MeetingDetailVisual } from "@/lib/meetings/fetch-detail";

const ARCHIVED_COPY = "Image archived after 90 days — caption preserved.";

type LightboxProps = {
  visuals: MeetingDetailVisual[];
  index: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
};

export function Lightbox({
  visuals,
  index,
  onClose,
  onNext,
  onPrev,
}: LightboxProps) {
  const visual = visuals[index];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        onPrev();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onNext, onPrev]);

  if (!visual) return null;

  const archived = !visual.signed_url || visual.signed_url_error === "not_found";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-ink-950/95 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <header className="flex items-center justify-between border-b hairline px-6 py-3 font-mono text-[10px] uppercase tracking-capwide text-bone-300">
        <span>
          Frame {index + 1} of {visuals.length}
        </span>
        <span className="flex items-center gap-3">
          <span className="hidden text-bone-500 md:inline">
            ← / → · Esc to close
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="border border-ink-600 px-2 py-1 hover:border-ember-500/60 hover:text-bone-100"
          >
            Close
          </button>
        </span>
      </header>

      <div
        className="flex flex-1 items-center justify-center overflow-hidden p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {!archived ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={visual.signed_url!}
            alt={visual.slide_text ?? "Meeting frame"}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <ArchivedPlaceholder slideText={visual.slide_text} />
        )}
      </div>

      <footer
        className="border-t hairline bg-ink-900/80 px-6 py-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto max-w-3xl space-y-2">
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-capwide text-bone-400">
            <span>{new Date(visual.frame_ts).toLocaleString()}</span>
            <DeviceChip label={visual.device_label} />
            {archived && (
              <span className="text-bone-500">archived</span>
            )}
          </div>
          {visual.slide_text && (
            <p className="text-[14px] leading-relaxed text-bone-100">
              {visual.slide_text}
            </p>
          )}
          {!visual.slide_text && (
            <p className="font-mono text-[12px] italic text-bone-500">
              No OCR text on this frame.
            </p>
          )}
          {visual.ai_caption && (
            <p className="text-[12px] italic text-bone-300">
              caption: {visual.ai_caption}
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}

function ArchivedPlaceholder({ slideText }: { slideText: string | null }) {
  return (
    <div
      className={cn(
        "flex max-h-full max-w-2xl flex-col items-center justify-center gap-4 border hairline bg-ink-900/40 p-10 text-center"
      )}
    >
      <div className="font-mono text-[10px] uppercase tracking-capwide text-bone-400">
        archived
      </div>
      <p className="font-display text-2xl text-bone-100">{ARCHIVED_COPY}</p>
      {slideText && (
        <div className="mt-4 max-w-xl border-t hairline pt-4 text-left">
          <div className="font-mono text-[10px] uppercase tracking-capwide text-bone-400">
            slide text
          </div>
          <p className="mt-2 text-[14px] leading-relaxed text-bone-100">
            {slideText}
          </p>
        </div>
      )}
    </div>
  );
}

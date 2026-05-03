"use client";

import { useEffect, useMemo, useState } from "react";
import { MeetingStatusPill } from "@/app/components/meetings/MeetingStatusPill";
import { ActionBar } from "./ActionBar";
import { UnspokenCallout } from "./UnspokenCallout";
import { TranscriptPane } from "./TranscriptPane";
import { VisualTimeline } from "./VisualTimeline";
import { Lightbox } from "./Lightbox";
import type { MeetingDetail } from "@/lib/meetings/fetch-detail";

const SIGNED_URL_REFRESH_BUFFER_MS = 5 * 60 * 1000;
const POLL_AFTER_REANALYZE_MS = 3_000;

export function MeetingClient({
  granolaMeetingId,
  initialDetail,
}: {
  granolaMeetingId: string;
  initialDetail: MeetingDetail;
}) {
  const [detail, setDetail] = useState<MeetingDetail>(initialDetail);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [polling, setPolling] = useState(false);

  const visualsById = useMemo(
    () => new Map(detail.visuals.map((v) => [v.id, v])),
    [detail.visuals]
  );

  // Refresh signed URLs on tab focus when any expire within 5 minutes.
  useEffect(() => {
    async function refreshExpired() {
      const now = Date.now();
      const expiringIds = detail.visuals
        .filter(
          (v) =>
            v.signed_url_expires_at &&
            new Date(v.signed_url_expires_at).getTime() - now <
              SIGNED_URL_REFRESH_BUFFER_MS
        )
        .map((v) => v.id);
      if (expiringIds.length === 0) return;
      try {
        const res = await fetch(
          `/api/meetings/${granolaMeetingId}/signed-urls/refresh`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ frame_ids: expiringIds }),
          }
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
          urls: Array<{
            frame_id: string;
            signed_url?: string;
            signed_url_expires_at?: string;
            error?: string;
          }>;
        };
        const byId = new Map(data.urls.map((u) => [u.frame_id, u]));
        setDetail((d) => ({
          ...d,
          visuals: d.visuals.map((v) => {
            const u = byId.get(v.id);
            if (!u || !u.signed_url) return v;
            return {
              ...v,
              signed_url: u.signed_url,
              signed_url_expires_at: u.signed_url_expires_at ?? null,
              signed_url_error: null,
            };
          }),
        }));
      } catch {
        // swallow — old URLs will surface as not_found in the lightbox
      }
    }

    function onVisible() {
      if (document.visibilityState === "visible") refreshExpired();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [detail.visuals, granolaMeetingId]);

  // After click-Reanalyze, poll the detail endpoint until status flips
  // out of analyzing. Step 6 swaps this for a Realtime subscription.
  useEffect(() => {
    if (!polling) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function tick() {
      if (cancelled) return;
      try {
        const res = await fetch(`/api/meetings/${granolaMeetingId}`);
        if (res.ok) {
          const next = (await res.json()) as MeetingDetail;
          if (cancelled) return;
          setDetail(next);
          if (next.review?.status && next.review.status !== "analyzing") {
            setPolling(false);
            return;
          }
        }
      } catch {
        // ignore one tick
      }
      timer = setTimeout(tick, POLL_AFTER_REANALYZE_MS);
    }

    tick();
    return () => {
      cancelled = true;
      if (timer!) clearTimeout(timer);
    };
  }, [polling, granolaMeetingId]);

  const status = detail.review?.status ?? null;
  const failureCode = detail.review?.failure_code ?? null;

  function openLightbox(visualId: string) {
    const idx = detail.visuals.findIndex((v) => v.id === visualId);
    if (idx >= 0) setLightboxIndex(idx);
  }

  function openLightboxAtIndex(i: number) {
    setLightboxIndex(i);
  }

  function closeLightbox() {
    setLightboxIndex(null);
  }

  function nextLightbox() {
    setLightboxIndex((i) =>
      i === null ? null : (i + 1) % detail.visuals.length
    );
  }

  function prevLightbox() {
    setLightboxIndex((i) =>
      i === null
        ? null
        : (i - 1 + detail.visuals.length) % detail.visuals.length
    );
  }

  function onAnalyzingStart() {
    // Optimistic local flip — keeps the spinner from flickering before
    // the next poll.
    setDetail((d) => ({
      ...d,
      review: d.review
        ? { ...d.review, status: "analyzing" }
        : null,
    }));
    setPolling(true);
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b hairline pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <MeetingStatusPill status={status} failure_code={failureCode} />
          {polling && (
            <span className="font-mono text-[10px] uppercase tracking-capwide text-ember-500">
              watching for analyzer…
            </span>
          )}
          {detail.review?.failure_reason && (
            <span className="font-mono text-[11px] text-status-blocked/80">
              {detail.review.failure_reason}
            </span>
          )}
        </div>
        <ActionBar
          granolaMeetingId={granolaMeetingId}
          status={status}
          onAnalyzingStart={onAnalyzingStart}
        />
      </header>

      {detail.review === null && <NotYetAnalyzedHero />}

      {detail.review && detail.review.unspoken_visuals.length > 0 && (
        <UnspokenCallout
          unspoken={detail.review.unspoken_visuals}
          visualsById={visualsById}
          onOpen={openLightbox}
        />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
        <TranscriptPane chunks={detail.transcript_chunks} />
        <VisualTimeline
          visuals={detail.visuals}
          onOpen={openLightboxAtIndex}
        />
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          visuals={detail.visuals}
          index={lightboxIndex}
          onClose={closeLightbox}
          onNext={nextLightbox}
          onPrev={prevLightbox}
        />
      )}
    </div>
  );
}

function NotYetAnalyzedHero() {
  return (
    <section className="border border-ember-500/30 bg-ember-500/5 p-6 text-center">
      <div className="font-mono text-[10px] uppercase tracking-capwide text-ember-500">
        not yet analyzed
      </div>
      <p className="mx-auto mt-3 max-w-xl text-[14px] text-bone-200">
        This meeting exists in Granola but has not been processed by the
        capture analyzer yet. Click <strong>Re-analyze</strong> above to
        run it now, or wait for the auto-trigger cron to pick it up
        within ~5 minutes after Granola syncs.
      </p>
    </section>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MeetingStatusPill } from "@/app/components/meetings/MeetingStatusPill";
import { useMeetingReviewRealtime } from "@/lib/meetings/realtime";
import { cn } from "@/lib/utils";
import { ActionBar } from "./ActionBar";
import { UnspokenCallout } from "./UnspokenCallout";
import { TranscriptPane } from "./TranscriptPane";
import { VisualTimeline } from "./VisualTimeline";
import { Lightbox } from "./Lightbox";
import type { MeetingDetail } from "@/lib/meetings/fetch-detail";

const SIGNED_URL_REFRESH_BUFFER_MS = 5 * 60 * 1000;

type Tab = "unspoken" | "transcript" | "visuals";

export function MeetingClient({
  granolaMeetingId,
  initialDetail,
}: {
  granolaMeetingId: string;
  initialDetail: MeetingDetail;
}) {
  const [detail, setDetail] = useState<MeetingDetail>(initialDetail);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const visualsById = useMemo(
    () => new Map(detail.visuals.map((v) => [v.id, v])),
    [detail.visuals]
  );

  const unspoken = detail.review?.unspoken_visuals ?? [];
  const hasUnspoken = unspoken.length > 0;

  // Default tab on mobile: unspoken if it exists, else transcript.
  const [tab, setTab] = useState<Tab>(hasUnspoken ? "unspoken" : "transcript");

  const refetchDetail = useCallback(async () => {
    try {
      const res = await fetch(`/api/meetings/${granolaMeetingId}`);
      if (!res.ok) return;
      const next = (await res.json()) as MeetingDetail;
      setDetail(next);
    } catch {
      // swallow — next Realtime tick or visibility refresh retries
    }
  }, [granolaMeetingId]);

  useMeetingReviewRealtime(granolaMeetingId, refetchDetail);

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
        // swallow
      }
    }

    function onVisible() {
      if (document.visibilityState === "visible") refreshExpired();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [detail.visuals, granolaMeetingId]);

  const status = detail.review?.status ?? null;
  const failureCode = detail.review?.failure_code ?? null;
  const isAnalyzing = status === "analyzing";

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
    setDetail((d) => ({
      ...d,
      review: d.review ? { ...d.review, status: "analyzing" } : null,
    }));
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b hairline pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <MeetingStatusPill status={status} failure_code={failureCode} />
          {isAnalyzing && (
            <span className="font-mono text-[10px] uppercase tracking-capwide text-ember-500">
              live · analyzer running
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

      {/* Mobile (<900px): single-column tab view. Three tabs: Unspoken /
          Transcript / Visuals. Hides on desktop. */}
      <div className="min-[900px]:hidden">
        <TabNav
          active={tab}
          onChange={setTab}
          unspokenCount={unspoken.length}
          frameCount={detail.visuals.length}
          chunkCount={detail.transcript_chunks.length}
        />
        <div className="mt-4">
          {tab === "unspoken" && (
            <>
              {hasUnspoken ? (
                <UnspokenCallout
                  unspoken={unspoken}
                  visualsById={visualsById}
                  onOpen={openLightbox}
                />
              ) : (
                <EmptyTab message="No unspoken visuals on this meeting." />
              )}
            </>
          )}
          {tab === "transcript" && (
            <TranscriptPane chunks={detail.transcript_chunks} />
          )}
          {tab === "visuals" && (
            <VisualTimeline
              visuals={detail.visuals}
              onOpen={openLightboxAtIndex}
            />
          )}
        </div>
      </div>

      {/* Desktop (>=900px): hero on top + side-by-side split. Hides on
          mobile. */}
      <div className="hidden space-y-8 min-[900px]:block">
        {hasUnspoken && (
          <UnspokenCallout
            unspoken={unspoken}
            visualsById={visualsById}
            onOpen={openLightbox}
          />
        )}
        <div className="grid grid-cols-1 gap-6 min-[900px]:grid-cols-2">
          <TranscriptPane chunks={detail.transcript_chunks} />
          <VisualTimeline
            visuals={detail.visuals}
            onOpen={openLightboxAtIndex}
          />
        </div>
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

function TabNav({
  active,
  onChange,
  unspokenCount,
  frameCount,
  chunkCount,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
  unspokenCount: number;
  frameCount: number;
  chunkCount: number;
}) {
  const TABS: Array<{ key: Tab; label: string; count: number }> = [
    { key: "unspoken", label: "Unspoken", count: unspokenCount },
    { key: "transcript", label: "Transcript", count: chunkCount },
    { key: "visuals", label: "Visuals", count: frameCount },
  ];
  return (
    <div className="flex border-b hairline">
      {TABS.map((t) => {
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={cn(
              "flex-1 border-b-2 px-3 py-2 font-mono text-[11px] uppercase tracking-capwide transition-colors",
              isActive
                ? "border-ember-500 text-bone-50"
                : "border-transparent text-bone-400 hover:text-bone-200"
            )}
          >
            {t.label}{" "}
            <span
              className={cn(
                "ml-1",
                isActive ? "text-ember-500" : "text-bone-500"
              )}
            >
              {t.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function EmptyTab({ message }: { message: string }) {
  return (
    <div className="border hairline p-6 text-center font-mono text-[12px] italic text-bone-500">
      {message}
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

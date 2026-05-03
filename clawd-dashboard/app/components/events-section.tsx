"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { AgentEvent } from "@/lib/types";
import { cn, shortId, timeAgo } from "@/lib/utils";
import { SectionHeader } from "@/app/components/ui/section-header";
import { RealtimeIndicator } from "@/app/components/ui/realtime-indicator";

const RECENT_LIMIT = 30;

export function EventsSection() {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [conn, setConn] = useState<"connecting" | "live" | "stale">(
    "connecting"
  );
  const arrivingRef = useRef<Set<string>>(new Set());
  const [, setArrivingTick] = useState(0);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let channel: RealtimeChannel | null = null;
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from("agent_events")
        .select("*")
        .order("ts", { ascending: false })
        .limit(RECENT_LIMIT);

      if (cancelled) return;
      if (error) {
        console.error("events load error:", error);
        setEvents([]);
      } else {
        setEvents((data ?? []) as AgentEvent[]);
      }
      setLoaded(true);
    }

    function markArriving(id: string) {
      arrivingRef.current.add(id);
      setArrivingTick((t) => t + 1);
      window.setTimeout(() => {
        arrivingRef.current.delete(id);
        setArrivingTick((t) => t + 1);
      }, 1400);
    }

    load();

    channel = supabase
      .channel("realtime:agent_events")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "agent_events" },
        (payload) => {
          const next = payload.new as AgentEvent;
          if (!next) return;
          markArriving(next.id);
          setEvents((prev) => [next, ...prev].slice(0, RECENT_LIMIT));
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setConn("live");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT")
          setConn("stale");
        else setConn("connecting");
      });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return (
    <section className="space-y-4">
      <SectionHeader
        eyebrow="section 03"
        title="Recent events"
        meta={
          <span className="flex items-center gap-4">
            <span>last {RECENT_LIMIT}</span>
            <RealtimeIndicator state={conn} />
          </span>
        }
      />
      <ol className="divide-y divide-ink-700/60">
        {!loaded && (
          <li className="py-6 font-mono text-xs text-bone-300">Loading…</li>
        )}
        {loaded && events.length === 0 && (
          <li className="py-6 font-mono text-xs text-bone-300">
            No events yet.
          </li>
        )}
        {events.map((e) => (
          <EventRow
            key={e.id}
            event={e}
            arriving={arrivingRef.current.has(e.id)}
          />
        ))}
      </ol>
    </section>
  );
}

function levelTone(level: string | null): string {
  switch (level) {
    case "error":
      return "text-status-blocked";
    case "warn":
      return "text-status-progress";
    case "info":
      return "text-bone-100";
    case "debug":
      return "text-bone-300";
    default:
      return "text-bone-100";
  }
}

function EventRow({
  event,
  arriving,
}: {
  event: AgentEvent;
  arriving: boolean;
}) {
  const summary = summarizeEvent(event);
  return (
    <li
      className={cn(
        "grid grid-cols-[80px_80px_1fr_auto] items-baseline gap-4 py-2.5",
        "font-mono text-[12px]",
        arriving && "animate-row-arrive"
      )}
    >
      <span className="text-bone-300">{timeAgo(event.ts)}</span>
      <span className="truncate uppercase tracking-capwide text-[10px] text-bone-300">
        {event.agent_id ?? "—"}
      </span>
      <span className={cn("min-w-0 truncate", levelTone(event.level))}>
        <span className="text-bone-300">{event.kind}</span>
        {summary && (
          <span className="ml-2 text-bone-100">{summary}</span>
        )}
      </span>
      <span className="text-right text-[10px] text-bone-400">
        {event.duration_ms != null && (
          <span>{event.duration_ms}ms</span>
        )}
        {event.cost_cents != null && event.cost_cents > 0 && (
          <span className="ml-2">¢{event.cost_cents}</span>
        )}
        {event.duration_ms == null && event.cost_cents == null && (
          <span>#{shortId(event.id)}</span>
        )}
      </span>
    </li>
  );
}

// Best-effort one-line summary from a payload jsonb. Picks a few common fields
// and falls back to the kind itself.
function summarizeEvent(e: AgentEvent): string {
  const p = e.payload;
  if (!p || typeof p !== "object") return "";

  const candidates = ["title", "message", "summary", "name", "text"];
  for (const k of candidates) {
    const v = (p as Record<string, unknown>)[k];
    if (typeof v === "string" && v.length > 0) {
      return v.length > 80 ? v.slice(0, 79) + "…" : v;
    }
  }
  return "";
}

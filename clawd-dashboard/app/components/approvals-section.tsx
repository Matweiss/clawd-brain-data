"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { Approval } from "@/lib/types";
import { cn, shortId, timeAgo, truncate } from "@/lib/utils";
import { SectionHeader } from "@/app/components/ui/section-header";
import { RealtimeIndicator } from "@/app/components/ui/realtime-indicator";
import {
  StatusPill,
  variantForApprovalState,
} from "@/app/components/ui/status-pill";

export function ApprovalsSection() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [conn, setConn] = useState<"connecting" | "live" | "stale">(
    "connecting"
  );
  const arrivingRef = useRef<Set<string>>(new Set());
  const [arrivingTick, setArrivingTick] = useState(0);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let channel: RealtimeChannel | null = null;
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from("approvals")
        .select("*")
        .eq("state", "pending")
        .order("created_at", { ascending: false })
        .limit(50);

      if (cancelled) return;
      if (error) {
        console.error("approvals load error:", error);
        setApprovals([]);
      } else {
        setApprovals((data ?? []) as Approval[]);
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

    function applyChange(payload: {
      eventType: "INSERT" | "UPDATE" | "DELETE";
      new: Approval | null;
      old: Approval | null;
    }) {
      setApprovals((prev) => {
        if (payload.eventType === "DELETE") {
          return payload.old
            ? prev.filter((a) => a.id !== payload.old!.id)
            : prev;
        }
        const next = payload.new;
        if (!next) return prev;
        const exists = prev.some((a) => a.id === next.id);
        const isPending = next.state === "pending";

        if (!exists && isPending) {
          markArriving(next.id);
          return [next, ...prev];
        }
        if (exists && !isPending) {
          return prev.filter((a) => a.id !== next.id);
        }
        if (exists && isPending) {
          return prev.map((a) => (a.id === next.id ? next : a));
        }
        return prev;
      });
    }

    load();

    channel = supabase
      .channel("realtime:approvals")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "approvals" },
        (payload) =>
          applyChange({
            eventType: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
            new: (payload.new as Approval) ?? null,
            old: (payload.old as Approval) ?? null,
          })
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
        eyebrow="section 02"
        title="Pending approvals"
        meta={
          <span className="flex items-center gap-4">
            <span>{loaded ? `${approvals.length} pending` : "—"}</span>
            <RealtimeIndicator state={conn} />
          </span>
        }
      />
      <ul
        className="divide-y divide-ink-700"
        data-tick={arrivingTick}
      >
        {!loaded && (
          <li className="py-6 font-mono text-xs text-bone-300">Loading…</li>
        )}
        {loaded && approvals.length === 0 && (
          <li className="py-6 font-mono text-xs text-bone-300">
            No approvals waiting on you.
          </li>
        )}
        {approvals.map((a) => (
          <ApprovalRow
            key={a.id}
            approval={a}
            arriving={arrivingRef.current.has(a.id)}
          />
        ))}
      </ul>
    </section>
  );
}

function ApprovalRow({
  approval,
  arriving,
}: {
  approval: Approval;
  arriving: boolean;
}) {
  return (
    <li
      className={cn(
        "grid grid-cols-[1fr_auto] items-start gap-4 py-3.5",
        arriving && "animate-row-arrive"
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <h3 className="truncate text-[15px] text-bone-50">
            {approval.summary || "Approval request"}
          </h3>
          <StatusPill
            label={approval.state}
            variant={variantForApprovalState(approval.state)}
            dot={approval.state === "pending"}
          />
        </div>
        {approval.detail && (
          <p className="mt-1 text-[13px] leading-snug text-bone-300">
            {truncate(approval.detail, 220)}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-capwide text-bone-300">
          {approval.source_agent && <span>from · {approval.source_agent}</span>}
          {approval.issue_ref && <span>ref · {approval.issue_ref}</span>}
          {approval.tg_chat_id && <span>tg · {approval.tg_chat_id}</span>}
          <span className="text-bone-400">#{shortId(approval.id)}</span>
        </div>
      </div>
      <div className="text-right font-mono text-[11px] text-bone-300">
        <div>{timeAgo(approval.created_at)}</div>
        {approval.snooze_until && (
          <div className="mt-0.5 text-bone-400">
            snoozed → {timeAgo(approval.snooze_until)}
          </div>
        )}
      </div>
    </li>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { Task, TaskStatus } from "@/lib/types";
import { cn, shortId, timeAgo, truncate } from "@/lib/utils";
import { SectionHeader } from "@/app/components/ui/section-header";
import { RealtimeIndicator } from "@/app/components/ui/realtime-indicator";
import {
  StatusPill,
  variantForTaskStatus,
} from "@/app/components/ui/status-pill";

const ACTIVE_STATUSES: TaskStatus[] = ["open", "in_progress", "blocked"];

function isActive(status: string | null | undefined): boolean {
  return !!status && (ACTIVE_STATUSES as string[]).includes(status);
}

export function TasksSection() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [conn, setConn] = useState<"connecting" | "live" | "stale">(
    "connecting"
  );
  // Track row IDs that should animate in
  const arrivingRef = useRef<Set<string>>(new Set());
  const [arrivingTick, setArrivingTick] = useState(0);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let channel: RealtimeChannel | null = null;
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .in("status", ACTIVE_STATUSES)
        .order("priority", { ascending: true, nullsFirst: false })
        .order("updated_at", { ascending: false })
        .limit(50);

      if (cancelled) return;
      if (error) {
        // Surface to console — Cloudflare Access already gates the page,
        // so we don't need a heavy error UI for Phase 0
        console.error("tasks load error:", error);
        setTasks([]);
      } else {
        setTasks((data ?? []) as Task[]);
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
      new: Task | null;
      old: Task | null;
    }) {
      setTasks((prev) => {
        if (payload.eventType === "DELETE") {
          return payload.old ? prev.filter((t) => t.id !== payload.old!.id) : prev;
        }
        const next = payload.new;
        if (!next) return prev;

        const exists = prev.some((t) => t.id === next.id);
        const active = isActive(next.status);

        if (!exists && active) {
          markArriving(next.id);
          return [next, ...prev];
        }
        if (exists && !active) {
          return prev.filter((t) => t.id !== next.id);
        }
        if (exists && active) {
          return prev.map((t) => (t.id === next.id ? next : t));
        }
        return prev;
      });
    }

    load();

    channel = supabase
      .channel("realtime:tasks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) =>
          applyChange({
            eventType: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
            new: (payload.new as Task) ?? null,
            old: (payload.old as Task) ?? null,
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
        eyebrow="section 01"
        title="Open tasks"
        meta={
          <span className="flex items-center gap-4">
            <span>{loaded ? `${tasks.length} active` : "—"}</span>
            <RealtimeIndicator state={conn} />
          </span>
        }
      />
      <ul
        className="divide-y divide-ink-700"
        // arrivingTick forces re-render when set changes
        data-tick={arrivingTick}
      >
        {!loaded && (
          <li className="py-6 font-mono text-xs text-bone-300">Loading…</li>
        )}
        {loaded && tasks.length === 0 && (
          <li className="py-6 font-mono text-xs text-bone-300">
            Nothing active. The system is at rest.
          </li>
        )}
        {tasks.map((t) => (
          <TaskRow
            key={t.id}
            task={t}
            arriving={arrivingRef.current.has(t.id)}
          />
        ))}
      </ul>
    </section>
  );
}

function TaskRow({ task, arriving }: { task: Task; arriving: boolean }) {
  return (
    <li
      className={cn(
        "group grid grid-cols-[auto_1fr_auto] items-start gap-4 py-3.5",
        arriving && "animate-row-arrive"
      )}
    >
      <PriorityMark priority={task.priority} />
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <h3 className="truncate text-[15px] text-bone-50">{task.title}</h3>
          <StatusPill
            label={task.status.replace("_", " ")}
            variant={variantForTaskStatus(task.status)}
            dot={task.status === "in_progress"}
          />
        </div>
        {task.description && (
          <p className="mt-1 text-[13px] leading-snug text-bone-300">
            {truncate(task.description, 180)}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-capwide text-bone-300">
          {task.owner && <span>owner · {task.owner}</span>}
          {task.source_agent && <span>src · {task.source_agent}</span>}
          <span className="text-bone-400">#{shortId(task.id)}</span>
        </div>
      </div>
      <div className="text-right font-mono text-[11px] text-bone-300">
        <div>{timeAgo(task.updated_at)}</div>
        {task.due_at && (
          <div className="mt-0.5 text-bone-400">due {timeAgo(task.due_at)}</div>
        )}
      </div>
    </li>
  );
}

// Tiny vertical mark indicating priority (1 = boldest, 5 = subtlest)
function PriorityMark({ priority }: { priority: number | null }) {
  const p = priority ?? 3;
  const intensity =
    p <= 1
      ? "bg-ember-500"
      : p === 2
        ? "bg-ember-500/70"
        : p === 3
          ? "bg-bone-300/50"
          : "bg-bone-400/40";
  return (
    <span
      aria-label={`priority ${p}`}
      className={cn("mt-2 block h-4 w-[2px]", intensity)}
    />
  );
}

"use client";

import { cn } from "@/lib/utils";

type ConnectionState = "connecting" | "live" | "stale";

interface RealtimeIndicatorProps {
  state: ConnectionState;
  className?: string;
}

const STATE_LABEL: Record<ConnectionState, string> = {
  connecting: "connecting",
  live: "live",
  stale: "stale",
};

const STATE_COLOR: Record<ConnectionState, string> = {
  connecting: "bg-bone-300",
  live: "bg-ember-500",
  stale: "bg-status-blocked",
};

export function RealtimeIndicator({
  state,
  className,
}: RealtimeIndicatorProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-capwide text-bone-300",
        className
      )}
    >
      <span className="relative inline-flex h-1.5 w-1.5">
        {state === "live" && (
          <span className="absolute inset-0 inline-flex animate-pulse-soft rounded-full bg-ember-500/60" />
        )}
        <span
          className={cn(
            "relative inline-flex h-1.5 w-1.5 rounded-full",
            STATE_COLOR[state]
          )}
        />
      </span>
      {STATE_LABEL[state]}
    </span>
  );
}

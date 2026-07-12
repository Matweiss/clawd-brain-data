import { cn } from "@/lib/utils";

type StatusVariant = "open" | "progress" | "blocked" | "done" | "neutral";

const VARIANT_STYLES: Record<StatusVariant, string> = {
  open: "border-status-open/40 text-status-open",
  progress: "border-status-progress/50 text-status-progress",
  blocked: "border-status-blocked/50 text-status-blocked",
  done: "border-bone-400/30 text-bone-300",
  neutral: "border-ink-500 text-bone-300",
};

interface StatusPillProps {
  label: string;
  variant?: StatusVariant;
  // Optional small dot prefix — useful for "live" indicators
  dot?: boolean;
  className?: string;
}

export function StatusPill({
  label,
  variant = "neutral",
  dot = false,
  className,
}: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-[3px]",
        "font-mono text-[10px] uppercase tracking-capwide",
        VARIANT_STYLES[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full bg-current",
            variant === "progress" && "animate-pulse-soft"
          )}
        />
      )}
      {label}
    </span>
  );
}

// Map from a task status string to a pill variant
export function variantForTaskStatus(status: string): StatusVariant {
  switch (status) {
    case "open":
      return "open";
    case "in_progress":
      return "progress";
    case "blocked":
      return "blocked";
    case "done":
    case "cancelled":
      return "done";
    default:
      return "neutral";
  }
}

// Map from approval state to a pill variant
export function variantForApprovalState(state: string): StatusVariant {
  switch (state) {
    case "pending":
      return "progress";
    case "approved":
      return "open";
    case "declined":
    case "expired":
      return "blocked";
    case "snoozed":
      return "neutral";
    case "cancelled":
      return "done";
    default:
      return "neutral";
  }
}

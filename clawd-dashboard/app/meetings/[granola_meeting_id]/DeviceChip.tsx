import { cn } from "@/lib/utils";

export function DeviceChip({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border border-ink-600 bg-ink-800/40 px-1.5 py-[2px]",
        "font-mono text-[10px] uppercase tracking-capwide text-bone-300",
        className
      )}
    >
      {label}
    </span>
  );
}

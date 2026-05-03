import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  // Editorial title in serif
  title: string;
  // Small uppercase mono label above the title (e.g., "section 01")
  eyebrow?: string;
  // Right-aligned meta — count, status, etc.
  meta?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  eyebrow,
  meta,
  className,
}: SectionHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-end justify-between gap-4 border-b hairline pb-3",
        className
      )}
    >
      <div>
        {eyebrow && (
          <div className="mb-2 font-mono text-[10px] uppercase tracking-capwide text-bone-300">
            {eyebrow}
          </div>
        )}
        <h2 className="font-display text-3xl tracking-tightest text-bone-50">
          {title}
        </h2>
      </div>
      {meta && (
        <div className="font-mono text-[11px] uppercase tracking-capwide text-bone-300">
          {meta}
        </div>
      )}
    </header>
  );
}

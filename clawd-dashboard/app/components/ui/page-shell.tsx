import { Nav } from "@/app/components/ui/nav";

interface PageShellProps {
  eyebrow: string;
  title: string;
  // Tagline line under the H1
  tagline?: React.ReactNode;
  // Right-aligned meta (e.g., live indicator, counts)
  rightMeta?: React.ReactNode;
  children: React.ReactNode;
}

export function PageShell({
  eyebrow,
  title,
  tagline,
  rightMeta,
  children,
}: PageShellProps) {
  return (
    <main className="mx-auto min-h-screen max-w-[1400px] px-6 py-10 md:px-10 md:py-14">
      <header className="space-y-8 border-b hairline pb-8">
        <div className="flex items-center justify-between gap-4">
          <Nav />
          {rightMeta}
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-capwide text-bone-300">
            {eyebrow}
          </div>
          <h1 className="mt-3 font-display text-5xl leading-[0.95] tracking-tightest text-bone-50 md:text-6xl">
            {title}
          </h1>
          {tagline && (
            <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-bone-200">
              {tagline}
            </p>
          )}
        </div>
      </header>

      <div className="mt-10">{children}</div>

      <footer className="mt-20 flex items-center justify-between border-t hairline pt-6 font-mono text-[10px] uppercase tracking-capwide text-bone-400">
        <span>clawd-dashboard · phase 1</span>
        <span>read-only · realtime via supabase</span>
      </footer>
    </main>
  );
}

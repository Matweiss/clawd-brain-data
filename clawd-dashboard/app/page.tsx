import { TasksSection } from "@/app/components/tasks-section";
import { ApprovalsSection } from "@/app/components/approvals-section";
import { EventsSection } from "@/app/components/events-section";
import { Nav } from "@/app/components/ui/nav";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <main className="mx-auto min-h-screen max-w-[1400px] px-6 py-10 md:px-10 md:py-14">
      <div className="mb-8 flex items-center justify-between">
        <Nav />
      </div>
      <Masthead />

      {/* Asymmetric two-column layout on desktop:
          left column (wider) = tasks + events stream
          right column (narrower) = approvals + system meta
          stacks on mobile */}
      <div className="mt-12 grid grid-cols-1 gap-x-12 gap-y-14 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-14">
          <TasksSection />
          <EventsSection />
        </div>
        <div className="space-y-14">
          <ApprovalsSection />
          <SystemMeta />
        </div>
      </div>

      <Footer />
    </main>
  );
}

function Masthead() {
  return (
    <header className="flex flex-col gap-6 border-b hairline pb-8 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-capwide text-bone-300">
          clawd-state · phase 0
        </div>
        <h1 className="mt-3 font-display text-6xl leading-[0.95] tracking-tightest text-bone-50 md:text-7xl">
          Mission Control<span className="text-ember-500">.</span>
        </h1>
        <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-bone-200">
          A single rendezvous for the agents that work on your behalf —{" "}
          <em className="font-display italic text-bone-100">read-only</em>,
          observed live, tuned for speed of glance.
        </p>
      </div>
      <Clock />
    </header>
  );
}

function Clock() {
  // Server-rendered timestamp. Client doesn't update it — the relative
  // ago-strings on rows do the live work, and a flickering hero clock would
  // be noise. This is a "moment of arrival" timestamp.
  const now = new Date();
  const date = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <div className="text-right font-mono text-[11px] uppercase tracking-capwide text-bone-300">
      <div>{date}</div>
      <div className="mt-1 text-bone-100">{time} loaded</div>
    </div>
  );
}

function SystemMeta() {
  // Static for Phase 0 — these are facts about the system, not live data.
  // Phase 1 promotes this to a real "system health" panel.
  const items = [
    { k: "supabase", v: "tntoclpqyisfttpchajh" },
    { k: "edge", v: "cloudflare access" },
    { k: "agents", v: "clawd · claude_code" },
    { k: "phase", v: "1 — crm mirror" },
  ];
  return (
    <section>
      <h2 className="mb-3 border-b hairline pb-3 font-mono text-[10px] uppercase tracking-capwide text-bone-300">
        System
      </h2>
      <dl className="grid grid-cols-1 gap-y-2 font-mono text-[11px]">
        {items.map((i) => (
          <div
            key={i.k}
            className="flex items-baseline justify-between gap-4 border-b border-ink-800 py-2 last:border-b-0"
          >
            <dt className="uppercase tracking-capwide text-bone-300">{i.k}</dt>
            <dd className="truncate text-bone-100">{i.v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-20 flex items-center justify-between border-t hairline pt-6 font-mono text-[10px] uppercase tracking-capwide text-bone-400">
      <span>clawd-dashboard · phase 1</span>
      <span>read-only · realtime via supabase</span>
    </footer>
  );
}

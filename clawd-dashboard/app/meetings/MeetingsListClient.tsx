"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn, timeAgo } from "@/lib/utils";
import { MeetingStatusPill } from "@/app/components/meetings/MeetingStatusPill";
import type {
  MeetingReviewStatus,
  MeetingReviewFailureCode,
} from "@shared/db";

type MeetingListItem = {
  granola_meeting_id: string;
  title: string;
  started_at: string;
  ended_at: string | null;
  attendee_count: number;
  frame_count: number;
  unspoken_count: number;
  status: MeetingReviewStatus | null;
  failure_code: MeetingReviewFailureCode | null;
};

const POLL_INTERVAL_MS = 30_000;

// Mock rows so all five status states are represented for visual review.
// Real Granola data covers `complete` and `null` naturally; the other
// three need synthetic rows. Removed when sample data and Phase 3 fully
// covers each state during real-meeting smoke tests.
const DEMO_ROWS: MeetingListItem[] = [
  {
    granola_meeting_id: "demo-pending-transcript",
    title: "[demo] Acme weekly — waiting on Granola transcript",
    started_at: "2026-05-03T16:00:00-07:00",
    ended_at: "2026-05-03T16:30:00-07:00",
    attendee_count: 3,
    frame_count: 0,
    unspoken_count: 0,
    status: "pending_transcript",
    failure_code: null,
  },
  {
    granola_meeting_id: "demo-analyzing-now",
    title: "[demo] Buyer call — analyzer running now",
    started_at: "2026-05-03T15:00:00-07:00",
    ended_at: "2026-05-03T15:45:00-07:00",
    attendee_count: 4,
    frame_count: 12,
    unspoken_count: 0,
    status: "analyzing",
    failure_code: null,
  },
  {
    granola_meeting_id: "demo-failed-timeout",
    title: "[demo] Roadmap review — analyzer failed",
    started_at: "2026-05-02T11:00:00-07:00",
    ended_at: "2026-05-02T11:50:00-07:00",
    attendee_count: 2,
    frame_count: 0,
    unspoken_count: 0,
    status: "failed",
    failure_code: "granola_timeout",
  },
];

export function MeetingsListClient() {
  const [meetings, setMeetings] = useState<MeetingListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/meetings/list?limit=50");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { meetings: MeetingListItem[] };
        if (!cancelled) {
          setMeetings(data.meetings);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    }

    load();
    const id = window.setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  if (error && !meetings) {
    return (
      <div className="border border-status-blocked/40 bg-status-blocked/5 p-4 font-mono text-xs text-status-blocked">
        Load error: {error}
      </div>
    );
  }
  if (!meetings) {
    return (
      <div className="py-10 font-mono text-xs text-bone-300">Loading…</div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="border hairline p-8 text-center">
        <div className="font-mono text-[10px] uppercase tracking-capwide text-bone-300">
          empty
        </div>
        <p className="mt-3 text-[14px] text-bone-200">
          No meetings in Granola yet. Start a Google Meet in Comet — captures
          and analysis run automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <MeetingTable
        rows={meetings}
        title="Recent meetings"
        subtitle="From Granola, enriched with capture review status"
      />
      <MeetingTable
        rows={DEMO_ROWS}
        title="Demo states"
        subtitle="Mock rows for visual QA — covers the three states real Granola data does not currently exercise"
        accent
      />
    </div>
  );
}

function MeetingTable({
  rows,
  title,
  subtitle,
  accent,
}: {
  rows: MeetingListItem[];
  title: string;
  subtitle: string;
  accent?: boolean;
}) {
  return (
    <section>
      <header className="mb-3 flex items-baseline justify-between border-b hairline pb-3">
        <div>
          <h2 className="font-mono text-[10px] uppercase tracking-capwide text-bone-300">
            {title}
          </h2>
          <p className="mt-1 text-[12px] text-bone-400">{subtitle}</p>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-capwide text-bone-500">
          {rows.length} {rows.length === 1 ? "meeting" : "meetings"}
        </div>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b hairline">
              <Th>Title</Th>
              <Th align="right" width="w-20">
                Atndees
              </Th>
              <Th align="right" width="w-20">
                Frames
              </Th>
              <Th align="right" width="w-24">
                Unspoken
              </Th>
              <Th width="w-56">Status</Th>
              <Th align="right" width="w-24">
                When
              </Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-700/60">
            {rows.map((m) => (
              <MeetingRow key={m.granola_meeting_id} m={m} accent={accent} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MeetingRow({
  m,
  accent,
}: {
  m: MeetingListItem;
  accent?: boolean;
}) {
  const isDemo = m.granola_meeting_id.startsWith("demo-");
  const navigable =
    !isDemo &&
    (m.status === "complete" || m.status === "failed" || m.status === null);
  const href = `/meetings/${m.granola_meeting_id}`;

  return (
    <tr
      className={cn(
        "text-[13px] text-bone-100 transition-colors",
        navigable && "hover:bg-ink-800/40",
        !navigable && "opacity-70",
        accent && "border-l-2 border-l-ember-500/30"
      )}
    >
      <td className="py-3 pr-4">
        {navigable ? (
          <Link href={href} className="block hover:text-bone-50">
            <div className="text-bone-50">{m.title}</div>
            <IdLine id={m.granola_meeting_id} />
          </Link>
        ) : (
          <div>
            <div className="text-bone-200">{m.title}</div>
            <IdLine id={m.granola_meeting_id} />
          </div>
        )}
      </td>
      <td className="py-3 px-2 text-right text-bone-300">
        {m.attendee_count}
      </td>
      <td className="py-3 px-2 text-right text-bone-300">
        {m.frame_count > 0 ? (
          m.frame_count
        ) : (
          <span className="text-bone-500">—</span>
        )}
      </td>
      <td className="py-3 px-2 text-right">
        {m.unspoken_count > 0 ? (
          <span className="font-mono text-ember-500">{m.unspoken_count}</span>
        ) : (
          <span className="text-bone-500">—</span>
        )}
      </td>
      <td className="py-3 px-2">
        <MeetingStatusPill status={m.status} failure_code={m.failure_code} />
      </td>
      <td className="py-3 pl-2 text-right font-mono text-[11px] text-bone-300">
        {timeAgo(m.started_at)}
      </td>
    </tr>
  );
}

function IdLine({ id }: { id: string }) {
  return (
    <div className="mt-1 font-mono text-[10px] text-bone-500">
      {id.length > 12 ? `${id.slice(0, 8)}…` : id}
    </div>
  );
}

function Th({
  children,
  align,
  width,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  width?: string;
}) {
  return (
    <th
      className={cn(
        "py-3 font-mono text-[10px] font-medium uppercase tracking-capwide text-bone-300",
        align === "right" ? "text-right" : "text-left",
        width
      )}
    >
      {children}
    </th>
  );
}

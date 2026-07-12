// cn — minimal classname combiner; avoids pulling clsx as a dep for one helper
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

// timeAgo — compact relative-time formatter ("4m", "3h", "2d", "Apr 12")
// Designed for the dense, mono-typed timestamps in the dashboard.
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const now = Date.now();
  const diff = Math.max(0, now - then);

  const sec = Math.floor(diff / 1000);
  if (sec < 5) return "now";
  if (sec < 60) return `${sec}s`;

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;

  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;

  // Older than a week — show short calendar date
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// truncate — for inline previews of long text fields
export function truncate(s: string | null | undefined, max = 140): string {
  if (!s) return "";
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

// shortId — first 8 chars of a uuid; presented in mono with a leading hash
export function shortId(id: string | null | undefined): string {
  if (!id) return "";
  return id.replace(/-/g, "").slice(0, 8);
}

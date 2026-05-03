import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileP = promisify(execFile);

const WORKSPACE_ROOT =
  process.env.CLAWD_WORKSPACE_ROOT ?? "/root/.openclaw/workspace";
const GRANOLA_QUERY = `${WORKSPACE_ROOT}/skills/granola-bridge/scripts/granola-query.py`;

export type GranolaParticipant = { name: string; email?: string };

export type GranolaMeeting = {
  id: string;
  title: string;
  started_at: string;
  ended_at: string | null;
  participants: GranolaParticipant[];
  has_notes: boolean;
  has_transcript: boolean;
};

export type GranolaRecentResponse = {
  meetings: GranolaMeeting[];
  total: number;
  returned: number;
};

const CLI_TIMEOUT_MS = 10_000;
const CLI_MAX_BUFFER = 10 * 1024 * 1024;

export async function granolaRecent(
  opts: { limit?: number } = {}
): Promise<GranolaRecentResponse> {
  const { stdout } = await execFileP(
    "python3",
    [GRANOLA_QUERY, "recent", "--limit", String(opts.limit ?? 50)],
    { timeout: CLI_TIMEOUT_MS, maxBuffer: CLI_MAX_BUFFER }
  );
  return JSON.parse(stdout) as GranolaRecentResponse;
}

export async function granolaGet(id: string): Promise<GranolaMeeting | null> {
  try {
    const { stdout } = await execFileP(
      "python3",
      [GRANOLA_QUERY, "get", id],
      { timeout: CLI_TIMEOUT_MS, maxBuffer: CLI_MAX_BUFFER }
    );
    return JSON.parse(stdout) as GranolaMeeting;
  } catch {
    return null;
  }
}

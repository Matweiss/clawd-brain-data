// Types derived from the schema in migrations 0001_clawd_state_core.sql + 0002_dashboard_core.sql.
// We use permissive shapes for fields whose exact form may vary across migration revisions
// (e.g., approvals state machine names) — render code should fall back gracefully.

export type TaskStatus =
  | "open"
  | "in_progress"
  | "blocked"
  | "done"
  | "cancelled";

export type TaskOwner =
  | "mat"
  | "clawd"
  | "claude_code"
  | "sage"
  | "arty"
  | "luke"
  | null;

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: number | null;
  owner: TaskOwner;
  source_agent: string | null;
  linked_objects: Record<string, unknown> | null;
  due_at: string | null;
  created_at: string;
  updated_at: string;
}

// Approvals state machine per migration 0001_clawd_state_core.sql:
// pending → approved/snoozed/declined/cancelled/expired
export type ApprovalState =
  | "pending"
  | "approved"
  | "snoozed"
  | "declined"
  | "cancelled"
  | "expired";

// Columns: matches public.approvals exactly.
export interface Approval {
  id: string;
  source_agent: string;
  issue_ref: string | null;
  summary: string;
  detail: string | null;
  options: string[];
  state: ApprovalState;
  decided_at: string | null;
  decided_by: string | null;
  decided_action: string | null;
  decided_comment: string | null;
  snooze_until: string | null;
  tg_message_id: number | null;
  tg_chat_id: number | null;
  created_at: string;
  updated_at: string;
}

export type EventLevel = "debug" | "info" | "warn" | "error" | string;

export interface AgentEvent {
  id: string;
  ts: string;
  agent_id: string | null;
  kind: string;
  payload: Record<string, unknown> | null;
  level: EventLevel | null;
  session_id: string | null;
  duration_ms: number | null;
  cost_cents: number | null;
}

// CRM mirror — Phase 1. Populated by `npm run sync:hubspot`.
// `properties` is a permissive map: every locked-scope property is
// stored as the raw HubSpot string value, plus enriched `_label` /
// `_name` derivations added at sync time.
export interface CrmObject {
  id: string;
  hs_object_type: "contact" | "deal" | string;
  hs_object_id: number;
  properties: Record<string, string | null>;
  last_synced_at: string;
  hs_updated_at: string | null;
  synced_by: string | null;
}

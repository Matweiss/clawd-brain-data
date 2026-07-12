// Hand-written Supabase types for the public schema.
//
// Source of truth: migrations/0001-0005. Regenerate via Supabase CLI when
// available: `supabase gen types typescript --project-id tntoclpqyisfttpchajh > shared/db.ts`.
//
// Phase 1 of TMW-618 (Meeting Insights Hub) added capture_devices,
// meeting_visuals, meeting_transcript_chunks, meeting_reviews. This file
// covers those plus the existing Phase 0/1 tables (agent_memories,
// approvals, agent_events, tasks, crm_objects, hs_pending_writes,
// task_object_links) so dashboard route handlers have a single import.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type MeetingReviewStatus =
  | 'pending_transcript'
  | 'analyzing'
  | 'complete'
  | 'failed'

export type MeetingReviewFailureCode =
  | 'granola_timeout'
  | 'ocr_failed'
  | 'embedding_failed'
  | 'notion_failed'
  | 'unknown'

export type MeetingAttendee = {
  name: string
  email?: string
  granola_user_id?: string
}

export type UnspokenVisual = {
  frame_id: string
  frame_ts: string
  reason: string
  slide_text?: string | null
  ai_caption?: string | null
  max_chunk_cosine?: number | null
  deictic_fallback_used?: boolean
}

export interface Database {
  public: {
    Tables: {
      capture_devices: {
        Row: {
          device_id: string
          device_label: string
          last_seen: string
          last_capture_ts: string | null
          registered_at: string
          updated_at: string
        }
        Insert: {
          device_id: string
          device_label: string
          last_seen?: string
          last_capture_ts?: string | null
          registered_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['capture_devices']['Insert']>
      }

      meeting_visuals: {
        Row: {
          id: string
          granola_meeting_id: string | null
          frame_ts: string
          image_url: string
          image_hash: string
          phash: string | null
          app_name: string
          window_title: string | null
          device_id: string
          device_label: string
          slide_text: string | null
          // pgvector vector(3072) is exposed as a string by PostgREST.
          slide_text_embedding: string | null
          embedding_model: string | null
          ai_caption: string | null
          ocr_lang: string
          captured_at_local_offset: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          granola_meeting_id?: string | null
          frame_ts?: string
          image_url: string
          image_hash: string
          phash?: string | null
          app_name: string
          window_title?: string | null
          device_id: string
          device_label: string
          slide_text?: string | null
          slide_text_embedding?: string | null
          embedding_model?: string | null
          ai_caption?: string | null
          ocr_lang?: string
          captured_at_local_offset?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['meeting_visuals']['Insert']>
      }

      meeting_transcript_chunks: {
        Row: {
          id: string
          granola_meeting_id: string
          chunk_index: number
          chunk_start_ts: string
          chunk_end_ts: string
          chunk_text: string
          chunk_embedding: string | null
          embedding_model: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          granola_meeting_id: string
          chunk_index: number
          chunk_start_ts: string
          chunk_end_ts: string
          chunk_text: string
          chunk_embedding?: string | null
          embedding_model?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['meeting_transcript_chunks']['Insert']>
      }

      meeting_reviews: {
        Row: {
          id: string
          granola_meeting_id: string
          status: MeetingReviewStatus
          failure_code: MeetingReviewFailureCode | null
          failure_reason: string | null
          generated_at: string
          summary_md: string
          attendees: MeetingAttendee[]
          unspoken_visuals: UnspokenVisual[]
          frame_count: number
          notion_page_id: string | null
          meeting_started_at: string | null
          meeting_ended_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          granola_meeting_id: string
          status?: MeetingReviewStatus
          failure_code?: MeetingReviewFailureCode | null
          failure_reason?: string | null
          generated_at?: string
          summary_md?: string
          attendees?: MeetingAttendee[]
          unspoken_visuals?: UnspokenVisual[]
          frame_count?: number
          notion_page_id?: string | null
          meeting_started_at?: string | null
          meeting_ended_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['meeting_reviews']['Insert']>
      }

      // ----- Pre-existing tables (0001-0003) -----

      agent_memories: {
        Row: {
          id: string
          agent_id: string
          scope: 'user' | 'feedback' | 'project' | 'reference' | 'tacit' | 'session'
          title: string
          body: string
          tags: string[]
          importance: number
          source_session: string | null
          dedup_key: string | null
          created_at: string
          updated_at: string
          expires_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['agent_memories']['Row'], 'id' | 'created_at' | 'updated_at' | 'tags' | 'importance'> & {
          id?: string
          tags?: string[]
          importance?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['agent_memories']['Insert']>
      }

      agent_events: {
        Row: {
          id: string
          ts: string
          agent_id: string
          kind: string
          payload: Json
          level: 'debug' | 'info' | 'warn' | 'error'
          session_id: string | null
          duration_ms: number | null
          cost_cents: number | null
        }
        Insert: {
          id?: string
          ts?: string
          agent_id: string
          kind: string
          payload?: Json
          level?: 'debug' | 'info' | 'warn' | 'error'
          session_id?: string | null
          duration_ms?: number | null
          cost_cents?: number | null
        }
        Update: Partial<Database['public']['Tables']['agent_events']['Insert']>
      }

      approvals: {
        Row: {
          id: string
          source_agent: string
          issue_ref: string | null
          summary: string
          detail: string | null
          options: string[]
          state: 'pending' | 'approved' | 'snoozed' | 'declined' | 'cancelled' | 'expired'
          decided_at: string | null
          decided_by: string | null
          decided_action: string | null
          decided_comment: string | null
          snooze_until: string | null
          tg_message_id: number | null
          tg_chat_id: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          source_agent: string
          issue_ref?: string | null
          summary: string
          detail?: string | null
          options?: string[]
          state?: 'pending' | 'approved' | 'snoozed' | 'declined' | 'cancelled' | 'expired'
          decided_at?: string | null
          decided_by?: string | null
          decided_action?: string | null
          decided_comment?: string | null
          snooze_until?: string | null
          tg_message_id?: number | null
          tg_chat_id?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['approvals']['Insert']>
      }

      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          status: 'open' | 'in_progress' | 'blocked' | 'done' | 'cancelled'
          priority: number
          owner: 'mat' | 'clawd' | 'claude_code' | 'sage' | 'arty' | 'luke' | null
          source_agent: string | null
          linked_objects: Json
          due_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: 'open' | 'in_progress' | 'blocked' | 'done' | 'cancelled'
          priority?: number
          owner?: 'mat' | 'clawd' | 'claude_code' | 'sage' | 'arty' | 'luke' | null
          source_agent?: string | null
          linked_objects?: Json
          due_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>
      }

      crm_objects: {
        Row: {
          id: string
          hs_object_type: 'contact' | 'company' | 'deal' | 'ticket' | 'line_item' | 'quote'
          hs_object_id: number
          properties: Json
          last_synced_at: string
          hs_updated_at: string | null
          synced_by: string | null
        }
        Insert: {
          id?: string
          hs_object_type: 'contact' | 'company' | 'deal' | 'ticket' | 'line_item' | 'quote'
          hs_object_id: number
          properties?: Json
          last_synced_at?: string
          hs_updated_at?: string | null
          synced_by?: string | null
        }
        Update: Partial<Database['public']['Tables']['crm_objects']['Insert']>
      }

      hs_pending_writes: {
        Row: {
          id: string
          idempotency_key: string
          hs_object_type: 'contact' | 'company' | 'deal' | 'ticket' | 'line_item' | 'quote'
          hs_object_id: number | null
          operation: 'create' | 'update' | 'delete' | 'associate'
          payload: Json
          requested_by: string
          state: 'pending' | 'syncing' | 'done' | 'failed' | 'superseded'
          retry_count: number
          next_retry_at: string | null
          error: string | null
          resolution: 're_apply' | 'discarded' | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          idempotency_key?: string
          hs_object_type: 'contact' | 'company' | 'deal' | 'ticket' | 'line_item' | 'quote'
          hs_object_id?: number | null
          operation: 'create' | 'update' | 'delete' | 'associate'
          payload?: Json
          requested_by: string
          state?: 'pending' | 'syncing' | 'done' | 'failed' | 'superseded'
          retry_count?: number
          next_retry_at?: string | null
          error?: string | null
          resolution?: 're_apply' | 'discarded' | null
          created_at?: string
          completed_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['hs_pending_writes']['Insert']>
      }

      task_object_links: {
        Row: {
          task_id: string
          crm_object_id: string
          relation: string
          created_at: string
        }
        Insert: {
          task_id: string
          crm_object_id: string
          relation?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['task_object_links']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

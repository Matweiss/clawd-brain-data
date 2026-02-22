-- ============================================
-- Clawd Command Center v0.3 Schema Updates
-- Run these in Supabase SQL Editor
-- ============================================

-- ==================
-- TASKS TABLE
-- ==================

-- Add new columns for task management
ALTER TABLE tasks 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'todo',
  ADD COLUMN IF NOT EXISTS priority_order INTEGER,
  ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'mat',
  ADD COLUMN IF NOT EXISTS is_suggested BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS clawd_result JSONB,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add comment for status values
COMMENT ON COLUMN tasks.status IS 'Values: todo, urgent, assigned_to_clawd, clawd_working, awaiting_review, done';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority_order) WHERE status IN ('todo', 'urgent');

-- ==================
-- MEETINGS TABLE
-- ==================

-- Add columns for meeting prep
ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS prep_status TEXT DEFAULT 'not_requested',
  ADD COLUMN IF NOT EXISTS prep_content JSONB,
  ADD COLUMN IF NOT EXISTS recording_url TEXT,
  ADD COLUMN IF NOT EXISTS notes_url TEXT;

-- Add comment for prep_status values
COMMENT ON COLUMN meetings.prep_status IS 'Values: not_requested, generating, ready';

-- Create index for upcoming meetings
CREATE INDEX IF NOT EXISTS idx_meetings_start_time ON meetings(start_time) WHERE status = 'upcoming';

-- ==================
-- DEALS TABLE
-- ==================

-- Add contact information columns
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS contact_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS contact_id TEXT,
  ADD COLUMN IF NOT EXISTS company_id TEXT;

-- Create index for HubSpot IDs
CREATE INDEX IF NOT EXISTS idx_deals_contact_id ON deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_deals_company_id ON deals(company_id);

-- ==================
-- VERIFICATION
-- ==================

-- Verify columns were added (run this separately to check)
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('tasks', 'meetings', 'deals')
  AND column_name IN (
    'status', 'priority_order', 'created_by', 'is_suggested', 'clawd_result', 'completed_at',
    'prep_status', 'prep_content', 'recording_url', 'notes_url',
    'contact_name', 'contact_email', 'contact_phone', 'contact_id', 'company_id'
  )
ORDER BY table_name, column_name;

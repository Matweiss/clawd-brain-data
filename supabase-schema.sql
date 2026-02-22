-- Clawd Command Center Database Schema
-- Run this in Supabase SQL Editor

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT CHECK (type IN ('email', 'call', 'research', 'meeting_prep', 'other')),
  status TEXT CHECK (status IN ('todo', 'urgent', 'assigned_to_clawd', 'clawd_working', 'awaiting_review', 'done')) DEFAULT 'todo',
  priority_order INT DEFAULT 0,
  due_date DATE,
  related_deal_id TEXT,
  related_deal_name TEXT,
  related_contact_id TEXT,
  created_by TEXT CHECK (created_by IN ('mat', 'clawd', 'suggested')) DEFAULT 'mat',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  clawd_result JSONB,
  is_suggested BOOLEAN DEFAULT FALSE
);

-- Deals table (synced from HubSpot)
CREATE TABLE deals (
  id TEXT PRIMARY KEY, -- HubSpot deal ID
  name TEXT NOT NULL,
  amount DECIMAL(12,2),
  stage TEXT,
  close_date DATE,
  company_name TEXT,
  company_id TEXT,
  contact_name TEXT,
  contact_id TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  last_activity_date TIMESTAMPTZ,
  owner_id TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meetings table
CREATE TABLE meetings (
  id TEXT PRIMARY KEY, -- Calendar event ID
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  company TEXT,
  company_id TEXT,
  deal_id TEXT,
  contact_id TEXT,
  meet_link TEXT,
  status TEXT CHECK (status IN ('upcoming', 'in_progress', 'completed')) DEFAULT 'upcoming',
  prep_status TEXT CHECK (prep_status IN ('not_requested', 'generating', 'ready')) DEFAULT 'not_requested',
  prep_content JSONB,
  recording_url TEXT,
  notes_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log (for tracking Clawd actions)
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT, -- 'task', 'deal', 'meeting', etc.
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_last_activity ON deals(last_activity_date);
CREATE INDEX idx_meetings_start_time ON meetings(start_time);
CREATE INDEX idx_meetings_status ON meetings(status);

-- Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything (for Python agents)
CREATE POLICY "Service role can do everything on tasks" ON tasks FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can do everything on deals" ON deals FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can do everything on meetings" ON meetings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can do everything on activity_log" ON activity_log FOR ALL USING (auth.role() = 'service_role');

-- Allow anon (dashboard) to read everything
CREATE POLICY "Anon can read tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "Anon can read deals" ON deals FOR SELECT USING (true);
CREATE POLICY "Anon can read meetings" ON meetings FOR SELECT USING (true);
CREATE POLICY "Anon can read activity_log" ON activity_log FOR SELECT USING (true);

-- Allow anon to update task status (for UI interactions)
CREATE POLICY "Anon can update tasks" ON tasks FOR UPDATE USING (true);

-- Agents table for Command Center v0.3
CREATE TABLE agents (
  agent_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT CHECK (status IN ('idle', 'working', 'error', 'completed')) DEFAULT 'idle',
  current_task TEXT,
  last_active TIMESTAMPTZ,
  tasks_completed INT DEFAULT 0,
  success_rate INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_last_active ON agents(last_active);

-- Row Level Security
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Service role can do everything on agents" ON agents FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Anon can read agents" ON agents FOR SELECT USING (true);
CREATE POLICY "Anon can update agents" ON agents FOR UPDATE USING (true);

-- Insert initial agent data
INSERT INTO agents (agent_id, name, status, current_task, last_active, tasks_completed, success_rate) VALUES
  ('prime', 'Prime Agent', 'idle', '', NOW(), 0, 100),
  ('work', 'Work Agent', 'idle', '', NOW(), 0, 100),
  ('lifestyle', 'Lifestyle Agent', 'idle', '', NOW(), 0, 100),
  ('build', 'Build Agent', 'idle', '', NOW(), 0, 100),
  ('research', 'Research Agent', 'idle', '', NOW(), 0, 100);

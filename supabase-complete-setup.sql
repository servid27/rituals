-- Complete Supabase Database Setup for Rituals App
-- Copy and paste this entire file into Supabase SQL Editor and run it

-- =============================================
-- STEP 1: Create Authentication Tables
-- =============================================

-- Users table (NextAuth)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  email_verified TIMESTAMP WITH TIME ZONE,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Accounts table (NextAuth)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(provider, provider_account_id)
);

-- Sessions table (NextAuth)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_token TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Verification tokens table (NextAuth)
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- =============================================
-- STEP 2: Create Application Tables
-- =============================================

-- Routines table (for storing user rituals/routines)
CREATE TABLE IF NOT EXISTS routines (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tasks JSONB DEFAULT '[]'::jsonb,
  sessions JSONB DEFAULT '[]'::jsonb,
  "isActive" BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Routine sessions table (for storing ritual session records)
CREATE TABLE IF NOT EXISTS routine_sessions (
  id TEXT PRIMARY KEY,
  routine_id TEXT NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date_iso TEXT NOT NULL,
  start_iso TEXT NOT NULL,
  end_iso TEXT NOT NULL,
  target_seconds INTEGER NOT NULL DEFAULT 0,
  actual_seconds INTEGER NOT NULL DEFAULT 0,
  delta_seconds INTEGER NOT NULL DEFAULT 0,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  tasks_total INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =============================================
-- STEP 3: Create Indexes for Performance
-- =============================================

-- Auth table indexes
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_token ON sessions(session_token);

-- App table indexes
CREATE INDEX IF NOT EXISTS idx_routines_user_id ON routines(user_id);
CREATE INDEX IF NOT EXISTS idx_routines_created_at ON routines(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_routines_active ON routines("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_routine_sessions_user_id ON routine_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_routine_sessions_routine_id ON routine_sessions(routine_id);
CREATE INDEX IF NOT EXISTS idx_routine_sessions_date ON routine_sessions(date_iso DESC);
CREATE INDEX IF NOT EXISTS idx_routine_sessions_created_at ON routine_sessions(created_at DESC);

-- =============================================
-- STEP 4: Create Update Triggers
-- =============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updating updated_at on record changes
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
CREATE TRIGGER update_accounts_updated_at 
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at 
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_routines_updated_at ON routines;
CREATE TRIGGER update_routines_updated_at 
  BEFORE UPDATE ON routines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- STEP 5: Enable Row Level Security (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_sessions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 6: Create RLS Policies
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Service role can manage users" ON users;

DROP POLICY IF EXISTS "Users can view their own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can manage their own accounts" ON accounts;
DROP POLICY IF EXISTS "Service role can manage accounts" ON accounts;

DROP POLICY IF EXISTS "Users can view their own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can manage their own sessions" ON sessions;
DROP POLICY IF EXISTS "Service role can manage sessions" ON sessions;

DROP POLICY IF EXISTS "Verification tokens are publicly accessible" ON verification_tokens;
DROP POLICY IF EXISTS "Service role can manage verification tokens" ON verification_tokens;

DROP POLICY IF EXISTS "Users can view their own routines" ON routines;
DROP POLICY IF EXISTS "Users can insert their own routines" ON routines;
DROP POLICY IF EXISTS "Users can update their own routines" ON routines;
DROP POLICY IF EXISTS "Users can delete their own routines" ON routines;

DROP POLICY IF EXISTS "Users can view their own routine sessions" ON routine_sessions;
DROP POLICY IF EXISTS "Users can insert their own routine sessions" ON routine_sessions;
DROP POLICY IF EXISTS "Users can update their own routine sessions" ON routine_sessions;
DROP POLICY IF EXISTS "Users can delete their own routine sessions" ON routine_sessions;

-- Users table policies
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role can manage users" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- Accounts table policies
CREATE POLICY "Users can view their own accounts" ON accounts
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own accounts" ON accounts
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage accounts" ON accounts
    FOR ALL USING (auth.role() = 'service_role');

-- Sessions table policies
CREATE POLICY "Users can view their own sessions" ON sessions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own sessions" ON sessions
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage sessions" ON sessions
    FOR ALL USING (auth.role() = 'service_role');

-- Verification tokens (public access for auth flow)
CREATE POLICY "Verification tokens are publicly accessible" ON verification_tokens
    FOR ALL USING (true);
CREATE POLICY "Service role can manage verification tokens" ON verification_tokens
    FOR ALL USING (auth.role() = 'service_role');

-- Routines table policies
CREATE POLICY "Users can view their own routines" ON routines
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own routines" ON routines
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own routines" ON routines
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own routines" ON routines
    FOR DELETE USING (auth.uid() = user_id);

-- Routine sessions table policies
CREATE POLICY "Users can view their own routine sessions" ON routine_sessions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own routine sessions" ON routine_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own routine sessions" ON routine_sessions
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own routine sessions" ON routine_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- STEP 7: Create Helper Functions
-- =============================================

-- Function to get user's routine count
CREATE OR REPLACE FUNCTION get_user_routine_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM routines 
    WHERE user_id = user_uuid AND "isActive" = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's total session time
CREATE OR REPLACE FUNCTION get_user_total_session_time(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(actual_seconds), 0)::INTEGER
    FROM routine_sessions 
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's routine statistics
CREATE OR REPLACE FUNCTION get_user_routine_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_routines', COUNT(DISTINCT r.id),
    'active_routines', COUNT(DISTINCT CASE WHEN r."isActive" = true THEN r.id END),
    'total_sessions', COUNT(rs.id),
    'total_time_seconds', COALESCE(SUM(rs.actual_seconds), 0),
    'avg_session_time', COALESCE(AVG(rs.actual_seconds), 0),
    'last_session_date', MAX(rs.date_iso)
  ) INTO result
  FROM routines r
  LEFT JOIN routine_sessions rs ON r.id = rs.routine_id
  WHERE r.user_id = user_uuid;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- SETUP COMPLETE!
-- =============================================

-- Create a simple table to track setup completion
CREATE TABLE IF NOT EXISTS setup_log (
  id SERIAL PRIMARY KEY,
  setup_name TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  version TEXT DEFAULT '1.0'
);

-- Log the setup completion
INSERT INTO setup_log (setup_name, version) 
VALUES ('Rituals App Database Setup', '1.0');

-- Show success message
SELECT 
  '🎉 Supabase setup complete!' as status,
  'All tables, indexes, RLS policies, and functions have been created.' as message,
  'You can now update your .env file and restart your app.' as next_step;

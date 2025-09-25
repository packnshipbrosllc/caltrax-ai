-- CalTrax Database Schema
-- Run this in your Supabase SQL editor

-- Create caltrax_users table
CREATE TABLE IF NOT EXISTS caltrax_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  has_paid BOOLEAN DEFAULT FALSE,
  plan TEXT CHECK (plan IN ('trial', 'monthly', 'yearly')) DEFAULT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  trial_used BOOLEAN DEFAULT FALSE,
  trial_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  profile_data JSONB DEFAULT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_caltrax_users_clerk_id ON caltrax_users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_caltrax_users_email ON caltrax_users(email);
CREATE INDEX IF NOT EXISTS idx_caltrax_users_has_paid ON caltrax_users(has_paid);

-- Enable Row Level Security
ALTER TABLE caltrax_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own data
CREATE POLICY "Users can view own data" ON caltrax_users
  FOR SELECT USING (clerk_user_id = auth.jwt() ->> 'sub');

-- Users can insert their own data
CREATE POLICY "Users can insert own data" ON caltrax_users
  FOR INSERT WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

-- Users can update their own data
CREATE POLICY "Users can update own data" ON caltrax_users
  FOR UPDATE USING (clerk_user_id = auth.jwt() ->> 'sub');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_caltrax_users_updated_at
  BEFORE UPDATE ON caltrax_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data (optional)
-- INSERT INTO caltrax_users (clerk_user_id, email, has_paid, plan, trial_used) 
-- VALUES ('test_user_123', 'test@example.com', false, null, false);

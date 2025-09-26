-- CalTrax Daily Tracking Database Schema
-- Run this in your Supabase SQL editor after the main schema

-- Create daily_entries table for individual food entries
CREATE TABLE IF NOT EXISTS daily_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  entry_id TEXT NOT NULL, -- Original ID from frontend
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  food_name TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  calories DECIMAL(10,2) NOT NULL,
  protein_g DECIMAL(10,2) NOT NULL,
  fat_g DECIMAL(10,2) NOT NULL,
  carbs_g DECIMAL(10,2) NOT NULL,
  health_score INTEGER DEFAULT 0,
  confidence INTEGER DEFAULT 0,
  source TEXT DEFAULT 'manual', -- 'manual', 'barcode', 'ai_vision'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily_totals table for daily summaries
CREATE TABLE IF NOT EXISTS daily_totals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_calories DECIMAL(10,2) DEFAULT 0,
  total_protein_g DECIMAL(10,2) DEFAULT 0,
  total_fat_g DECIMAL(10,2) DEFAULT 0,
  total_carbs_g DECIMAL(10,2) DEFAULT 0,
  entry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create weekly_summaries table for weekly progress
CREATE TABLE IF NOT EXISTS weekly_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL, -- Monday of the week
  week_end DATE NOT NULL,   -- Sunday of the week
  total_calories DECIMAL(10,2) DEFAULT 0,
  total_protein_g DECIMAL(10,2) DEFAULT 0,
  total_fat_g DECIMAL(10,2) DEFAULT 0,
  total_carbs_g DECIMAL(10,2) DEFAULT 0,
  avg_daily_calories DECIMAL(10,2) DEFAULT 0,
  days_tracked INTEGER DEFAULT 0,
  goal_calories DECIMAL(10,2), -- User's daily calorie goal
  goal_protein_g DECIMAL(10,2), -- User's daily protein goal
  goal_fat_g DECIMAL(10,2), -- User's daily fat goal
  goal_carbs_g DECIMAL(10,2), -- User's daily carbs goal
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_entries_user_date ON daily_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_entries_timestamp ON daily_entries(timestamp);
CREATE INDEX IF NOT EXISTS idx_daily_totals_user_date ON daily_totals(user_id, date);
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_user_week ON weekly_summaries(user_id, week_start);

-- Enable Row Level Security
ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_totals ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_summaries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for daily_entries
CREATE POLICY "Users can view own daily entries" ON daily_entries
  FOR SELECT USING (user_id IN (
    SELECT id FROM profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'
  ));

CREATE POLICY "Users can insert own daily entries" ON daily_entries
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'
  ));

CREATE POLICY "Users can update own daily entries" ON daily_entries
  FOR UPDATE USING (user_id IN (
    SELECT id FROM profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'
  ));

CREATE POLICY "Users can delete own daily entries" ON daily_entries
  FOR DELETE USING (user_id IN (
    SELECT id FROM profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'
  ));

-- Create RLS policies for daily_totals
CREATE POLICY "Users can view own daily totals" ON daily_totals
  FOR SELECT USING (user_id IN (
    SELECT id FROM profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'
  ));

CREATE POLICY "Users can insert own daily totals" ON daily_totals
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'
  ));

CREATE POLICY "Users can update own daily totals" ON daily_totals
  FOR UPDATE USING (user_id IN (
    SELECT id FROM profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'
  ));

-- Create RLS policies for weekly_summaries
CREATE POLICY "Users can view own weekly summaries" ON weekly_summaries
  FOR SELECT USING (user_id IN (
    SELECT id FROM profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'
  ));

CREATE POLICY "Users can insert own weekly summaries" ON weekly_summaries
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'
  ));

CREATE POLICY "Users can update own weekly summaries" ON weekly_summaries
  FOR UPDATE USING (user_id IN (
    SELECT id FROM profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'
  ));

-- Create triggers to update updated_at timestamps
CREATE TRIGGER update_daily_entries_updated_at
  BEFORE UPDATE ON daily_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_totals_updated_at
  BEFORE UPDATE ON daily_totals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_summaries_updated_at
  BEFORE UPDATE ON weekly_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically update daily totals when entries change
CREATE OR REPLACE FUNCTION update_daily_totals()
RETURNS TRIGGER AS $$
DECLARE
  target_date DATE;
  user_uuid UUID;
BEGIN
  -- Determine the target date and user
  IF TG_OP = 'DELETE' THEN
    target_date := OLD.date;
    user_uuid := OLD.user_id;
  ELSE
    target_date := NEW.date;
    user_uuid := NEW.user_id;
  END IF;

  -- Recalculate totals for the day
  INSERT INTO daily_totals (user_id, date, total_calories, total_protein_g, total_fat_g, total_carbs_g, entry_count)
  SELECT 
    user_uuid,
    target_date,
    COALESCE(SUM(calories), 0),
    COALESCE(SUM(protein_g), 0),
    COALESCE(SUM(fat_g), 0),
    COALESCE(SUM(carbs_g), 0),
    COUNT(*)
  FROM daily_entries 
  WHERE user_id = user_uuid AND date = target_date
  ON CONFLICT (user_id, date) 
  DO UPDATE SET
    total_calories = EXCLUDED.total_calories,
    total_protein_g = EXCLUDED.total_protein_g,
    total_fat_g = EXCLUDED.total_fat_g,
    total_carbs_g = EXCLUDED.total_carbs_g,
    entry_count = EXCLUDED.entry_count,
    updated_at = NOW();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update daily totals
CREATE TRIGGER trigger_update_daily_totals_insert
  AFTER INSERT ON daily_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_totals();

CREATE TRIGGER trigger_update_daily_totals_update
  AFTER UPDATE ON daily_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_totals();

CREATE TRIGGER trigger_update_daily_totals_delete
  AFTER DELETE ON daily_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_totals();

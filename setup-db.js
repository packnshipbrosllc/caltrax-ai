#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🗄️  Setting up Supabase database for CalTrax...\n');

const sqlContent = `-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT,
  height INTEGER,
  weight DECIMAL(5,2),
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female')),
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'very', 'extreme')),
  goals TEXT[],
  dietary_restrictions TEXT[],
  calories INTEGER,
  protein INTEGER,
  fat INTEGER,
  carbs INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create food_entries table
CREATE TABLE IF NOT EXISTS food_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  calories INTEGER NOT NULL,
  protein INTEGER NOT NULL,
  fat INTEGER NOT NULL,
  carbs INTEGER NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  trial_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_food_entries_user_id ON food_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_food_entries_date ON food_entries(date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- User profiles: users can only access their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

-- Food entries: users can only access their own entries
CREATE POLICY "Users can view own food entries" ON food_entries
  FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own food entries" ON food_entries
  FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own food entries" ON food_entries
  FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own food entries" ON food_entries
  FOR DELETE USING (user_id = auth.jwt() ->> 'sub');

-- Subscriptions: users can only access their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own subscriptions" ON subscriptions
  FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

const sqlPath = path.join(__dirname, 'supabase', 'schema.sql');
fs.writeFileSync(sqlPath, sqlContent);

console.log('✅ Created database schema at supabase/schema.sql');
console.log('\n📝 Next steps:');
console.log('1. Go to https://supabase.com/dashboard');
console.log('2. Select your project');
console.log('3. Go to SQL Editor');
console.log('4. Copy and paste the contents of supabase/schema.sql');
console.log('5. Run the SQL to create your database tables');
console.log('\n🚀 Your database will be ready!');

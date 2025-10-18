import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '❌ FATAL: Supabase environment variables not configured!\n' +
    'Add these to your .env.local:\n' +
    'REACT_APP_SUPABASE_URL=your_url\n' +
    'REACT_APP_SUPABASE_ANON_KEY=your_key'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('✅ Supabase client initialized successfully');
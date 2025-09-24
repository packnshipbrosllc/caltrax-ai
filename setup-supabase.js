#!/usr/bin/env node

/**
 * Supabase Setup Script
 * This script helps you set up Supabase with your existing project
 */

console.log('🚀 Setting up Supabase for CalTrax...\n');

console.log('To get your Supabase credentials:');
console.log('1. Go to https://supabase.com/dashboard');
console.log('2. Select your existing project (or create a new one)');
console.log('3. Go to Settings > API');
console.log('4. Copy the following values:\n');

console.log('   Project URL: https://your-project-id.supabase.co');
console.log('   Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\n');

console.log('Then run these commands:');
console.log('1. Create .env.local file:');
console.log('   cp .env.example .env.local');
console.log('\n2. Edit .env.local and add your Supabase credentials:');
console.log('   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co');
console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here');
console.log('\n3. Run the database setup:');
console.log('   npm run setup-db');
console.log('\n4. Start the development server:');
console.log('   npm run dev');

console.log('\n✨ Your app will be ready to go!');

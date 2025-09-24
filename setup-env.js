#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up environment variables for CalTrax...\n');

const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Stripe Configuration (using your existing keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51S843W2LmuiKVnPdDqRZB6VjLk2mflxRjmcGJEGFgeYBiD1qS8pihppJdJNwGVnU7r1BNEl1gmqJ0qtOMq67dNsq00hfphXU8o
STRIPE_SECRET_KEY=sk_live_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_live_your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/signin
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# OpenAI Configuration (for AI Vision)
OPENAI_API_KEY=sk-your_openai_api_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=https://caltrax.ai
`;

const envPath = path.join(__dirname, '.env.local');

if (fs.existsSync(envPath)) {
  console.log('⚠️  .env.local already exists. Backing up to .env.local.backup');
  fs.copyFileSync(envPath, envPath + '.backup');
}

fs.writeFileSync(envPath, envContent);

console.log('✅ Created .env.local file with your existing Stripe configuration');
console.log('\n📝 Next steps:');
console.log('1. Edit .env.local and add your actual credentials:');
console.log('   - Supabase URL and keys from https://supabase.com/dashboard');
console.log('   - Your Stripe secret key from https://dashboard.stripe.com');
console.log('   - Your Clerk keys from https://dashboard.clerk.com');
console.log('   - Your OpenAI API key from https://platform.openai.com');
console.log('\n2. Run: npm run setup-db');
console.log('\n3. Run: npm run dev');
console.log('\n🚀 Your app will be ready!');

#!/usr/bin/env node

/**
 * CalTrax Environment Variables Backup Script
 * 
 * This script helps you document your current Netlify environment variables
 * before updating your site.
 */

console.log('🔄 CalTrax Environment Variables Backup Helper\n');

console.log('📋 Please copy these values from your Netlify dashboard:');
console.log('   1. Go to: https://app.netlify.com');
console.log('   2. Select your CalTrax site');
console.log('   3. Go to: Site Settings → Environment Variables');
console.log('   4. Copy each value below:\n');

console.log('┌─────────────────────────────────────────────────────────────┐');
console.log('│                    ENVIRONMENT VARIABLES                   │');
console.log('├─────────────────────────────────────────────────────────────┤');
console.log('│ NEXT_PUBLIC_SUPABASE_URL = [your current value]           │');
console.log('│ NEXT_PUBLIC_SUPABASE_ANON_KEY = [your current value]      │');
console.log('│ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = [your current value] │');
console.log('│ STRIPE_SECRET_KEY = [your current value]                  │');
console.log('│ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = [your current value]  │');
console.log('│ CLERK_SECRET_KEY = [your current value]                   │');
console.log('│ OPENAI_API_KEY = [your current value]                     │');
console.log('│ NEXT_PUBLIC_APP_URL = [your current value]                │');
console.log('└─────────────────────────────────────────────────────────────┘\n');

console.log('💾 Save this information in a secure location!');
console.log('📸 Take a screenshot of your Netlify environment variables page');
console.log('📝 Copy the values above to a text file\n');

console.log('✅ Once you have this information saved, you can safely update your site!');
console.log('🚀 Ready to deploy: caltrax-production-ready.zip');

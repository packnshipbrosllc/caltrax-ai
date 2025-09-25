#!/usr/bin/env node

/**
 * Vercel Environment Variables Setup Script
 * 
 * This script helps you set up the environment variables in Vercel
 * for your CalTrax app to work properly.
 */

console.log('🚀 CalTrax Vercel Environment Setup\n');

console.log('📋 You need to set these environment variables in Vercel:');
console.log('   1. Go to: https://vercel.com/dashboard');
console.log('   2. Select your CalTrax project');
console.log('   3. Go to: Settings → Environment Variables');
console.log('   4. Add each variable below:\n');

console.log('┌─────────────────────────────────────────────────────────────┐');
console.log('│                    REQUIRED VARIABLES                     │');
console.log('├─────────────────────────────────────────────────────────────┤');
console.log('│ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_51S843W2LmuiKVnPdDqRZB6VjLk2mflxRjmcGJEGFgeYBiD1qS8pihppJdJNwGVnU7r1BNEl1gmqJ0qtOMq67dNsq00hfphXU8o │');
console.log('│ STRIPE_SECRET_KEY = sk_live_YOUR_SECRET_KEY_HERE          │');
console.log('│ STRIPE_WEBHOOK_SECRET = whsec_YOUR_WEBHOOK_SECRET_HERE    │');
console.log('│ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_live_ZXRoaWNhbC1hc3AtOTcuY2xlcmsuYWNjb3VudHMuZGV2JA │');
console.log('│ CLERK_SECRET_KEY = sk_live_YOUR_CLERK_SECRET_KEY_HERE     │');
console.log('│ NEXT_PUBLIC_APP_URL = https://caltrax.ai                  │');
console.log('└─────────────────────────────────────────────────────────────┘\n');

console.log('🔑 To get your Stripe keys:');
console.log('   1. Go to: https://dashboard.stripe.com/apikeys');
console.log('   2. Copy your Secret key (starts with sk_live_)');
console.log('   3. Copy your Publishable key (starts with pk_live_)');

console.log('\n🔑 To get your Clerk keys:');
console.log('   1. Go to: https://dashboard.clerk.com/');
console.log('   2. Select your CalTrax project');
console.log('   3. Go to: API Keys');
console.log('   4. Copy your Publishable key and Secret key');

console.log('\n🔗 To set up Stripe webhooks:');
console.log('   1. Go to: https://dashboard.stripe.com/webhooks');
console.log('   2. Add endpoint: https://caltrax.ai/api/stripe/webhook');
console.log('   3. Select events: customer.subscription.*, invoice.payment_*');
console.log('   4. Copy the webhook secret (starts with whsec_)');

console.log('\n✅ After setting these variables, redeploy your Vercel app!');
console.log('🚀 Your Stripe integration will work perfectly!');

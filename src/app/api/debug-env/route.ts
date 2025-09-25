import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'Set' : 'Missing',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY ? 'Set' : 'Missing',
    clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'Set' : 'Missing',
    clerkSecretKey: process.env.CLERK_SECRET_KEY ? 'Set' : 'Missing',
    appUrl: process.env.NEXT_PUBLIC_APP_URL ? 'Set' : 'Missing',
    timestamp: new Date().toISOString()
  });
}

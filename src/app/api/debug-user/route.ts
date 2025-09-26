import { NextRequest, NextResponse } from 'next/server';
import { getUserByClerkId } from '../../../lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clerkUserId = searchParams.get('clerkUserId');
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'clerkUserId parameter required' }, { status: 400 });
    }

    console.log('🔍 Debug: Checking user data for:', clerkUserId);
    
    const user = await getUserByClerkId(clerkUserId);
    
    return NextResponse.json({
      clerkUserId,
      user,
      hasUser: !!user,
      hasPaid: user?.has_paid || false,
      plan: user?.plan,
      paymentDate: user?.payment_date,
      profileData: user?.profile_data,
      hasProfile: !!(user?.profile_data?.calories),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug user error:', error);
    return NextResponse.json({ 
      error: 'Failed to get user data',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/dailyTracking';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing database connection...');
    
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Supabase not configured',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
      }, { status: 500 });
    }

    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Database test failed:', error);
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    console.log('✅ Database connection successful');
    
    // Test daily_entries table
    const { data: entriesData, error: entriesError } = await supabase
      .from('daily_entries')
      .select('count')
      .limit(1);

    if (entriesError) {
      console.error('❌ Daily entries table test failed:', entriesError);
      return NextResponse.json({ 
        error: 'Daily entries table not accessible',
        details: entriesError.message,
        code: entriesError.code
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      profilesTable: 'accessible',
      dailyEntriesTable: 'accessible',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Database test error:', error);
    return NextResponse.json({ 
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

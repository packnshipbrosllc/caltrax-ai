import { NextRequest, NextResponse } from 'next/server';
import { addFoodEntry } from '../../../lib/dailyTracking';

export async function POST(request: NextRequest) {
  try {
    const { clerkUserId } = await request.json();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'clerkUserId required' }, { status: 400 });
    }

    console.log('🧪 Testing food entry creation for user:', clerkUserId);

    const testFoodData = {
      name: 'Test Apple',
      nutrition: {
        calories: 95,
        protein: 0.5,
        fat: 0.3,
        carbs: 25
      },
      score: 8,
      confidence: 100,
      source: 'manual' as const,
      quantity: 1,
      unit: 'medium'
    };

    const result = await addFoodEntry(clerkUserId, testFoodData);

    if (result) {
      console.log('✅ Test food entry created successfully:', result);
      return NextResponse.json({
        success: true,
        message: 'Test food entry created',
        entry: result,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('❌ Test food entry creation failed');
      return NextResponse.json({
        success: false,
        message: 'Test food entry creation failed',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Test food entry error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test food entry failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

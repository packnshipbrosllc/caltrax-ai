import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    
    console.log('Webhook test received:');
    console.log('Body length:', body.length);
    console.log('Signature:', signature ? 'Present' : 'Missing');
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook test endpoint working',
      timestamp: new Date().toISOString(),
      bodyLength: body.length,
      hasSignature: !!signature
    });
  } catch (error) {
    console.error('Webhook test error:', error);
    return NextResponse.json({ 
      error: 'Webhook test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Webhook test endpoint is working',
    timestamp: new Date().toISOString(),
    endpoint: '/api/stripe/webhook-test'
  });
}

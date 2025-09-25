import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    console.log('Webhook received:');
    console.log('Body length:', body.length);
    console.log('Signature present:', !!signature);
    console.log('Webhook secret present:', !!webhookSecret);

    if (!signature) {
      console.error('No signature provided');
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
    }

    if (!webhookSecret) {
      console.error('Webhook secret not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log('Webhook signature verified successfully');
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Processing webhook event:', event.type);

    try {
      // For now, just log the event and return success
      // We'll add database updates later once we confirm webhook is working
      console.log('Event data:', JSON.stringify(event.data.object, null, 2));
      
      switch (event.type) {
        case 'payment_intent.succeeded':
          console.log('Payment succeeded:', event.data.object);
          break;
        case 'customer.subscription.created':
          console.log('Subscription created:', event.data.object);
          break;
        case 'customer.subscription.updated':
          console.log('Subscription updated:', event.data.object);
          break;
        case 'customer.subscription.deleted':
          console.log('Subscription cancelled:', event.data.object);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return NextResponse.json({ 
        received: true, 
        eventType: event.type,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Webhook handler error:', error);
      return NextResponse.json({ 
        error: 'Webhook handler failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Stripe webhook endpoint is working',
    timestamp: new Date().toISOString(),
    endpoint: '/api/stripe/webhook'
  });
}
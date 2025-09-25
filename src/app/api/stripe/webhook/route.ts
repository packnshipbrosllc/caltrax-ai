import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log('Received webhook event:', event.type);

  try {
    // Only process database updates if Supabase is configured
    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (hasSupabase) {
      // Dynamically import database functions only when needed
      const { createOrUpdateUser, updateUserPayment, markTrialUsed } = await import('@/lib/database');
      
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const { userId, plan, email } = paymentIntent.metadata;
          
          console.log('Payment succeeded:', { userId, plan, email });
          
          // Update user payment status
          await updateUserPayment(
            userId,
            true,
            plan as 'trial' | 'monthly' | 'yearly',
            new Date().toISOString()
          );
          
          // If it's a trial, mark trial as used
          if (plan === 'trial') {
            await markTrialUsed(userId);
          }
          
          break;
        }
        
        case 'customer.subscription.created': {
          const subscription = event.data.object as Stripe.Subscription;
          const { userId, plan, email } = subscription.metadata;
          
          console.log('Subscription created:', { userId, plan, email });
          
          // Update user payment status
          await updateUserPayment(
            userId,
            true,
            plan as 'monthly' | 'yearly',
            new Date().toISOString()
          );
          
          break;
        }
        
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const { userId } = subscription.metadata;
          
          console.log('Subscription updated:', subscription.id);
          
          // Handle subscription status changes
          if (subscription.status === 'active') {
            await updateUserPayment(userId, true, 'monthly', new Date().toISOString());
          }
          
          break;
        }
        
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const { userId } = subscription.metadata;
          
          console.log('Subscription cancelled:', subscription.id);
          
          // Mark user as not paid
          await updateUserPayment(userId, false, null);
          
          break;
        }
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } else {
      console.log('Supabase not configured, skipping database updates');
      console.log('Event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

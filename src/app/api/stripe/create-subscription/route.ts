import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Real price IDs from your working Netlify app
const PRICE_IDS = {
  trial: 'price_1S84cT2LmuiKVnPd3NXruhvk', // Monthly price for trial
  monthly: 'price_1S84cT2LmuiKVnPd3NXruhvk', // Monthly subscription
  yearly: 'price_1S84dS2LmuiKVnPdj6UCRzsN', // Yearly subscription
};

export async function POST(request: NextRequest) {
  try {
    const { customerId, paymentMethodId, planId } = await request.json();

    console.log('Creating subscription for:', { customerId, paymentMethodId, planId });

    if (!customerId || !paymentMethodId) {
      return NextResponse.json({ error: 'Customer ID and Payment Method ID are required' }, { status: 400 });
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Determine trial period based on plan
    const trialDays = planId === 'trial' ? 3 : 0;
    
    // Get the correct price ID
    const priceId = PRICE_IDS[planId as keyof typeof PRICE_IDS];
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
    }
    
    // Create subscription with trial period
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: priceId,
        },
      ],
      trial_period_days: trialDays,
      payment_behavior: trialDays > 0 ? 'allow_incomplete' : 'default_incomplete',
      payment_settings: { 
        save_default_payment_method: 'on_subscription',
        payment_method_options: {
          card: {
            request_three_d_secure: 'automatic'
          }
        }
      },
      expand: ['latest_invoice.payment_intent'],
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      clientSecret: (subscription.latest_invoice as Stripe.Invoice).payment_intent as string,
    });
  } catch (error: any) {
    console.error('Stripe Subscription creation failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
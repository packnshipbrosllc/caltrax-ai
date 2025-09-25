import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

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
    
    // For trial, we need to create a subscription with a price
    // Let's create a monthly subscription for trials (they'll be charged after trial)
    const monthlyPrice = await stripe.prices.create({
      unit_amount: 500, // $5
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      product_data: {
        name: 'CalTrax AI Monthly Plan',
        description: 'CalTrax AI-powered nutrition tracking - Monthly subscription - $5/month',
      },
    });
    
    // Create subscription with trial period
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: monthlyPrice.id,
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
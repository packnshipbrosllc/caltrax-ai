import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const { customerId, plan, email, userId } = await request.json();

    console.log('Creating subscription for:', { customerId, plan, email, userId });

    // Define plan pricing
    const planPrices = {
      monthly: 500, // $5/month
      yearly: 3000, // $30/year
    };

    const amount = planPrices[plan as keyof typeof planPrices];
    
    if (amount === undefined) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Create price for the plan
    const price = await stripe.prices.create({
      unit_amount: amount,
      currency: 'usd',
      recurring: {
        interval: plan === 'yearly' ? 'year' : 'month',
      },
      product_data: {
        name: `CalTrax ${plan === 'yearly' ? 'Yearly' : 'Monthly'} Plan`,
        description: `CalTrax AI-powered nutrition tracking - ${plan === 'yearly' ? 'Yearly' : 'Monthly'} subscription - $${plan === 'yearly' ? '30' : '5'}/${plan === 'yearly' ? 'year' : 'month'}`,
      },
    });

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price.id }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId: userId,
        plan: plan,
        email: email,
      },
    });

    console.log('Subscription created:', subscription.id);

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
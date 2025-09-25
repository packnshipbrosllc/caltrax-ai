import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const { plan, email, userId } = await request.json();

    console.log('Creating payment intent for:', { plan, email, userId });

    // Define plan pricing (in cents)
    const planPrices = {
      trial: 0, // Free trial
      monthly: 500, // $5/month
      yearly: 3000, // $30/year (save 50%)
    };

    const amount = planPrices[plan as keyof typeof planPrices];
    
    if (amount === undefined) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Create or retrieve customer
    let customer;
    try {
      const existingCustomers = await stripe.customers.list({
        email: email,
        limit: 1,
      });
      
      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
      } else {
        customer = await stripe.customers.create({
          email: email,
          metadata: {
            userId: userId,
            plan: plan,
          },
        });
      }
    } catch (error) {
      console.error('Error creating/finding customer:', error);
      return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      customer: customer.id,
      metadata: {
        userId: userId,
        plan: plan,
        email: email,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('Payment intent created:', paymentIntent.id);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      customerId: customer.id,
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
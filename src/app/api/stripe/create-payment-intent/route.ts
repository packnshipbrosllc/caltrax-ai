import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    // Initialize Stripe inside the function to avoid build-time issues
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'Payment service not configured' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',
    });

    const { plan, email } = await request.json();
    
    console.log('Creating payment intent for plan:', plan, 'email:', email);
    
    // Define plan pricing
    const planPricing = {
      trial: { amount: 0, description: '3-Day Free Trial' },
      monthly: { amount: 500, description: 'Monthly Subscription' }, // $5.00
      yearly: { amount: 3000, description: 'Yearly Subscription' }   // $30.00
    };
    
    const pricing = planPricing[plan as keyof typeof planPricing];
    
    if (!pricing) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }
    
    // For trial, just return success without creating payment intent
    if (plan === 'trial') {
      return NextResponse.json({ 
        success: true, 
        clientSecret: null,
        amount: 0,
        description: pricing.description
      });
    }
    
    // Create payment intent for paid plans
    const paymentIntent = await stripe.paymentIntents.create({
      amount: pricing.amount,
      currency: 'usd',
      description: pricing.description,
      metadata: {
        plan: plan,
        email: email,
        app: 'caltrax-ai'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    console.log('Payment intent created:', paymentIntent.id);
    
    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      amount: pricing.amount,
      description: pricing.description
    });
    
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
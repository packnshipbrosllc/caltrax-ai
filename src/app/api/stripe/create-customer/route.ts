import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    console.log('Creating Stripe customer:', { email, name });

    // Check if customer already exists
    const existingCustomers = await stripe.customers.list({ 
      email: email, 
      limit: 1 
    });

    if (existingCustomers.data.length > 0) {
      console.log('Customer already exists:', existingCustomers.data[0].id);
      return NextResponse.json({ 
        success: true, 
        customerId: existingCustomers.data[0].id 
      });
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email: email,
      name: name,
    });

    console.log('Customer created:', customer.id);

    return NextResponse.json({ 
      success: true, 
      customerId: customer.id 
    });
  } catch (error: any) {
    console.error('Stripe customer creation failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
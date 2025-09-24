import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_live_51S843W2LmuiKVnPdDqRZB6VjLk2mflxRjmcGJEGFgeYBiD1qS8pihppJdJNwGVnU7r1BNEl1gmqJ0qtOMq67dNsq00hfphXU8o',
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
};

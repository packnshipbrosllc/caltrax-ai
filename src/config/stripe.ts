export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_live_51S843W2LmuiKVnPdDqRZB6VjLk2mflxRjmcGJEGFgeYBiD1qS8pihppJdJNwGVnU7r1BNEl1gmqJ0qtOMq67dNsq00hfphXU8o',
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  
  // API endpoints
  apiEndpoints: {
    createCustomer: '/api/stripe/create-customer',
    createSubscription: '/api/stripe/create-subscription',
    getSubscription: '/api/stripe/get-subscription',
    cancelSubscription: '/api/stripe/cancel-subscription',
    listSubscriptions: '/api/stripe/list-subscriptions',
  },
  
  // Plan configurations (using your existing Stripe price IDs)
  plans: {
    trial: {
      name: 'Trial',
      priceId: 'price_1S84cT2LmuiKVnPd3NXruhvk',
      amount: 500, // $5.00 in cents
      currency: 'usd',
      interval: 'month',
      trialDays: 3,
      features: [
        'Full calorie tracking',
        'Macro breakdown',
        'Food database access',
        'Basic meal planning',
        'Mobile app access',
      ]
    },
    monthly: {
      name: 'Monthly',
      priceId: 'price_1S84cT2LmuiKVnPd3NXruhvk',
      amount: 500, // $5.00 in cents
      currency: 'usd',
      interval: 'month',
      features: [
        'Everything in Trial',
        'Advanced meal planning',
        'Workout plan generation',
        'Progress analytics',
        'Priority support',
        'Export data',
      ]
    },
    yearly: {
      name: 'Yearly',
      priceId: 'price_1S84dS2LmuiKVnPdj6UCRzsN',
      amount: 3000, // $30.00 in cents
      currency: 'usd',
      interval: 'year',
      features: [
        'Everything in Monthly',
        '2 months free',
        'Premium features',
        'Advanced analytics',
        'Custom meal plans',
        'Personal nutritionist chat',
      ]
    }
  },
  
  // Debug mode
  debug: true,
  
  // Trial configuration
  trial: {
    days: 3,
    enabled: true,
  }
};

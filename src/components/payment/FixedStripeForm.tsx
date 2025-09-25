'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '../legacy/ui/Button';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'system-ui, sans-serif',
      '::placeholder': {
        color: '#9ca3af',
      },
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
    complete: {
      color: '#10b981',
      iconColor: '#10b981',
    },
  },
  hidePostalCode: true,
};

interface FixedStripeFormProps {
  selectedPlan: string;
  email: string;
  userId: string;
  onSuccess: (paymentData: any) => void;
  onError: (error: string) => void;
}

function PaymentForm({ selectedPlan, email, userId, onSuccess, onError }: FixedStripeFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isStripeLoaded, setIsStripeLoaded] = useState(false);

  // Check if Stripe is loaded
  useEffect(() => {
    if (stripe && elements) {
      setIsStripeLoaded(true);
    }
  }, [stripe, elements]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe is not loaded yet. Please wait and try again.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log('Starting payment process...');
      
      // Step 1: Create customer
      console.log('Creating customer...');
      const customerResponse = await fetch('/api/stripe/create-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          name: email.split('@')[0]
        }),
      });

      if (!customerResponse.ok) {
        const errorText = await customerResponse.text();
        console.error('Customer creation failed:', errorText);
        throw new Error(`Failed to create customer: ${errorText}`);
      }

      const customerData = await customerResponse.json();
      console.log('Customer created:', customerData);
      const { customerId } = customerData;

      // Step 2: Create payment method
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found. Please try again.');
      }

      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (pmError) {
        console.error('Payment method creation failed:', pmError);
        setError(`Payment method error: ${pmError.message}`);
        setIsProcessing(false);
        return;
      }
      
      console.log('Payment method created successfully:', paymentMethod.id);

      // Step 3: Create subscription
      console.log('Creating subscription...');
      
      const subscriptionResponse = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: customerId,
          paymentMethodId: paymentMethod.id,
          planId: selectedPlan
        }),
      });

      if (!subscriptionResponse.ok) {
        const errorText = await subscriptionResponse.text();
        console.error('Subscription creation failed:', errorText);
        throw new Error(`Failed to create subscription: ${errorText}`);
      }

      const subscriptionData = await subscriptionResponse.json();
      console.log('Subscription created:', subscriptionData);

      // Step 4: Handle payment confirmation
      if (subscriptionData.clientSecret) {
        console.log('Confirming payment...');
        const { error: confirmError } = await stripe.confirmCardPayment(subscriptionData.clientSecret);
        
        if (confirmError) {
          console.error('Payment confirmation failed:', confirmError);
          setError(confirmError.message);
          setIsProcessing(false);
          return;
        }
        console.log('Payment confirmed successfully');
      } else {
        console.log('Trial subscription created - no immediate payment required');
      }

      setSuccess(true);
      setIsProcessing(false);
      
      onSuccess({
        plan: selectedPlan,
        paymentDate: new Date().toISOString(),
        trial: selectedPlan === 'trial',
        subscriptionId: subscriptionData.subscriptionId,
        customerId: customerId
      });

    } catch (err: any) {
      console.error('Payment error:', err);
      const errorMessage = err.message || 'Payment failed. Please try again.';
      setError(errorMessage);
      onError(errorMessage);
      setIsProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center p-8 bg-green-500/10 border border-green-500/20 rounded-lg">
        <CheckCircle className="w-8 h-8 text-green-400 mr-3" />
        <div>
          <h3 className="text-lg font-semibold text-green-400">Payment Successful!</h3>
          <p className="text-sm text-green-300">
            {selectedPlan === 'trial' ? 'Your free trial has started!' : 'Your subscription is active!'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          <AlertCircle className="w-4 h-4 mr-2" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Card Details
        </label>
        <div 
          className="p-4 bg-zinc-900 border border-zinc-600 rounded-lg"
          style={{ 
            minHeight: '60px', 
            width: '100%',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {isStripeLoaded ? (
            <CardElement 
              options={cardElementOptions}
              className="w-full"
            />
          ) : (
            <div className="text-zinc-400 text-sm">Loading payment form...</div>
          )}
        </div>
      </div>

      <div className="text-xs text-zinc-400 space-y-2">
        {selectedPlan === 'trial' ? (
          <p>🔒 You won't be charged during your 3-day free trial. After the trial ends, you'll be automatically charged $5/month unless you cancel.</p>
        ) : (
          <p>🔒 Your payment information is secure and encrypted. We use industry-standard security measures.</p>
        )}
        <p className="text-red-400 font-medium">
          ⚠️ All purchases are final - No refunds allowed
        </p>
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing || !isStripeLoaded}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg py-3 disabled:opacity-50"
      >
        {isProcessing ? (
          <div className="flex items-center justify-center">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            {selectedPlan === 'trial' ? 'Setting up trial...' : 'Processing payment...'}
          </div>
        ) : (
          selectedPlan === 'trial' ? 'Start 3-Day Free Trial' : 'Subscribe Now'
        )}
      </Button>
    </form>
  );
}

export default function FixedStripeForm({ selectedPlan, email, userId, onSuccess, onError }: FixedStripeFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm 
        selectedPlan={selectedPlan}
        email={email}
        userId={userId}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}

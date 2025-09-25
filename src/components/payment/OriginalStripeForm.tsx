'use client';

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Lock, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../legacy/ui/Button';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#ffffff',
      '::placeholder': {
        color: '#9ca3af',
      },
      backgroundColor: '#18181b',
    },
    invalid: {
      color: '#ef4444',
    },
  },
  hidePostalCode: true,
};

interface OriginalStripeFormProps {
  selectedPlan: string;
  email: string;
  userId: string;
  onSuccess: (paymentData: any) => void;
  onError: (error: string) => void;
}

function PaymentForm({ selectedPlan, email, userId, onSuccess, onError }: OriginalStripeFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
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
          name: 'User Name'
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
          planId: selectedPlan === 'trial' ? 'trial' : selectedPlan,
        }),
      });

      if (!subscriptionResponse.ok) {
        const errorText = await subscriptionResponse.text();
        console.error('Subscription creation failed:', errorText);
        throw new Error(`Failed to create subscription: ${errorText}`);
      }

      const subscriptionData = await subscriptionResponse.json();
      console.log('Subscription created:', subscriptionData);

      // Success!
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
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          <AlertCircle className="w-4 h-4 mr-2" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Lock className="w-4 h-4" />
          <span>Your payment information is secure and encrypted</span>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Card Details
          </label>
          <div className="p-4 bg-zinc-900 border border-zinc-600 rounded-lg">
            <CardElement options={cardElementOptions} />
          </div>
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
        disabled={!stripe || isProcessing}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {selectedPlan === 'trial' ? 'Setting up trial...' : 'Processing payment...'}
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            {selectedPlan === 'trial' ? 'Start 3-Day Free Trial' : `Subscribe for $${selectedPlan === 'monthly' ? '5/month' : '30/year'}`}
          </>
        )}
      </Button>
    </form>
  );
}

export default function OriginalStripeForm({ selectedPlan, email, userId, onSuccess, onError }: OriginalStripeFormProps) {
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

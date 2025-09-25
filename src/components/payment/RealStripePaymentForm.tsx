'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Clock, Camera, Loader2, CreditCard, Lock } from 'lucide-react';
import { Button } from '../legacy/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../legacy/ui/Card';
import { createOrUpdateUser, hasUsedTrial } from '@/lib/database';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface RealStripePaymentFormProps {
  selectedPlan: string;
  email: string;
  userId: string;
  onSuccess: (paymentData: any) => void;
  onError: (error: string) => void;
}

function PaymentForm({ selectedPlan, email, userId, onSuccess, onError }: RealStripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Create payment intent
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: selectedPlan,
          email: email,
          userId: userId,
        }),
      });

      const { clientSecret, error: apiError } = await response.json();

      if (apiError) {
        throw new Error(apiError);
      }

      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
            billing_details: {
              email: email,
            },
          },
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        // Create/update user in database
        await createOrUpdateUser({
          clerk_user_id: userId,
          email: email,
          has_paid: true,
          plan: selectedPlan as 'trial' | 'monthly' | 'yearly',
          payment_date: new Date().toISOString(),
          trial_used: selectedPlan === 'trial',
          trial_start_date: selectedPlan === 'trial' ? new Date().toISOString() : null,
        });

        onSuccess({
          plan: selectedPlan,
          paymentDate: new Date().toISOString(),
          paymentIntentId: paymentIntent.id,
        });
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
      onError(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Lock className="w-4 h-4" />
          <span>Your payment information is secure and encrypted</span>
        </div>
        
        <div className="p-4 bg-zinc-900 border border-zinc-600 rounded-lg">
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Card Information
          </label>
          <CardElement
            options={cardElementOptions}
            className="p-3"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            {selectedPlan === 'trial' ? 'Start Free Trial' : `Subscribe for $${selectedPlan === 'monthly' ? '5/month' : '30/year'}`}
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>
    </form>
  );
}

export default function RealStripePaymentForm(props: RealStripePaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
}

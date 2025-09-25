'use client';

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '../legacy/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../legacy/ui/Card';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

// Initialize Stripe
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

interface PaymentFormProps {
  selectedPlan: string;
  email: string;
  onSuccess: (data: any) => void;
  onError: (error: string) => void;
}

function PaymentForm({ selectedPlan, email, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // For trial, skip payment processing
      if (selectedPlan === 'trial') {
        console.log('Trial plan - skipping payment');
        onSuccess({ plan: selectedPlan, email });
        return;
      }

      // Create payment intent
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: selectedPlan,
          email: email
        }),
      });

      const { success, clientSecret, error: apiError } = await response.json();

      if (!success || apiError) {
        throw new Error(apiError || 'Failed to create payment intent');
      }

      if (!clientSecret) {
        throw new Error('No client secret received');
      }

      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      });

      if (stripeError) {
        throw new Error(stripeError.message || 'Payment failed');
      }

      if (paymentIntent?.status === 'succeeded') {
        console.log('Payment succeeded:', paymentIntent);
        setSuccess(true);
        onSuccess({ 
          plan: selectedPlan, 
          email,
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount
        });
      } else {
        throw new Error('Payment was not successful');
      }

    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
      onError(err.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (success) {
    return (
      <Card className="bg-green-900/20 border-green-500/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2 text-green-400">
            <CheckCircle className="w-6 h-6" />
            <span className="text-lg font-semibold">Payment Successful!</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-800/50 border-zinc-700">
      <CardHeader>
        <CardTitle className="text-center text-xl">Payment Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {selectedPlan !== 'trial' && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Card Details
              </label>
              <div className="p-4 bg-zinc-900 border border-zinc-600 rounded-lg">
                <CardElement options={cardElementOptions} />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg py-3"
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

          <p className="text-xs text-zinc-500 text-center">
            By subscribing, you agree to our Terms of Service and Privacy Policy.
            {selectedPlan === 'trial' && ' You will be charged after the trial period.'}
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

interface StripePaymentFormProps {
  selectedPlan: string;
  email: string;
  onSuccess: (data: any) => void;
  onError: (error: string) => void;
}

export default function StripePaymentForm({ selectedPlan, email, onSuccess, onError }: StripePaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm 
        selectedPlan={selectedPlan}
        email={email}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}

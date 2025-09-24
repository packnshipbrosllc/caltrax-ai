'use client';

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '../legacy/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../legacy/ui/Card';
import { Loader2, AlertCircle, CheckCircle, X } from 'lucide-react';
import { STRIPE_CONFIG } from '@/config/stripe';

const stripePromise = loadStripe(STRIPE_CONFIG.publishableKey);

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
  onSuccess: (subscription: any) => void;
  onError: (error: string) => void;
  onClose: () => void;
  userEmail: string;
  userName: string;
  userId: string;
}

function PaymentForm({ selectedPlan, onSuccess, onError, onClose, userEmail, userName, userId }: PaymentFormProps) {
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
      console.log('Starting payment process...');
      
      // Step 1: Create customer
      console.log('Creating customer...');
      const customerResponse = await fetch('/api/stripe/create-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          name: userName,
          userId: userId,
        }),
      });

      if (!customerResponse.ok) {
        throw new Error('Failed to create customer');
      }

      const { customerId } = await customerResponse.json();
      console.log('Customer created:', customerId);

      // Step 2: Create payment method
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (pmError) {
        throw new Error(pmError.message);
      }

      console.log('Payment method created:', paymentMethod.id);

      // Step 3: Create subscription
      console.log('Creating subscription...');
      const subscriptionResponse = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: customerId,
          planId: selectedPlan,
          paymentMethodId: paymentMethod.id,
        }),
      });

      if (!subscriptionResponse.ok) {
        throw new Error('Failed to create subscription');
      }

      const subscriptionData = await subscriptionResponse.json();
      console.log('Subscription created:', subscriptionData);

      // Step 4: Confirm payment if needed
      if (subscriptionData.clientSecret) {
        const { error: confirmError } = await stripe.confirmCardPayment(subscriptionData.clientSecret);
        if (confirmError) {
          throw new Error(confirmError.message);
        }
      }

      setSuccess(true);
      onSuccess(subscriptionData);

    } catch (err) {
      console.error('Payment error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const planInfo = STRIPE_CONFIG.plans[selectedPlan as keyof typeof STRIPE_CONFIG.plans];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold">Complete Your Subscription</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-500 mb-2">Payment Successful!</h3>
              <p className="text-base-content/70 mb-4">
                Your {planInfo?.name} subscription is now active.
              </p>
              <Button onClick={onClose} className="w-full">
                Continue to App
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">{planInfo?.name} Plan</h3>
                <p className="text-base-content/70">
                  ${planInfo?.price ? (planInfo.price / 100).toFixed(2) : '0.00'} 
                  {planInfo?.interval && ` per ${planInfo.interval}`}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Card Information
                </label>
                <div className="p-3 border border-base-300 rounded-lg bg-base-100">
                  <CardElement options={cardElementOptions} />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-error text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={!stripe || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Subscribe to ${planInfo?.name} Plan`
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function StripePaymentForm(props: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
}

'use client';

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { CreditCard, Lock, Loader2 } from 'lucide-react';
import { Button } from '../legacy/ui/Button';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface WorkingStripeFormProps {
  selectedPlan: string;
  email: string;
  userId: string;
  onSuccess: (paymentData: any) => void;
  onError: (error: string) => void;
}

export default function WorkingStripeForm({ selectedPlan, email, userId, onSuccess, onError }: WorkingStripeFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    setExpiryDate(value);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCvv(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cardNumber || !expiryDate || !cvv || !cardName) {
      setError('Please fill in all card details');
      return;
    }

    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    if (cleanCardNumber.length !== 16) {
      setError('Card number must be 16 digits');
      return;
    }

    if (!expiryDate.includes('/') || expiryDate.length !== 5) {
      setError('Expiry date must be in MM/YY format');
      return;
    }

    if (cvv.length < 3 || cvv.length > 4) {
      setError('CVV must be 3-4 digits');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

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

      const responseData = await response.json();
      console.log('API Response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create payment intent');
      }

      const { clientSecret } = responseData;

      if (!clientSecret) {
        throw new Error('No client secret received from server');
      }

      // For trial, we don't need to process payment
      if (selectedPlan === 'trial') {
        onSuccess({
          plan: selectedPlan,
          paymentDate: new Date().toISOString(),
          trial: true
        });
        return;
      }

      // For paid plans, confirm payment using the correct Stripe method
      console.log('Confirming payment with Stripe...');
      
      const expiryParts = expiryDate.split('/');
      const expMonth = parseInt(expiryParts[0], 10);
      const expYear = parseInt('20' + expiryParts[1], 10);
      
      if (isNaN(expMonth) || isNaN(expYear)) {
        throw new Error('Invalid expiry date format');
      }

      // Use confirmPayment instead of confirmCardPayment
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        clientSecret: clientSecret,
        confirmParams: {
          payment_method_data: {
            type: 'card',
            card: {
              number: cleanCardNumber,
              exp_month: expMonth,
              exp_year: expYear,
              cvc: cvv,
            },
            billing_details: {
              name: cardName,
              email: email,
            },
          },
        },
      });

      console.log('Stripe response:', { stripeError, paymentIntent });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess({
          plan: selectedPlan,
          paymentDate: new Date().toISOString(),
          paymentIntentId: paymentIntent.id,
        });
      } else {
        throw new Error('Payment was not successful');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      const errorMessage = err.message || 'Payment failed. Please try again.';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Lock className="w-4 h-4" />
          <span>Your payment information is secure and encrypted</span>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Cardholder Name
            </label>
            <input
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Card Number
            </label>
            <input
              type="text"
              value={cardNumber}
              onChange={handleCardNumberChange}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Expiry Date
              </label>
              <input
                type="text"
                value={expiryDate}
                onChange={handleExpiryChange}
                placeholder="MM/YY"
                maxLength={5}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                CVV
              </label>
              <input
                type="text"
                value={cvv}
                onChange={handleCvvChange}
                placeholder="123"
                maxLength={4}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading}
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
          </>
        )}
      </Button>
    </form>
  );
}

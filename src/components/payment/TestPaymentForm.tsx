'use client';

import React, { useState } from 'react';
import { CreditCard, Lock, Loader2, Check } from 'lucide-react';
import { Button } from '../legacy/ui/Button';

interface TestPaymentFormProps {
  selectedPlan: string;
  email: string;
  userId: string;
  onSuccess: (paymentData: any) => void;
  onError: (error: string) => void;
}

export default function TestPaymentForm({ selectedPlan, email, userId, onSuccess, onError }: TestPaymentFormProps) {
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
      // Simulate payment processing
      console.log('Processing payment...', {
        plan: selectedPlan,
        email: email,
        cardNumber: cleanCardNumber,
        expiryDate: expiryDate,
        cvv: cvv,
        cardName: cardName
      });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // For now, just simulate success
      onSuccess({
        plan: selectedPlan,
        paymentDate: new Date().toISOString(),
        trial: selectedPlan === 'trial'
      });

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
          <span>Test payment form - no real charges</span>
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
            <Check className="w-4 h-4 mr-2" />
            {selectedPlan === 'trial' ? 'Start Free Trial' : `Subscribe for $${selectedPlan === 'monthly' ? '5/month' : '30/year'}`}
          </>
        )}
      </Button>
    </form>
  );
}

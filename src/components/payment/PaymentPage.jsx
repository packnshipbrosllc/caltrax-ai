import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Clock, DollarSign, Calendar, Zap, X } from 'lucide-react';
import { Button } from '../legacy/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../legacy/ui/Card';
import StripePaymentForm from './stripe-payment-form';

export default function PaymentPage({ onSuccess, onCancel }) {
  const [selectedPlan, setSelectedPlan] = useState('trial');
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const plans = [
    {
      id: 'trial',
      name: 'Free Trial',
      price: '$0',
      period: '3 days',
      description: 'Full access to all features',
      features: ['Unlimited food analysis', 'Real-time nutrition tracking', 'Health scoring', 'Voice feedback', 'Macro tracking', 'Personalized meal plans', 'Personalized workout plans'],
      popular: false,
      trial: true
    },
    {
      id: 'monthly',
      name: 'Monthly',
      price: '$5',
      period: 'per month',
      description: 'Perfect for trying out',
      features: ['Everything in trial', 'Priority support', 'Advanced analytics', 'Export data', 'Personalized meal plans', 'Personalized workout plans'],
      popular: true,
      trial: false
    },
    {
      id: 'yearly',
      name: 'Yearly',
      price: '$30',
      period: 'per year',
      description: 'Best value - Save 50%',
      originalPrice: '$60',
      features: ['Everything in monthly', 'Premium insights', 'Custom goals', 'API access', 'Personalized meal plans', 'Personalized workout plans'],
      popular: false,
      trial: false
    }
  ];

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
  };

  const handleContinue = () => {
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = (data) => {
    console.log('Payment successful:', data);
    onSuccess(data);
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    setShowPaymentForm(false);
  };

  if (showPaymentForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setShowPaymentForm(false)}
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
              Back to Plans
            </button>
            <h1 className="text-2xl font-bold">Complete Your Subscription</h1>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Selected Plan Summary */}
            <div>
              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const plan = plans.find(p => p.id === selectedPlan);
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{plan.name}</h3>
                            <p className="text-sm text-zinc-400">{plan.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{plan.price}</div>
                            <div className="text-sm text-zinc-400">{plan.period}</div>
                          </div>
                        </div>
                        <div className="border-t border-zinc-700 pt-4">
                          <div className="flex items-center justify-between text-lg font-semibold">
                            <span>Total</span>
                            <span>{plan.price}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>

            {/* Payment Form */}
            <div>
              <StripePaymentForm
                selectedPlan={selectedPlan}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold">Choose Your Plan</h1>
          </motion.div>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Start your journey to better nutrition with AI-powered food analysis
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative ${plan.popular ? 'md:-mt-4' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <Card 
                className={`cursor-pointer transition-all duration-300 ${
                  selectedPlan === plan.id
                    ? 'border-blue-500 bg-blue-500/10 scale-105'
                    : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                } ${plan.popular ? 'ring-2 ring-blue-500/20' : ''}`}
                onClick={() => handlePlanSelect(plan.id)}
              >
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    {selectedPlan === plan.id && (
                      <Check className="w-5 h-5 text-blue-500 mr-2" />
                    )}
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                  </div>
                  <div className="space-y-1">
                    <div className="text-4xl font-bold">
                      {plan.price}
                      {plan.originalPrice && (
                        <span className="text-lg text-zinc-400 line-through ml-2">
                          {plan.originalPrice}
                        </span>
                      )}
                    </div>
                    <div className="text-zinc-400">{plan.period}</div>
                    <p className="text-sm text-zinc-300">{plan.description}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-zinc-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <Button
            onClick={handleContinue}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg px-8 py-4"
          >
            Continue to Payment
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-zinc-400">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>Secure payment</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

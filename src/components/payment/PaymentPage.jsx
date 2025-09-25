import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Clock, Camera, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '../legacy/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../legacy/ui/Card';
import WorkingStripeForm from './WorkingStripeForm';
import { hasUsedTrial, getUserByClerkId } from '@/lib/database';

export default function PaymentPage({ onSuccess, onCancel, user }) {
  const [selectedPlan, setSelectedPlan] = useState('trial');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [trialUsed, setTrialUsed] = useState(false);
  const [userData, setUserData] = useState(null);
  const [checkingTrial, setCheckingTrial] = useState(true);
  
  // Get email and user ID from Clerk user
  const email = user?.emailAddresses?.[0]?.emailAddress || user?.primaryEmailAddress?.emailAddress || '';
  const userId = user?.id || '';

  // Check if user has used trial before
  useEffect(() => {
    const checkTrialStatus = async () => {
      if (!email) return;
      
      try {
        setCheckingTrial(true);
        
        // Check if email has used trial
        const hasUsed = await hasUsedTrial(email);
        setTrialUsed(hasUsed);
        
        // If trial used, force them to select a paid plan
        if (hasUsed) {
          setSelectedPlan('monthly');
        }
        
        // Get existing user data
        const existingUser = await getUserByClerkId(userId);
        setUserData(existingUser);
        
      } catch (error) {
        console.error('Error checking trial status:', error);
        // Default to allowing trial if check fails
        setTrialUsed(false);
      } finally {
        setCheckingTrial(false);
      }
    };

    checkTrialStatus();
  }, [email, userId]);

  const plans = [
    {
      id: 'trial',
      name: 'Free Trial',
      price: '$0',
      period: '3 days',
      description: 'Try CalTrax AI for free',
      features: ['Unlimited food analysis', 'Real-time nutrition tracking', 'Health scoring', 'Voice feedback', 'Macro tracking', 'Personalized meal plans', 'Personalized workout plans'],
      popular: false,
      trial: true,
      disabled: trialUsed
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

  const handlePaymentSuccess = (paymentData) => {
    console.log('Payment successful:', paymentData);
    onSuccess(paymentData);
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    setError(error);
  };

  if (checkingTrial) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-zinc-300">Checking your account...</p>
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
              <Camera className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Choose Your Plan</h1>
          </motion.div>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Start your journey with AI-powered nutrition tracking. All plans include our core features.
          </p>
        </div>

        {/* Trial Used Warning */}
        {trialUsed && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-orange-900/20 border border-orange-500/50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <div>
                <h3 className="font-semibold text-orange-300">Trial Already Used</h3>
                <p className="text-orange-200 text-sm">
                  You've already used your free trial. Please select a paid plan to continue.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative ${plan.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={() => {
                if (!plan.disabled) {
                  console.log('Selecting plan:', plan.id);
                  setSelectedPlan(plan.id);
                }
              }}
            >
              <Card className={`bg-zinc-800/50 border-zinc-700 transition-all duration-300 ${
                selectedPlan === plan.id 
                  ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/50' 
                  : plan.disabled 
                    ? 'border-zinc-600' 
                    : 'hover:border-zinc-500'
              } ${plan.popular ? 'ring-2 ring-blue-500/50' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                {selectedPlan === plan.id && (
                  <div className="absolute -top-3 right-4">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
                {plan.disabled && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Already Used
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-zinc-400 ml-1">{plan.period}</span>
                  </div>
                  {plan.originalPrice && (
                    <div className="text-sm text-zinc-500 line-through">
                      {plan.originalPrice}
                    </div>
                  )}
                  <p className="text-zinc-400 text-sm mt-2">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Payment Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-md mx-auto"
        >
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-center text-2xl">Complete Your Subscription</CardTitle>
              <div className="text-center text-sm text-zinc-400">
                Signed in as: {email}
              </div>
              <div className="text-center text-sm text-blue-400 mt-2">
                Selected Plan: {plans.find(p => p.id === selectedPlan)?.name} - {plans.find(p => p.id === selectedPlan)?.price}/{plans.find(p => p.id === selectedPlan)?.period}
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <WorkingStripeForm
                selectedPlan={selectedPlan}
                email={email}
                userId={userId}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />

              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-8 text-center text-sm text-zinc-400"
        >
          <p>🔒 Your payment information is secure and encrypted</p>
          <p className="mt-1">Powered by Stripe • Cancel anytime</p>
        </motion.div>
      </div>
    </div>
  );
}
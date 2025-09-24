'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Zap, Camera } from 'lucide-react';
import { Button } from '@/components/legacy/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/legacy/ui/Card';
import StripePaymentForm from '@/components/payment/stripe-payment-form';
import Link from 'next/link';
import { useState } from 'react';

const plans = [
  {
    name: 'Trial',
    price: 'Free',
    period: '3 days',
    description: 'Try CalTrax risk-free',
    features: [
      'Full calorie tracking',
      'Macro breakdown',
      'Food database access',
      'Basic meal planning',
      'Mobile app access'
    ],
    cta: 'Start Free Trial',
    popular: false,
    href: '/auth/signup'
  },
  {
    name: 'Monthly',
    price: '$5.00',
    period: 'per month',
    description: 'Perfect for getting started',
    features: [
      'Everything in Trial',
      'Advanced meal planning',
      'Workout plan generation',
      'Progress analytics',
      'Priority support',
      'Export data'
    ],
    cta: 'Get Started',
    popular: true,
    href: '/auth/signup'
  },
  {
    name: 'Yearly',
    price: '$79.99',
    period: 'per year',
    description: 'Best value for committed users',
    features: [
      'Everything in Monthly',
      '2 months free',
      'Premium features',
      'Advanced analytics',
      'Custom meal plans',
      'Personal nutritionist chat'
    ],
    cta: 'Save 33%',
    popular: false,
    href: '/auth/signup'
  }
];

export default function PricingPage() {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');

  const handlePlanSelect = (planName: string) => {
    setSelectedPlan(planName);
    setShowPaymentForm(true);
    // In a real app, you'd get these from the authenticated user
    setUserEmail('user@example.com');
    setUserName('User Name');
    setUserId('user_123');
  };

  const handlePaymentSuccess = (subscription: any) => {
    console.log('Payment successful:', subscription);
    setShowPaymentForm(false);
    // Redirect to dashboard or show success message
    window.location.href = '/dashboard';
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    // Show error message to user
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
      {/* Header */}
      <nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-bold text-white flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <span>CalTrax AI</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/auth/signin">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-zinc-300 mb-8 max-w-3xl mx-auto">
              Choose the plan that works best for your fitness journey. 
              Start with our free trial and upgrade when you're ready.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className={`bg-zinc-800/50 border border-zinc-700 relative ${plan.popular ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      Most Popular
                    </div>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold text-white">
                    {plan.name}
                  </CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-white">
                      {plan.price}
                    </span>
                    <span className="text-zinc-300 ml-2">
                      {plan.period}
                    </span>
                  </div>
                  <p className="text-zinc-300 mt-2">
                    {plan.description}
                  </p>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <span className="text-zinc-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {plan.name === 'Trial' ? (
                    <Link href={plan.href} className="block">
                      <Button 
                        className={`w-full ${plan.popular ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700' : 'border-white text-white hover:bg-white hover:text-gray-900'}`}
                        size="lg"
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      className={`w-full ${plan.popular ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700' : 'border-white text-white hover:bg-white hover:text-gray-900'}`}
                      size="lg"
                      onClick={() => handlePlanSelect(plan.name.toLowerCase())}
                    >
                      {plan.cta}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-zinc-900/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Everything you need to succeed
            </h2>
            <p className="text-lg text-zinc-300">
              Powerful features designed to help you reach your fitness goals
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                AI-Powered Tracking
              </h3>
              <p className="text-zinc-300">
                Smart calorie and macro tracking with barcode scanning and food recognition
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Personalized Plans
              </h3>
              <p className="text-zinc-300">
                Custom meal and workout plans tailored to your goals and preferences
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Progress Analytics
              </h3>
              <p className="text-zinc-300">
                Detailed insights and trends to help you stay on track and motivated
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to start your fitness journey?
          </h2>
          <p className="text-lg text-zinc-300 mb-8">
            Join thousands of users who are already achieving their goals with CalTrax
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 w-full sm:w-auto">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-gray-900 w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <StripePaymentForm
          selectedPlan={selectedPlan}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onClose={() => setShowPaymentForm(false)}
          userEmail={userEmail}
          userName={userName}
          userId={userId}
        />
      )}
    </div>
  );
}
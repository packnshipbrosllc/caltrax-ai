import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Clock, Camera, Loader2 } from 'lucide-react';
import { Button } from '../legacy/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../legacy/ui/Card';

export default function PaymentPage({ onSuccess, onCancel }) {
  const [selectedPlan, setSelectedPlan] = useState('trial');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For now, just mark as successful
      console.log('Signup successful:', { email, selectedPlan });
      onSuccess({ email, plan: selectedPlan });
    } catch (err) {
      setError('Signup failed. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
      {/* Navigation */}
      <nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">CalTrax AI</span>
            </div>
            <Button 
              onClick={onCancel}
              variant="outline" 
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            Choose Your{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              CalTrax AI
            </span>{' '}
            Plan
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-zinc-300 max-w-2xl mx-auto"
          >
            Start your journey to better nutrition with our AI-powered food analysis
          </motion.p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative ${plan.popular ? 'scale-105' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              <Card 
                className={`cursor-pointer transition-all duration-300 bg-zinc-800/50 border-zinc-700 ${
                  selectedPlan === plan.id 
                    ? 'ring-2 ring-blue-500 bg-zinc-800/70' 
                    : 'hover:bg-zinc-800/70'
                } ${plan.popular ? 'border-blue-500/50' : ''}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold text-white">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-zinc-400 ml-2">{plan.period}</span>
                    {plan.originalPrice && (
                      <div className="text-sm text-zinc-500 line-through mt-1">
                        {plan.originalPrice}/year
                      </div>
                    )}
                  </div>
                  <p className="text-zinc-400 mt-2">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center">
                        <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                        <span className="text-zinc-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {plan.trial && (
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="flex items-center text-blue-400 text-sm">
                        <Clock className="w-4 h-4 mr-2" />
                        Free for 3 days, then auto-billing
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Signup Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-md mx-auto"
        >
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-center text-2xl">Create Your Account</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Create a password"
                  />
                </div>

                {/* Credit Card Information - Required for all plans */}
                <div className="space-y-4 pt-4 border-t border-zinc-700">
                  <h3 className="text-lg font-semibold text-zinc-200">Payment Information</h3>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Cardholder Name
                      </label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Card Number
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
                          setCardNumber(value);
                        }}
                        required={selectedPlan !== 'trial'}
                        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
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
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').replace(/(.{2})/, '$1/');
                            setExpiryDate(value);
                          }}
                          required={selectedPlan !== 'trial'}
                          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="MM/YY"
                          maxLength="5"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          CVV
                        </label>
                        <input
                          type="text"
                          value={cvv}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            setCvv(value);
                          }}
                          required={selectedPlan !== 'trial'}
                          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="123"
                          maxLength="4"
                        />
                      </div>
                    </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg py-3"
                >
                  {isLoading ? (
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
        </motion.div>
      </div>
    </div>
  );
}

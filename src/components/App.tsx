'use client';

import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { SignIn, SignUp } from '@clerk/nextjs';
import { HeroSection } from './landing/hero-section';
import UserProfile from './legacy/UserProfile';
import MacroDashboard from './legacy/MacroDashboard';
import FoodLensDemo from './legacy/FoodLensDemo';
import ManualFoodInput from './legacy/ManualFoodInput';
import BarcodeScanner from './legacy/BarcodeScanner';
import { StripePaymentForm } from './payment/stripe-payment-form';
import SubscriptionManagement from './legacy/SubscriptionManagement';
import { secureStorage, hasAdminAccess } from '../lib/security';
import { simpleStorage } from '../lib/simpleStorage';
import { authService } from '../services/authService';

function App() {
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();
  const [currentView, setCurrentView] = useState('landing');
  const [isLoading, setIsLoading] = useState(true);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [showSubscriptionManagement, setShowSubscriptionManagement] = useState(false);

  // Initialize app when Clerk user state changes
  useEffect(() => {
    if (!isLoaded) {
      setIsLoading(true);
      return;
    }

    console.log('🔍 Clerk user state changed:', { user: !!user, isLoaded });

    if (user) {
      // User is signed in with Clerk
      console.log('User signed in with Clerk:', user);
      
      // Check if profile is completed
      const storedProfile = simpleStorage.getItem('caltrax-profile');
      if (storedProfile) {
        console.log('Profile completed, going to dashboard');
        setProfileCompleted(true);
        setCurrentView('dashboard');
      } else {
        console.log('Profile not completed, going to profile setup');
        setCurrentView('profile');
      }
    } else {
      // User is not signed in
      console.log('User not signed in, staying on landing page');
      setCurrentView('landing');
    }

    setIsLoading(false);
  }, [user, isLoaded]);

  const handleSignUp = (userData) => {
    console.log('Handling sign up:', userData);
    const mockUser = {
      id: 'mock-user-' + Date.now(),
      email: userData.email || 'test@example.com',
      name: userData.name || 'Test User',
      profile: null
    };
    setUser(mockUser);
    simpleStorage.setItem('caltrax-user', mockUser);
    setCurrentView('profile');
  };

  const handleSignIn = (userData) => {
    console.log('Handling sign in:', userData);
    const mockUser = {
      id: 'mock-user-' + Date.now(),
      email: userData.email || 'test@example.com',
      name: userData.name || 'Test User',
      profile: userData.profile || null
    };
    setUser(mockUser);
    simpleStorage.setItem('caltrax-user', mockUser);
    
    if (mockUser.profile) {
      setProfileCompleted(true);
      setCurrentView('dashboard');
    } else {
      setCurrentView('profile');
    }
  };

  const handleProfileComplete = (profile) => {
    console.log('Profile completed:', profile);
    const updatedUser = { ...user, profile };
    // setUser(updatedUser); // Clerk manages user state
    simpleStorage.setItem('caltrax-user', updatedUser);
    simpleStorage.setItem('caltrax-profile', profile);
    setProfileCompleted(true);
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    console.log('Logging out...');
    await signOut();
    simpleStorage.removeItem('caltrax-user');
    simpleStorage.removeItem('caltrax-profile');
    setProfileCompleted(false);
    setCurrentView('landing');
  };

  const handleAdminAccess = () => {
    if (hasAdminAccess(user?.email)) {
      setCurrentView('admin');
    } else {
      setShowAdminLogin(true);
    }
  };

  const handleAdminLogin = () => {
    setShowAdminLogin(false);
    setCurrentView('admin');
  };

  const handleCloseSubscriptionManagement = () => {
    setShowSubscriptionManagement(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      {currentView === 'landing' && (
        <HeroSection 
          onGetStarted={() => setCurrentView('signup')}
          onSignIn={() => setCurrentView('signin')}
          onPricing={() => window.location.href = '/pricing'}
        />
      )}
      
      {currentView === 'signup' && (
        <div className="min-h-screen flex items-center justify-center bg-base-100">
          <div className="w-full max-w-md">
            <SignUp 
              routing="hash"
              afterSignUpUrl="/"
              afterSignInUrl="/"
            />
          </div>
        </div>
      )}
      
      {currentView === 'signin' && (
        <div className="min-h-screen flex items-center justify-center bg-base-100">
          <div className="w-full max-w-md">
            <SignIn 
              routing="hash"
              afterSignInUrl="/"
              afterSignUpUrl="/"
            />
          </div>
        </div>
      )}
      
      {currentView === 'profile' && (
        <UserProfile 
          onComplete={handleProfileComplete}
          user={user}
        />
      )}
      
      {currentView === 'dashboard' && (
        <MacroDashboard 
          onBack={() => setCurrentView('landing')}
          onAddFood={() => setCurrentView('app')}
          onShowMealPlan={() => setCurrentView('mealplan')}
          onShowWorkout={() => setCurrentView('workout')}
          user={user}
        />
      )}
      
      {currentView === 'app' && (
        <FoodLensDemo 
          onBack={() => setCurrentView('dashboard')}
          onFoodAdded={() => setCurrentView('dashboard')}
        />
      )}
      
      {currentView === 'mealplan' && (
        <div className="min-h-screen flex items-center justify-center bg-base-100">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Meal Plan Generator</h1>
            <p className="text-base-content/70 mb-4">AI-powered meal planning coming soon!</p>
            <button 
              onClick={() => setCurrentView('dashboard')}
              className="btn btn-primary"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
      
      {currentView === 'workout' && (
        <div className="min-h-screen flex items-center justify-center bg-base-100">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Workout Plan Generator</h1>
            <p className="text-base-content/70 mb-4">AI-powered workout planning coming soon!</p>
            <button 
              onClick={() => setCurrentView('dashboard')}
              className="btn btn-primary"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showSubscriptionManagement && (
        <SubscriptionManagement 
          onClose={handleCloseSubscriptionManagement}
          user={user}
        />
      )}
    </div>
  );
}

export default App;
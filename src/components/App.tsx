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
import { secureStorage, hasAdminAccess, clearAllCalTraxData } from '../lib/security';
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
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  // Check subscription status
  const checkSubscriptionStatus = async (userId) => {
    try {
      setSubscriptionLoading(true);
      console.log('🔍 Checking subscription status for user:', userId);
      
      // Check if user has completed payment/subscription
      // For now, we'll check if user has a profile (indicating they've completed payment + setup)
      // In production, this would check Stripe subscription status
      const clerkProfile = user?.publicMetadata?.caltraxProfile;
      const storedProfile = simpleStorage.getItem('caltrax-profile');
      const hasCompletedSetup = !!(clerkProfile || storedProfile);
      
      // TEMPORARILY: Allow access without payment for testing
      // In production, this should check Stripe subscription status
      console.log('🔍 TEMPORARY: Allowing access without payment for testing');
      setHasActiveSubscription(true);
      return true;
      
      // PRODUCTION CODE (commented out for now):
      // if (hasCompletedSetup) {
      //   console.log('✅ User has completed setup - allowing access');
      //   setHasActiveSubscription(true);
      //   return true;
      // } else {
      //   console.log('❌ User needs to complete payment and setup');
      //   setHasActiveSubscription(false);
      //   return false;
      // }
    } catch (error) {
      console.error('❌ Error checking subscription status:', error);
      setHasActiveSubscription(false);
      return false;
    } finally {
      setSubscriptionLoading(false);
    }
  };

  // Handle decryption errors and clear corrupted data
  useEffect(() => {
    const handleStorageError = (e) => {
      if (e.message && e.message.includes('Decryption error')) {
        console.warn('🚨 Decryption error detected, clearing all data');
        clearAllCalTraxData();
        setCurrentView('landing');
        setProfileCompleted(false);
        setHasActiveSubscription(false);
      }
    };

    // Listen for unhandled errors
    window.addEventListener('error', handleStorageError);
    
    return () => {
      window.removeEventListener('error', handleStorageError);
    };
  }, []);

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
          console.log('User publicMetadata:', user.publicMetadata);
          
          // Check subscription status first
          checkSubscriptionStatus(user.id).then((hasSubscription) => {
            if (hasSubscription) {
              // Check if profile is completed in Clerk metadata or local storage
              const clerkProfile = user.publicMetadata?.caltraxProfile;
              const storedProfile = simpleStorage.getItem('caltrax-profile');
              const profile = clerkProfile || storedProfile;
              
              if (profile) {
                console.log('Profile completed, going to dashboard');
                console.log('Profile data:', profile);
                setProfileCompleted(true);
                setCurrentView('dashboard');
              } else {
                console.log('Profile not completed, going to profile setup');
                setCurrentView('profile');
              }
            } else {
              console.log('No active subscription, going to payment');
              setCurrentView('payment');
            }
          });
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

  const handleProfileComplete = async (profile) => {
    console.log('🔍 === HANDLE PROFILE COMPLETE CALLED ===');
    console.log('Profile completed:', profile);
    console.log('Current user:', user);
    
    try {
      // Update Clerk user metadata with profile data
      if (user) {
        console.log('Updating Clerk user metadata with profile...');
        console.log('Current publicMetadata:', user.publicMetadata);
        console.log('Profile to save:', profile);
        
        const updatedMetadata = {
          ...user.publicMetadata,
          caltraxProfile: profile
        };
        
        console.log('Updated metadata:', updatedMetadata);
        
        await user.update({
          publicMetadata: updatedMetadata
        });
        
        console.log('✅ Profile saved to Clerk user metadata');
        console.log('Verification - user.publicMetadata after update:', user.publicMetadata);
      } else {
        console.log('❌ No user object available for metadata update');
      }
      
      // Also save to local storage as backup
      const updatedUser = { ...user, profile };
      simpleStorage.setItem('caltrax-user', updatedUser);
      simpleStorage.setItem('caltrax-profile', profile);
      
      console.log('Setting profile completed to true');
      setProfileCompleted(true);
      
      // Set subscription as active after profile completion
      setHasActiveSubscription(true);
      
      console.log('Setting current view to dashboard');
      setCurrentView('dashboard');
      
      console.log('🔍 === PROFILE COMPLETE FINISHED ===');
    } catch (error) {
      console.error('❌ Failed to save profile to Clerk:', error);
      // Fallback to local storage
      const updatedUser = { ...user, profile };
      simpleStorage.setItem('caltrax-user', updatedUser);
      simpleStorage.setItem('caltrax-profile', profile);
      setProfileCompleted(true);
      setHasActiveSubscription(true);
      setCurrentView('dashboard');
    }
  };

  const handleLogout = async () => {
    console.log('🔍 === HANDLE LOGOUT CALLED ===');
    console.log('Current user:', user);
    console.log('SignOut function:', signOut);
    console.log('User agent:', navigator.userAgent);
    console.log('Is mobile:', /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    
    try {
      console.log('Calling signOut...');
      if (signOut && typeof signOut === 'function') {
        await signOut();
        console.log('✅ SignOut successful');
      } else {
        console.warn('⚠️ signOut function not available, proceeding with manual logout');
      }
    } catch (error) {
      console.error('❌ SignOut failed:', error);
      console.log('Proceeding with manual logout...');
    }
    
    console.log('Clearing local storage...');
    try {
      // Use the emergency clear function to ensure all data is removed
      clearAllCalTraxData();
      console.log('✅ Storage cleared successfully');
    } catch (storageError) {
      console.error('❌ Error clearing storage:', storageError);
    }
    
    console.log('Resetting app state...');
    setProfileCompleted(false);
    setHasActiveSubscription(false);
    setCurrentView('landing');
    
    console.log('🔍 === LOGOUT COMPLETE ===');
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

  const handlePaymentSuccess = () => {
    console.log('✅ Payment successful, setting subscription as active');
    setHasActiveSubscription(true);
    setCurrentView('profile');
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
      
      {currentView === 'payment' && (
        <div className="min-h-screen flex items-center justify-center bg-base-100">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-4">Complete Your Subscription</h1>
              <p className="text-lg text-base-content/70">
                Start your 3-day free trial and unlock all CalTrax AI features
              </p>
            </div>
            <StripePaymentForm 
              onSuccess={handlePaymentSuccess}
              onCancel={() => setCurrentView('landing')}
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
        <>
          {console.log('🔍 === RENDERING DASHBOARD ===')}
          {console.log('🔍 Dashboard user:', user)}
          {console.log('🔍 Dashboard user profile:', user?.profile)}
          <MacroDashboard 
            onBack={() => setCurrentView('landing')}
            onAddFood={() => setCurrentView('app')}
            onShowMealPlan={() => setCurrentView('mealplan')}
            onShowWorkout={() => setCurrentView('workout')}
            onLogout={handleLogout}
            onShowSubscriptionManagement={() => setShowSubscriptionManagement(true)}
            user={user}
          />
        </>
      )}
      
      {currentView === 'app' && (
        <FoodLensDemo 
          onLogout={handleLogout}
          onShowDashboard={() => setCurrentView('dashboard')}
          onShowMealPlan={() => setCurrentView('mealplan')}
          onShowAdmin={handleAdminAccess}
          onShowSubscriptionManagement={() => setShowSubscriptionManagement(true)}
          user={user}
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
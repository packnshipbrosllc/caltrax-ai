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
import StripePaymentForm from './payment/stripe-payment-form';
import PaymentPage from './payment/PaymentPage.jsx';
import SubscriptionManagement from './legacy/SubscriptionManagement';
import { secureStorage, hasAdminAccess, clearAllCalTraxData } from '../lib/security';
import { simpleStorage } from '../lib/simpleStorage';
import { authService } from '../services/authService';
import { createOrUpdateUser, getUserByClerkId, hasUsedTrial } from '../lib/database';

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
  const [profileCheckAttempts, setProfileCheckAttempts] = useState(0);
  const [debugMode, setDebugMode] = useState(false);

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
      
      // Check if user has completed payment/subscription
      if (hasCompletedSetup) {
        console.log('✅ User has completed setup - allowing access');
        setHasActiveSubscription(true);
        return true;
      } else {
        console.log('❌ User needs to complete payment and setup');
        setHasActiveSubscription(false);
        return false;
      }
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
      // Only handle specific decryption errors, not all errors
      if (e.message && e.message.includes('Decryption error') && e.message.includes('Malformed UTF-8')) {
        console.warn('🚨 Decryption error detected, clearing all data');
        clearAllCalTraxData();
        setCurrentView('landing');
        setProfileCompleted(false);
        setHasActiveSubscription(false);
      } else {
        // Log other errors but don't clear data
        console.warn('⚠️ Error caught but not clearing data:', e.message);
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
    const initializeUser = async () => {
      if (!isLoaded) {
        setIsLoading(true);
        return;
      }

      console.log('🔍 Clerk user state changed:', { user: !!user, isLoaded });

      if (user) {
        // User is signed in with Clerk
        console.log('User signed in with Clerk:', user);
        console.log('User unsafeMetadata:', user.unsafeMetadata);
        
        // Get user data from database
        try {
          const email = user.emailAddresses?.[0]?.emailAddress || user.primaryEmailAddress?.emailAddress || '';
          const userId = user.id;
          
          // Create or get user from database
          const dbUser = await createOrUpdateUser({
            clerk_user_id: userId,
            email: email,
            has_paid: false, // Will be updated by payment
            plan: null,
            payment_date: null,
            trial_used: false,
            trial_start_date: null,
            profile_data: user.unsafeMetadata?.caltraxProfile || null
          });
          
          console.log('Database user:', dbUser);
          
          // Check payment status from database
          const hasPaid = dbUser?.has_paid || false;
          const plan = dbUser?.plan;
          const trialUsed = dbUser?.trial_used || false;
          
          console.log('🔍 Payment check from database:');
          console.log('  - hasPaid:', hasPaid);
          console.log('  - plan:', plan);
          console.log('  - trialUsed:', trialUsed);
          
          // Check if user has completed payment first
          if (hasPaid) {
            // User has paid, check if profile is completed
            const profile = dbUser?.profile_data || user.unsafeMetadata?.caltraxProfile;
            
            console.log('🔍 Profile check:');
            console.log('  - profile from database:', dbUser?.profile_data);
            console.log('  - profile from Clerk:', user.unsafeMetadata?.caltraxProfile);
            console.log('  - final profile:', profile);
            console.log('  - profile has calories:', profile?.calories);
            
            // Simple profile check - if we have calories, we have a profile
            if (profile && profile.calories) {
              console.log('✅ Profile found with calories:', profile.calories);
              setProfileCompleted(true);
              setCurrentView('dashboard');
            } else {
              console.log('❌ No profile found, going to profile setup');
              setCurrentView('profile');
            }
          } else {
            console.log('❌ User has not paid, going to payment');
            setCurrentView('payment');
          }
        } catch (error) {
          console.error('❌ Error checking user data:', error);
          // Fallback to payment page if database check fails
          setCurrentView('payment');
        }
      } else {
        // User is not signed in
        console.log('User not signed in, staying on landing page');
        setCurrentView('landing');
      }

      setIsLoading(false);
    };

    initializeUser();
  }, [user, isLoaded]);

  const handleSignUp = (userData: any) => {
    console.log('Handling sign up:', userData);
    const mockUser = {
      id: 'mock-user-' + Date.now(),
      email: userData.email || 'test@example.com',
      name: userData.name || 'Test User',
      profile: null
    };
    simpleStorage.setItem('caltrax-user', mockUser);
    setCurrentView('profile');
  };

  const handleSignIn = (userData: any) => {
    console.log('Handling sign in:', userData);
    const mockUser = {
      id: 'mock-user-' + Date.now(),
      email: userData.email || 'test@example.com',
      name: userData.name || 'Test User',
      profile: userData.profile || null
    };
    simpleStorage.setItem('caltrax-user', mockUser);
    
    if (mockUser.profile) {
      setProfileCompleted(true);
      setCurrentView('dashboard');
    } else {
      setCurrentView('profile');
    }
  };

  const handleProfileComplete = async (profile: any) => {
    console.log('🔍 === HANDLE PROFILE COMPLETE CALLED ===');
    console.log('Profile completed:', profile);
    console.log('Current user:', user);
    
    try {
      // Update database with profile data
      if (user) {
        const email = user.emailAddresses?.[0]?.emailAddress || user.primaryEmailAddress?.emailAddress || '';
        const userId = user.id;
        
        console.log('Updating database with profile...');
        await createOrUpdateUser({
          clerk_user_id: userId,
          email: email,
          profile_data: profile,
          // Keep existing payment status
        });
        
        console.log('✅ Profile saved to database');
        
        // Also update Clerk metadata as backup
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            caltraxProfile: profile
          }
        });
        
        console.log('✅ Profile saved to Clerk metadata');
      }
      
      // Also save to local storage as backup
      const updatedUser = { ...user, profile };
      simpleStorage.setItem('caltrax-user', updatedUser);
      simpleStorage.setItem('caltrax-profile', profile);
      
      console.log('✅ Profile saved to local storage');
      setProfileCompleted(true);
      setHasActiveSubscription(true);
      setCurrentView('dashboard');
      
      console.log('🔍 === PROFILE COMPLETE FINISHED ===');
    } catch (error) {
      console.error('❌ Failed to save profile:', error);
      // Fallback to local storage
      const updatedUser = { ...user, profile };
      simpleStorage.setItem('caltrax-user', updatedUser);
      simpleStorage.setItem('caltrax-profile', profile);
      
      console.log('✅ Profile saved to local storage (fallback)');
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
    
    console.log('Clearing session data (but keeping payment status)...');
    try {
      // Clear session data but preserve payment status
      const paymentStatus = simpleStorage.getItem('caltrax-has-paid');
      const profileData = simpleStorage.getItem('caltrax-profile');
      
      // Clear all data first
      clearAllCalTraxData();
      
      // Restore payment status and profile data
      if (paymentStatus) {
        simpleStorage.setItem('caltrax-has-paid', paymentStatus);
        console.log('✅ Payment status preserved');
      }
      if (profileData) {
        simpleStorage.setItem('caltrax-profile', profileData);
        console.log('✅ Profile data preserved');
      }
      
      console.log('✅ Session data cleared, payment status preserved');
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

  const handlePaymentSuccess = async (paymentData: any) => {
    console.log('✅ Payment successful, setting subscription as active');
    console.log('Payment data:', paymentData);
    
    // Update database with payment status
    if (user) {
      try {
        const email = user.emailAddresses?.[0]?.emailAddress || user.primaryEmailAddress?.emailAddress || '';
        const userId = user.id;
        
        console.log('💾 Saving payment to database...');
        await createOrUpdateUser({
          clerk_user_id: userId,
          email: email,
          has_paid: true,
          plan: paymentData?.plan || 'trial',
          payment_date: new Date().toISOString(),
          trial_used: paymentData?.plan === 'trial',
          trial_start_date: paymentData?.plan === 'trial' ? new Date().toISOString() : null,
        });
        
        console.log('✅ Payment status saved to database');
        
        // Also update Clerk metadata as backup
        console.log('💾 Saving payment to Clerk metadata...');
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            hasPaid: true,
            paymentDate: new Date().toISOString(),
            plan: paymentData?.plan || 'trial'
          }
        });
        
        console.log('✅ Payment status saved to Clerk metadata');
      } catch (error) {
        console.error('❌ Failed to save payment status:', error);
        // Continue anyway - we have local storage backup
      }
    }
    
    // Also save to local storage as backup
    console.log('💾 Saving payment to local storage...');
    simpleStorage.setItem('caltrax-has-paid', true);
    simpleStorage.setItem('caltrax-payment-date', new Date().toISOString());
    simpleStorage.setItem('caltrax-plan', paymentData?.plan || 'trial');
    
    console.log('✅ Payment data saved to all locations');
    
    // Set states
    setHasActiveSubscription(true);
    
    // Add a small delay to ensure database updates are processed
    console.log('⏳ Redirecting to profile in 1 second...');
    setTimeout(() => {
      console.log('🔄 Redirecting to profile page');
      setCurrentView('profile');
    }, 1000);
  };

  // Migrate old profile data from localStorage
  const migrateOldProfileData = () => {
    console.log('🔍 === MIGRATING OLD PROFILE DATA ===');
    
    try {
      // Check for old profile data in localStorage
      const oldUserData = localStorage.getItem('caltrax-user');
      const oldSignedUp = localStorage.getItem('caltrax-signed-up');
      
      console.log('Old user data found:', !!oldUserData);
      console.log('Old signed up:', oldSignedUp);
      
      if (oldUserData) {
        const parsedOldUser = JSON.parse(oldUserData);
        console.log('Parsed old user:', parsedOldUser);
        
        if (parsedOldUser.profile && parsedOldUser.profile.calories) {
          console.log('✅ Found old profile with calories:', parsedOldUser.profile.calories);
          
          // Migrate to new format
          const migratedProfile = {
            ...parsedOldUser.profile,
            migratedAt: new Date().toISOString()
          };
          
          // Save to new storage locations
          simpleStorage.setItem('caltrax-profile', migratedProfile);
          simpleStorage.setItem('caltrax-user', { ...parsedOldUser, profile: migratedProfile });
          simpleStorage.setItem('caltrax-has-paid', true); // Assume old users have paid
          
          console.log('✅ Profile migrated successfully:', migratedProfile);
          
          // Update Clerk metadata if user is available
          if (user) {
            user.update({
              publicMetadata: {
                ...user.publicMetadata,
                caltraxProfile: migratedProfile,
                hasPaid: true
              }
            }).then(() => {
              console.log('✅ Profile saved to Clerk metadata');
            }).catch(err => {
              console.error('❌ Failed to save to Clerk:', err);
            });
          }
          
          // Go to dashboard
          setProfileCompleted(true);
          setCurrentView('dashboard');
          return true;
        }
      }
      
      console.log('❌ No old profile data found to migrate');
      return false;
    } catch (error) {
      console.error('❌ Error migrating old profile data:', error);
      return false;
    }
  };

          // Debug function to check and fix profile data
          const debugProfileData = () => {
            console.log('🔍 === DEBUG PROFILE DATA ===');
            console.log('Current user:', user);
        console.log('User unsafeMetadata:', user?.unsafeMetadata);
        console.log('Clerk profile:', user?.unsafeMetadata?.caltraxProfile);
            console.log('Stored profile:', simpleStorage.getItem('caltrax-profile'));
            console.log('Stored user:', simpleStorage.getItem('caltrax-user'));
            console.log('Profile completed state:', profileCompleted);
            console.log('Current view:', currentView);
            
            // Try to migrate old data first
            const migrated = migrateOldProfileData();
            if (migrated) {
              console.log('✅ Successfully migrated old profile data');
              return;
            }
            
        // Try to find any valid profile data
        const clerkProfile = user?.unsafeMetadata?.caltraxProfile;
            const storedProfile = simpleStorage.getItem('caltrax-profile');
            const userProfile = simpleStorage.getItem('caltrax-user')?.profile;
            
            const validProfile = clerkProfile || storedProfile || userProfile;
            
            if (validProfile && validProfile.calories) {
              console.log('✅ Valid profile found:', validProfile);
              console.log('Profile calories:', validProfile.calories);
              console.log('Profile macros:', validProfile.macros);
              setProfileCompleted(true);
              setCurrentView('dashboard');
            } else {
              console.log('❌ No valid profile found, going to profile setup');
              setCurrentView('profile');
            }
          };

          // Force sync profile data from Clerk
          const forceSyncProfile = async () => {
            console.log('🔄 Force syncing profile from Clerk...');
        if (user?.unsafeMetadata?.caltraxProfile) {
          const profile = user.unsafeMetadata.caltraxProfile;
              console.log('Found profile in Clerk metadata:', profile);
              simpleStorage.setItem('caltrax-profile', profile);
              console.log('✅ Profile synced to storage');
              if (profile.calories) {
                setProfileCompleted(true);
                setCurrentView('dashboard');
              }
            } else {
              console.log('❌ No profile found in Clerk metadata');
            }
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
        <div>
          <HeroSection 
            onGetStarted={() => setCurrentView('signup')}
            onSignIn={() => setCurrentView('signin')}
            onPricing={() => window.location.href = '/pricing'}
          />
          {/* Debug panel */}
          {user && (
            <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs">
              <div className="flex gap-2 mb-2">
                <button 
                  onClick={() => setDebugMode(!debugMode)}
                  className="px-2 py-1 bg-blue-600 rounded text-xs"
                >
                  {debugMode ? 'Hide' : 'Show'} Debug
                </button>
                <button 
                  onClick={debugProfileData}
                  className="px-2 py-1 bg-green-600 rounded text-xs"
                >
                  Check Profile
                </button>
                        <button 
                          onClick={migrateOldProfileData}
                          className="px-2 py-1 bg-purple-600 rounded text-xs"
                        >
                          Migrate Old
                        </button>
                        <button 
                          onClick={forceSyncProfile}
                          className="px-2 py-1 bg-orange-600 rounded text-xs"
                        >
                          Force Sync
                        </button>
              </div>
              {debugMode && (
                <div className="space-y-1">
                  <div>User: {user?.emailAddresses?.[0]?.emailAddress || user?.primaryEmailAddress?.emailAddress || 'Unknown'}</div>
                      <div>Has Profile: {user?.unsafeMetadata?.caltraxProfile ? 'Yes' : 'No'}</div>
                      <div>Calories: {user?.unsafeMetadata?.caltraxProfile?.calories || 'N/A'}</div>
                  <div>View: {currentView}</div>
                </div>
              )}
            </div>
          )}
        </div>
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
        <PaymentPage 
          onSuccess={handlePaymentSuccess}
          onCancel={() => setCurrentView('landing')}
          user={user}
        />
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
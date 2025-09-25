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
import PaymentPage from './payment/PaymentPage';
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

  // Clear any existing payment data to force payment
  useEffect(() => {
    // Clear old payment data to ensure users must pay
    simpleStorage.removeItem('caltrax-has-paid');
    simpleStorage.removeItem('caltrax-payment-date');
    simpleStorage.removeItem('caltrax-plan');
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
          
                  // Check if user has completed payment first - prioritize Clerk metadata
                  const clerkHasPaid = user.publicMetadata?.hasPaid;
                  const storageHasPaid = simpleStorage.getItem('caltrax-has-paid');
                  const hasPaid = clerkHasPaid || storageHasPaid;
                  
                  console.log('🔍 Payment check:');
                  console.log('  - hasPaid from Clerk metadata:', clerkHasPaid);
                  console.log('  - hasPaid from storage:', storageHasPaid);
                  console.log('  - final hasPaid:', hasPaid);
                  console.log('  - user.publicMetadata:', user.publicMetadata);
                  
                  // If we have payment status in Clerk but not in storage, sync it
                  if (clerkHasPaid && !storageHasPaid) {
                    console.log('🔄 Syncing payment status from Clerk to storage');
                    simpleStorage.setItem('caltrax-has-paid', true);
                    if (user.publicMetadata.paymentDate) {
                      simpleStorage.setItem('caltrax-payment-date', user.publicMetadata.paymentDate);
                    }
                    if (user.publicMetadata.plan) {
                      simpleStorage.setItem('caltrax-plan', user.publicMetadata.plan);
                    }
                  }
                  
                  // Also sync profile data from Clerk to storage if needed
                  const clerkProfile = user.publicMetadata?.caltraxProfile;
                  const storedProfile = simpleStorage.getItem('caltrax-profile');
                  if (clerkProfile && !storedProfile) {
                    console.log('🔄 Syncing profile data from Clerk to storage');
                    simpleStorage.setItem('caltrax-profile', clerkProfile);
                  }
          
          // Check if user has completed payment first
          if (hasPaid) {
            // User has paid, check if profile is completed
            const clerkProfile = user.publicMetadata?.caltraxProfile;
            const storedProfile = simpleStorage.getItem('caltrax-profile');
            const profile = clerkProfile || storedProfile;
            
            console.log('🔍 Profile check:');
            console.log('  - clerkProfile:', clerkProfile);
            console.log('  - storedProfile:', storedProfile);
            console.log('  - final profile:', profile);
            console.log('  - profile has calories:', profile?.calories);
            console.log('  - profile has macros:', profile?.macros);
            
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
          // Don't mark as paid here - payment should happen first
        };
        
        console.log('Updated metadata:', updatedMetadata);
        
        await user.update({
          publicMetadata: updatedMetadata
        });
        
        console.log('✅ Profile saved to Clerk user metadata');
        console.log('Verification - user.publicMetadata after update:', user.publicMetadata);
        
        // Force refresh the user data to ensure it's updated
        console.log('🔄 Refreshing user data...');
        await user.reload();
        console.log('✅ User data refreshed');
        console.log('Updated user.publicMetadata:', user.publicMetadata);
        
        // Verify the data was saved
        const verification = user.publicMetadata?.caltraxProfile;
        console.log('🔍 Verification - saved profile:', verification);
        if (verification && verification.calories) {
          console.log('✅ Profile successfully saved with calories:', verification.calories);
        } else {
          console.error('❌ Profile not properly saved to Clerk metadata');
        }
      } else {
        console.log('❌ No user object available for metadata update');
      }
      
      // Also save to local storage as backup - IMMEDIATELY
      const updatedUser = { ...user, profile };
      simpleStorage.setItem('caltrax-user', updatedUser);
      simpleStorage.setItem('caltrax-profile', profile);
      
      // Don't mark as paid here - payment should happen first
      
      console.log('✅ Profile saved to local storage');
      console.log('Setting profile completed to true');
      setProfileCompleted(true);
      
      // Set subscription as active after profile completion
      setHasActiveSubscription(true);
      
      console.log('Setting current view to dashboard');
      setCurrentView('dashboard');
      
      console.log('🔍 === PROFILE COMPLETE FINISHED ===');
    } catch (error) {
      console.error('❌ Failed to save profile to Clerk:', error);
      // Fallback to local storage - this MUST work
      const updatedUser = { ...user, profile };
      simpleStorage.setItem('caltrax-user', updatedUser);
      simpleStorage.setItem('caltrax-profile', profile);
      // Don't mark as paid here - payment should happen first
      
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

  const handlePaymentSuccess = async (paymentData) => {
    console.log('✅ Payment successful, setting subscription as active');
    console.log('Payment data:', paymentData);
    
    // Mark user as having paid in Clerk metadata
    if (user) {
      try {
        const updatedMetadata = {
          ...user.publicMetadata,
          hasPaid: true,
          paymentDate: new Date().toISOString(),
          plan: paymentData?.plan || 'trial'
        };
        
        await user.update({
          publicMetadata: updatedMetadata
        });
        
        // Force refresh user data
        await user.reload();
        
        console.log('✅ Payment status saved to Clerk metadata');
        console.log('Updated metadata:', user.publicMetadata);
      } catch (error) {
        console.error('❌ Failed to save payment status to Clerk:', error);
      }
    }
    
    // Also save to local storage as backup
    simpleStorage.setItem('caltrax-has-paid', true);
    simpleStorage.setItem('caltrax-payment-date', new Date().toISOString());
    simpleStorage.setItem('caltrax-plan', paymentData?.plan || 'trial');
    
    setHasActiveSubscription(true);
    setCurrentView('profile');
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
            console.log('User publicMetadata:', user?.publicMetadata);
            console.log('Clerk profile:', user?.publicMetadata?.caltraxProfile);
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
            const clerkProfile = user?.publicMetadata?.caltraxProfile;
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
            if (user?.publicMetadata?.caltraxProfile) {
              const profile = user.publicMetadata.caltraxProfile;
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
                  <div>Has Profile: {user?.publicMetadata?.caltraxProfile ? 'Yes' : 'No'}</div>
                  <div>Calories: {user?.publicMetadata?.caltraxProfile?.calories || 'N/A'}</div>
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
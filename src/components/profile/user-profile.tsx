'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Target, Scale, Ruler, Calendar, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateMacroGoals, ProfileData, MacroGoals } from '@/lib/macro-calculator';
import { simpleStorage } from '@/lib/storage';

interface UserProfileProps {
  onComplete: (profileData: ProfileData, macroGoals: MacroGoals) => void;
  user: any;
}

export default function UserProfile({ onComplete, user }: UserProfileProps) {
  const [step, setStep] = useState(1);
  const [profileData, setProfileData] = useState<ProfileData>({
    height: 0,
    weight: 0,
    age: 0,
    gender: 'male',
    activityLevel: 'moderate',
    goals: [],
    dietaryRestrictions: []
  });

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentary', description: 'Little to no exercise' },
    { value: 'light', label: 'Lightly Active', description: 'Light exercise 1-3 days/week' },
    { value: 'moderate', label: 'Moderately Active', description: 'Moderate exercise 3-5 days/week' },
    { value: 'very', label: 'Very Active', description: 'Heavy exercise 6-7 days/week' },
    { value: 'extreme', label: 'Extremely Active', description: 'Very heavy exercise, physical job' }
  ];

  const goals = [
    { value: 'build_muscle', label: 'Build Muscle', description: 'Gain lean muscle mass', icon: '💪' },
    { value: 'burn_fat', label: 'Burn Fat', description: 'Lose body fat', icon: '🔥' },
    { value: 'lose_weight', label: 'Lose Weight', description: 'Overall weight loss', icon: '⚖️' },
    { value: 'maintain', label: 'Maintain Weight', description: 'Keep current weight', icon: '⚖️' },
    { value: 'gain_weight', label: 'Gain Weight', description: 'Healthy weight gain', icon: '📈' }
  ];

  const dietaryRestrictions = [
    'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 'Keto', 'Paleo', 'Mediterranean'
  ];

  const handleInputChange = (field: keyof ProfileData, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleGoalToggle = (goal: string) => {
    setProfileData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal) 
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  };

  const handleRestrictionToggle = (restriction: string) => {
    setProfileData(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(restriction)
        ? prev.dietaryRestrictions.filter(r => r !== restriction)
        : [...prev.dietaryRestrictions, restriction]
    }));
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Calculate macro goals
      const macroGoals = calculateMacroGoals(profileData);
      
      // Save profile data
      const userData = {
        ...user,
        profile: {
          ...profileData,
          calories: macroGoals.calories,
          macros: {
            protein: macroGoals.protein,
            fat: macroGoals.fat,
            carbs: macroGoals.carbs
          }
        }
      };
      
      simpleStorage.setItem('caltrax-user', userData);
      simpleStorage.setItem('caltrax-signed-up', true);
      
      onComplete(profileData, macroGoals);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return profileData.height > 0 && profileData.weight > 0 && profileData.age > 0;
      case 2:
        return profileData.gender !== '';
      case 3:
        return profileData.activityLevel !== '';
      case 4:
        return profileData.goals.length > 0;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-base-content mb-2">Basic Information</h2>
              <p className="text-base-content/70">Tell us about yourself to calculate your personalized nutrition goals</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-base-content mb-2">
                  Height (inches)
                </label>
                <input
                  type="number"
                  value={profileData.height || ''}
                  onChange={(e) => handleInputChange('height', parseInt(e.target.value) || 0)}
                  placeholder="67"
                  className="input input-bordered w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-base-content mb-2">
                  Weight (lbs)
                </label>
                <input
                  type="number"
                  value={profileData.weight || ''}
                  onChange={(e) => handleInputChange('weight', parseInt(e.target.value) || 0)}
                  placeholder="150"
                  className="input input-bordered w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-base-content mb-2">
                  Age
                </label>
                <input
                  type="number"
                  value={profileData.age || ''}
                  onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
                  placeholder="25"
                  className="input input-bordered w-full"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-base-content mb-2">Gender</h2>
              <p className="text-base-content/70">This helps us calculate your metabolic rate accurately</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleInputChange('gender', 'male')}
                className={`p-6 rounded-lg border-2 transition-all ${
                  profileData.gender === 'male'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-base-300 hover:border-primary/50'
                }`}
              >
                <div className="text-4xl mb-2">👨</div>
                <div className="font-medium">Male</div>
              </button>
              
              <button
                onClick={() => handleInputChange('gender', 'female')}
                className={`p-6 rounded-lg border-2 transition-all ${
                  profileData.gender === 'female'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-base-300 hover:border-primary/50'
                }`}
              >
                <div className="text-4xl mb-2">👩</div>
                <div className="font-medium">Female</div>
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-base-content mb-2">Activity Level</h2>
              <p className="text-base-content/70">How active are you on a typical day?</p>
            </div>
            
            <div className="space-y-3">
              {activityLevels.map((level) => (
                <button
                  key={level.value}
                  onClick={() => handleInputChange('activityLevel', level.value)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    profileData.activityLevel === level.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-base-300 hover:border-primary/50'
                  }`}
                >
                  <div className="font-medium">{level.label}</div>
                  <div className="text-sm text-base-content/70">{level.description}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-base-content mb-2">Your Goals</h2>
              <p className="text-base-content/70">What do you want to achieve? (Select all that apply)</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.map((goal) => (
                <button
                  key={goal.value}
                  onClick={() => handleGoalToggle(goal.value)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    profileData.goals.includes(goal.value)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-base-300 hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{goal.icon}</span>
                    <div>
                      <div className="font-medium">{goal.label}</div>
                      <div className="text-sm text-base-content/70">{goal.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-medium text-base-content mb-4">Dietary Restrictions (Optional)</h3>
              <div className="flex flex-wrap gap-2">
                {dietaryRestrictions.map((restriction) => (
                  <button
                    key={restriction}
                    onClick={() => handleRestrictionToggle(restriction)}
                    className={`px-3 py-1 rounded-full text-sm transition-all ${
                      profileData.dietaryRestrictions.includes(restriction)
                        ? 'bg-primary text-primary-content'
                        : 'bg-base-200 text-base-content hover:bg-base-300'
                    }`}
                  >
                    {restriction}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="w-6 h-6" />
                Complete Your Profile
              </CardTitle>
              <div className="text-sm text-base-content/70">
                Step {step} of 4
              </div>
            </div>
            <div className="w-full bg-base-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </CardHeader>
          <CardContent>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStep()}
            </motion.div>
            
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 1}
              >
                Back
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={!isStepValid()}
                className="flex items-center gap-2"
              >
                {step === 4 ? 'Complete Profile' : 'Next'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

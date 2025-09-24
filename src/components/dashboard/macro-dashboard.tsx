'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  TrendingUp, 
  BarChart3, 
  Clock, 
  Trash2, 
  Plus,
  ArrowLeft,
  Utensils,
  Dumbbell,
  Camera
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MacroGoals } from '@/lib/macro-calculator';
import { simpleStorage } from '@/lib/storage';
import { getTodayMacros, getWeekMacros, getWeeklyTotals, deleteFoodEntry } from '@/lib/macro-storage-supabase';

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  timestamp: number;
}

interface User {
  profile?: {
    calories: number;
    macros: {
      protein: number;
      fat: number;
      carbs: number;
    };
  };
}

interface MacroDashboardProps {
  onBack: () => void;
  onAddFood: () => void;
  onShowMealPlan: () => void;
  onShowWorkout: () => void;
  user: User | null;
}

// Helper functions
const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const getProgressPercentage = (current: number, goal: number): number => {
  return Math.min((current / goal) * 100, 100);
};

const getProgressColor = (percentage: number): string => {
  if (percentage >= 100) return 'text-green-400';
  if (percentage >= 80) return 'text-yellow-400';
  return 'text-red-400';
};

export default function MacroDashboard({ 
  onBack, 
  onAddFood, 
  onShowMealPlan, 
  onShowWorkout, 
  user 
}: MacroDashboardProps) {
  const [view, setView] = useState<'today' | 'week'>('today');
  const [todayData, setTodayData] = useState<FoodEntry[] | null>(null);
  const [weekData, setWeekData] = useState<FoodEntry[] | null>(null);
  const [weeklyTotals, setWeeklyTotals] = useState<MacroGoals | null>(null);
  const [dailyGoals, setDailyGoals] = useState<MacroGoals>({
    calories: 2000,
    protein: 150,
    fat: 65,
    carbs: 250
  });

  // Update daily goals when user profile changes
  useEffect(() => {
    console.log('🔍 MacroDashboard useEffect - user:', user);
    console.log('🔍 MacroDashboard useEffect - user?.profile:', user?.profile);
    
    if (user?.profile) {
      console.log('MacroDashboard - Updating daily goals from user profile');
      console.log('MacroDashboard - user.profile.calories:', user.profile.calories);
      console.log('MacroDashboard - user.profile.macros:', user.profile.macros);
      
      const newDailyGoals: MacroGoals = {
        calories: user.profile.calories || 2000,
        protein: user.profile.macros?.protein || 150,
        fat: user.profile.macros?.fat || 65,
        carbs: user.profile.macros?.carbs || 250
      };
      
      console.log('MacroDashboard - Setting new daily goals:', newDailyGoals);
      setDailyGoals(newDailyGoals);
    } else if (user) {
      console.log('❌ User exists but no profile found, using default goals');
      setDailyGoals({
        calories: 2000,
        protein: 150,
        fat: 65,
        carbs: 250
      });
    } else {
      console.log('❌ No user found, using default goals');
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [view]);

  const loadData = async () => {
    if (!user?.id) return;
    
    const today = await getTodayMacros(user.id);
    setTodayData(today);
    
    if (view === 'week') {
      const week = await getWeekMacros(user.id);
      const totals = await getWeeklyTotals(user.id);
      setWeekData(week);
      setWeeklyTotals(totals);
    }
  };

  const handleDeleteEntry = async (date: string, entryId: string): Promise<void> => {
    if (!user?.id) return;
    
    const success = await deleteFoodEntry(user.id, entryId);
    if (success) {
      loadData();
    }
  };

  const getTodayTotals = (): MacroGoals => {
    if (!todayData) return { calories: 0, protein: 0, fat: 0, carbs: 0 };
    
    return todayData.reduce((totals, entry) => ({
      calories: totals.calories + entry.calories,
      protein: totals.protein + entry.protein,
      fat: totals.fat + entry.fat,
      carbs: totals.carbs + entry.carbs
    }), { calories: 0, protein: 0, fat: 0, carbs: 0 });
  };

  const todayTotals = getTodayTotals();

  return (
    <div className="min-h-screen bg-base-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-base-content">Macro Dashboard</h1>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={view === 'today' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('today')}
            >
              Today
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('week')}
            >
              Week
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <Button
            onClick={onAddFood}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Food
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentView('camera')}
            className="flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            AI Vision Scan
          </Button>
          <Button
            variant="outline"
            onClick={onShowMealPlan}
            className="flex items-center gap-2"
          >
            <Utensils className="w-4 h-4" />
            Meal Plan
          </Button>
          <Button
            variant="outline"
            onClick={onShowWorkout}
            className="flex items-center gap-2"
          >
            <Dumbbell className="w-4 h-4" />
            Workout Plan
          </Button>
        </div>

        {/* Macro Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Calories */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-base-content/70">
                Calories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-base-content">
                {todayTotals.calories}
                <span className="text-sm font-normal text-base-content/60">
                  /{dailyGoals.calories}
                </span>
              </div>
              <Progress 
                value={getProgressPercentage(todayTotals.calories, dailyGoals.calories)} 
                className="mt-2"
              />
              <div className={`text-xs mt-1 ${getProgressColor(getProgressPercentage(todayTotals.calories, dailyGoals.calories))}`}>
                {Math.round(getProgressPercentage(todayTotals.calories, dailyGoals.calories))}%
              </div>
            </CardContent>
          </Card>

          {/* Protein */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-base-content/70">
                Protein
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-base-content">
                {todayTotals.protein}g
                <span className="text-sm font-normal text-base-content/60">
                  /{dailyGoals.protein}g
                </span>
              </div>
              <Progress 
                value={getProgressPercentage(todayTotals.protein, dailyGoals.protein)} 
                className="mt-2"
              />
              <div className={`text-xs mt-1 ${getProgressColor(getProgressPercentage(todayTotals.protein, dailyGoals.protein))}`}>
                {Math.round(getProgressPercentage(todayTotals.protein, dailyGoals.protein))}%
              </div>
            </CardContent>
          </Card>

          {/* Fat */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-base-content/70">
                Fat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-base-content">
                {todayTotals.fat}g
                <span className="text-sm font-normal text-base-content/60">
                  /{dailyGoals.fat}g
                </span>
              </div>
              <Progress 
                value={getProgressPercentage(todayTotals.fat, dailyGoals.fat)} 
                className="mt-2"
              />
              <div className={`text-xs mt-1 ${getProgressColor(getProgressPercentage(todayTotals.fat, dailyGoals.fat))}`}>
                {Math.round(getProgressPercentage(todayTotals.fat, dailyGoals.fat))}%
              </div>
            </CardContent>
          </Card>

          {/* Carbs */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-base-content/70">
                Carbs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-base-content">
                {todayTotals.carbs}g
                <span className="text-sm font-normal text-base-content/60">
                  /{dailyGoals.carbs}g
                </span>
              </div>
              <Progress 
                value={getProgressPercentage(todayTotals.carbs, dailyGoals.carbs)} 
                className="mt-2"
              />
              <div className={`text-xs mt-1 ${getProgressColor(getProgressPercentage(todayTotals.carbs, dailyGoals.carbs))}`}>
                {Math.round(getProgressPercentage(todayTotals.carbs, dailyGoals.carbs))}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Food Entries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="w-5 h-5" />
              {view === 'today' ? 'Today\'s Food Entries' : 'This Week\'s Food Entries'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatePresence>
              {view === 'today' ? (
                <div className="space-y-3">
                  {todayData && todayData.length > 0 ? (
                    todayData.map((entry) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex items-center justify-between p-3 bg-base-200 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-base-content">{entry.name}</div>
                          <div className="text-sm text-base-content/60">
                            {entry.calories} cal • {entry.protein}g protein • {entry.fat}g fat • {entry.carbs}g carbs
                          </div>
                          <div className="text-xs text-base-content/50 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(entry.timestamp)}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEntry(new Date().toDateString(), entry.id)}
                          className="text-error hover:text-error"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-base-content/60">
                      <Utensils className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No food entries for today</p>
                      <p className="text-sm">Add your first meal to start tracking!</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {weekData && weekData.length > 0 ? (
                    weekData.map((entry) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex items-center justify-between p-3 bg-base-200 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-base-content">{entry.name}</div>
                          <div className="text-sm text-base-content/60">
                            {entry.calories} cal • {entry.protein}g protein • {entry.fat}g fat • {entry.carbs}g carbs
                          </div>
                          <div className="text-xs text-base-content/50 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(entry.timestamp)}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEntry(new Date(entry.timestamp).toDateString(), entry.id)}
                          className="text-error hover:text-error"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-base-content/60">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No food entries this week</p>
                      <p className="text-sm">Start tracking your meals to see weekly progress!</p>
                    </div>
                  )}
                </div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

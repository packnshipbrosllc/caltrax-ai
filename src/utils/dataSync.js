// Data synchronization utilities for Supabase
import { supabase } from '../config/supabase';
import { getMacroData, saveMacroData, getTodayDate, getWeekStart } from './macroStorage';

/**
 * Sync food entries from Supabase to localStorage
 * This is called on app startup to ensure data consistency across devices
 */
export const syncFoodEntriesFromSupabase = async (clerkUserId) => {
  if (!clerkUserId || !supabase) {
    console.log('⚠️ Cannot sync: missing userId or Supabase client');
    return false;
  }

  try {
    console.log('🔄 Starting food entries sync from Supabase...');
    console.log('🔍 Sync parameters:', { clerkUserId, supabaseClient: !!supabase });
    
    // Get last 30 days of data to ensure we have recent entries
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const startDateStr = startDate.toISOString().split('T')[0];

    console.log('🔍 Date range:', { startDateStr, endDate });

    const { data: supabaseEntries, error } = await supabase
      .from('food_entries')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .gte('date', startDateStr)
      .lte('date', endDate)
      .order('date', { ascending: false });

    console.log('🔍 Supabase query result:', { 
      entriesCount: supabaseEntries?.length || 0, 
      error: error?.message || 'none',
      sampleEntry: supabaseEntries?.[0] || 'none'
    });

    if (error) {
      console.error('❌ Error fetching from Supabase:', error);
      return false;
    }

    if (!supabaseEntries || supabaseEntries.length === 0) {
      console.log('📭 No food entries found in Supabase');
      return true; // Not an error, just no data
    }

    console.log(`📥 Found ${supabaseEntries.length} food entries in Supabase`);

    // Get current localStorage data
    const localData = getMacroData();
    let hasChanges = false;

    // Group Supabase entries by date
    const entriesByDate = {};
    supabaseEntries.forEach(entry => {
      if (!entriesByDate[entry.date]) {
        entriesByDate[entry.date] = [];
      }
      entriesByDate[entry.date].push(entry);
    });

    // Merge Supabase data with localStorage
    Object.keys(entriesByDate).forEach(date => {
      const supabaseEntriesForDate = entriesByDate[date];
      
      // Initialize date in local data if it doesn't exist
      if (!localData[date]) {
        localData[date] = {
          date: date,
          entries: [],
          totals: {
            calories: 0,
            protein: 0,
            fat: 0,
            carbs: 0
          }
        };
      }

      // Convert Supabase entries to local format and merge
      const convertedEntries = supabaseEntriesForDate.map(entry => ({
        id: entry.id.toString(),
        timestamp: entry.date, // Use date field since created_at doesn't exist
        name: entry.name,
        nutrition: {
          calories: entry.calories,
          protein_g: entry.protein,
          fat_g: entry.fat,
          carbs_g: entry.carbs
        },
        healthScore: 0, // Default value since not stored in Supabase
        confidence: 0,  // Default value since not stored in Supabase
        syncedFromSupabase: true // Mark as synced
      }));

      // Merge entries (avoid duplicates by ID)
      const existingIds = new Set(localData[date].entries.map(e => e.id));
      const newEntries = convertedEntries.filter(entry => !existingIds.has(entry.id));
      
      if (newEntries.length > 0) {
        localData[date].entries = [...localData[date].entries, ...newEntries];
        hasChanges = true;
        console.log(`📝 Added ${newEntries.length} new entries for ${date}`);
      }

      // Recalculate totals for this date
      localData[date].totals = localData[date].entries.reduce((totals, entry) => ({
        calories: totals.calories + (entry.nutrition.calories || 0),
        protein: totals.protein + (entry.nutrition.protein_g || 0),
        fat: totals.fat + (entry.nutrition.fat_g || 0),
        carbs: totals.carbs + (entry.nutrition.carbs_g || 0)
      }), {
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0
      });
    });

    // Save merged data back to localStorage
    if (hasChanges) {
      saveMacroData(localData);
      console.log('✅ Food entries synced successfully to localStorage');
    } else {
      console.log('✅ Food entries already up to date');
    }

    return true;

  } catch (error) {
    console.error('❌ Error syncing food entries:', error);
    return false;
  }
};

/**
 * Sync workout plans from Supabase to localStorage
 */
export const syncWorkoutPlansFromSupabase = async (clerkUserId) => {
  if (!clerkUserId || !supabase) {
    console.log('⚠️ Cannot sync workout plans: missing userId or Supabase client');
    return false;
  }

  try {
    console.log('🔄 Starting workout plans sync from Supabase...');

    const { data: supabasePlans, error } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching workout plans from Supabase:', error);
      return false;
    }

    if (!supabasePlans || supabasePlans.length === 0) {
      console.log('📭 No workout plans found in Supabase');
      return true;
    }

    console.log(`📥 Found ${supabasePlans.length} workout plans in Supabase`);

    // Get current localStorage data
    const { simpleStorage } = await import('./simpleStorage');
    const PLAN_STORAGE_KEYS = { WORKOUT_PLANS: 'caltrax-workout-plans' };
    const localPlans = simpleStorage.getItem(PLAN_STORAGE_KEYS.WORKOUT_PLANS) || {};
    
    if (!localPlans[clerkUserId]) {
      localPlans[clerkUserId] = [];
    }

    // Merge Supabase plans with localStorage
    const existingIds = new Set(localPlans[clerkUserId].map(p => p.id));
    const newPlans = supabasePlans
      .map(plan => plan.plan_data)
      .filter(plan => !existingIds.has(plan.id));

    if (newPlans.length > 0) {
      localPlans[clerkUserId] = [...newPlans, ...localPlans[clerkUserId]];
      simpleStorage.setItem(PLAN_STORAGE_KEYS.WORKOUT_PLANS, localPlans);
      console.log(`✅ Added ${newPlans.length} workout plans to localStorage`);
    } else {
      console.log('✅ Workout plans already up to date');
    }

    return true;

  } catch (error) {
    console.error('❌ Error syncing workout plans:', error);
    return false;
  }
};

/**
 * Sync meal plans from Supabase to localStorage
 */
export const syncMealPlansFromSupabase = async (clerkUserId) => {
  if (!clerkUserId || !supabase) {
    console.log('⚠️ Cannot sync meal plans: missing userId or Supabase client');
    return false;
  }

  try {
    console.log('🔄 Starting meal plans sync from Supabase...');

    const { data: supabasePlans, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching meal plans from Supabase:', error);
      return false;
    }

    if (!supabasePlans || supabasePlans.length === 0) {
      console.log('📭 No meal plans found in Supabase');
      return true;
    }

    console.log(`📥 Found ${supabasePlans.length} meal plans in Supabase`);

    // Get current localStorage data
    const { simpleStorage } = await import('./simpleStorage');
    const PLAN_STORAGE_KEYS = { MEAL_PLANS: 'caltrax-meal-plans' };
    const localPlans = simpleStorage.getItem(PLAN_STORAGE_KEYS.MEAL_PLANS) || {};
    
    if (!localPlans[clerkUserId]) {
      localPlans[clerkUserId] = [];
    }

    // Merge Supabase plans with localStorage
    const existingIds = new Set(localPlans[clerkUserId].map(p => p.id));
    const newPlans = supabasePlans
      .map(plan => plan.plan_data)
      .filter(plan => !existingIds.has(plan.id));

    if (newPlans.length > 0) {
      localPlans[clerkUserId] = [...newPlans, ...localPlans[clerkUserId]];
      simpleStorage.setItem(PLAN_STORAGE_KEYS.MEAL_PLANS, localPlans);
      console.log(`✅ Added ${newPlans.length} meal plans to localStorage`);
    } else {
      console.log('✅ Meal plans already up to date');
    }

    return true;

  } catch (error) {
    console.error('❌ Error syncing meal plans:', error);
    return false;
  }
};

/**
 * Sync all user data from Supabase
 * Call this on app startup after user authentication
 */
export const syncAllUserData = async (clerkUserId) => {
  if (!clerkUserId) {
    console.log('⚠️ Cannot sync: no user ID provided');
    return false;
  }

  console.log('🚀 Starting full data sync for user:', clerkUserId);

  try {
    const results = await Promise.allSettled([
      syncFoodEntriesFromSupabase(clerkUserId),
      syncWorkoutPlansFromSupabase(clerkUserId),
      syncMealPlansFromSupabase(clerkUserId)
    ]);

    const [foodResult, workoutResult, mealResult] = results;
    
    console.log('📊 Sync Results:');
    console.log(`  Food Entries: ${foodResult.status === 'fulfilled' ? '✅' : '❌'}`);
    console.log(`  Workout Plans: ${workoutResult.status === 'fulfilled' ? '✅' : '❌'}`);
    console.log(`  Meal Plans: ${mealResult.status === 'fulfilled' ? '✅' : '❌'}`);

    const allSuccessful = results.every(result => result.status === 'fulfilled');
    
    if (allSuccessful) {
      console.log('🎉 All data synced successfully!');
    } else {
      console.log('⚠️ Some data sync operations failed, but continuing...');
    }

    return allSuccessful;

  } catch (error) {
    console.error('❌ Error in full data sync:', error);
    return false;
  }
};

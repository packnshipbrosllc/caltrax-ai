// Daily tracking database functions for CalTrax
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Interface for daily food entries
export interface FoodEntry {
  id: string;
  date: string;
  entry_id: string;
  timestamp: string;
  food_name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  health_score: number;
  confidence: number;
  source: 'manual' | 'barcode' | 'ai_vision';
}

// Interface for daily totals
export interface DailyTotals {
  id: string;
  user_id: string;
  date: string;
  total_calories: number;
  total_protein_g: number;
  total_fat_g: number;
  total_carbs_g: number;
  entry_count: number;
}

// Interface for weekly summaries
export interface WeeklySummary {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  total_calories: number;
  total_protein_g: number;
  total_fat_g: number;
  total_carbs_g: number;
  avg_daily_calories: number;
  days_tracked: number;
  goal_calories?: number;
  goal_protein_g?: number;
  goal_fat_g?: number;
  goal_carbs_g?: number;
}

// Get user's database ID from Clerk ID
async function getUserIdFromClerkId(clerkUserId: string): Promise<string | null> {
  try {
    console.log('🔍 getUserIdFromClerkId called with:', clerkUserId);
    
    if (!supabase) {
      console.error('❌ Supabase not configured, cannot get user ID');
      return null;
    }

    console.log('🔍 Querying profiles table for clerk_user_id:', clerkUserId);
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (error) {
      console.error('❌ Error getting user ID from database:', error);
      console.error('❌ Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return null;
    }

    console.log('✅ Found user ID in database:', data?.id);
    return data?.id || null;
  } catch (error) {
    console.error('❌ Failed to get user ID:', error);
    return null;
  }
}

// Add food entry to database
export async function addFoodEntry(
  clerkUserId: string,
  foodData: {
    name: string;
    nutrition: {
      calories: number;
      protein: number;
      fat: number;
      carbs: number;
    };
    score?: number;
    confidence?: number;
    source?: 'manual' | 'barcode' | 'ai_vision';
    quantity?: number;
    unit?: string;
  }
): Promise<FoodEntry | null> {
  try {
    console.log('🍎 addFoodEntry called with:', { clerkUserId, foodData });
    
    if (!supabase) {
      console.error('❌ Supabase not configured, cannot add food entry');
      return null;
    }

    console.log('🔍 Getting user ID from Clerk ID:', clerkUserId);
    const userId = await getUserIdFromClerkId(clerkUserId);
    console.log('🔍 User ID from database:', userId);
    
    if (!userId) {
      console.error('❌ User not found in database for Clerk ID:', clerkUserId);
      return null;
    }

    const today = new Date().toISOString().split('T')[0];
    const entryId = Date.now().toString();

    const entryData = {
      user_id: userId,
      date: today,
      entry_id: entryId,
      food_name: foodData.name,
      quantity: foodData.quantity || 1,
      unit: foodData.unit || 'serving',
      calories: foodData.nutrition.calories,
      protein_g: foodData.nutrition.protein,
      fat_g: foodData.nutrition.fat,
      carbs_g: foodData.nutrition.carbs,
      health_score: foodData.score || 0,
      confidence: foodData.confidence || 0,
      source: foodData.source || 'manual'
    };

    console.log('🍎 Inserting food entry data:', entryData);

    const { data, error } = await supabase
      .from('daily_entries')
      .insert(entryData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error adding food entry to database:', error);
      console.error('❌ Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }

    console.log('✅ Food entry added to database successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to add food entry:', error);
    return null;
  }
}

// Get today's food entries
export async function getTodayEntries(clerkUserId: string): Promise<FoodEntry[]> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured, cannot get today entries');
      return [];
    }

    const userId = await getUserIdFromClerkId(clerkUserId);
    if (!userId) {
      console.error('User not found in database');
      return [];
    }

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error getting today entries:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to get today entries:', error);
    return [];
  }
}

// Get daily totals for a specific date
export async function getDailyTotals(clerkUserId: string, date?: string): Promise<DailyTotals | null> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured, cannot get daily totals');
      return null;
    }

    const userId = await getUserIdFromClerkId(clerkUserId);
    if (!userId) {
      console.error('User not found in database');
      return null;
    }

    const targetDate = date || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_totals')
      .select('*')
      .eq('user_id', userId)
      .eq('date', targetDate)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data for this date, return empty totals
        return {
          id: '',
          user_id: userId,
          date: targetDate,
          total_calories: 0,
          total_protein_g: 0,
          total_fat_g: 0,
          total_carbs_g: 0,
          entry_count: 0
        };
      }
      console.error('Error getting daily totals:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to get daily totals:', error);
    return null;
  }
}

// Get weekly summary
export async function getWeeklySummary(clerkUserId: string, weekStart?: string): Promise<WeeklySummary | null> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured, cannot get weekly summary');
      return null;
    }

    const userId = await getUserIdFromClerkId(clerkUserId);
    if (!userId) {
      console.error('User not found in database');
      return null;
    }

    // Calculate week start (Monday)
    const targetWeekStart = weekStart || (() => {
      const today = new Date();
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      const monday = new Date(today.setDate(diff));
      return monday.toISOString().split('T')[0];
    })();

    const { data, error } = await supabase
      .from('weekly_summaries')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start', targetWeekStart)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data for this week, return empty summary
        return {
          id: '',
          user_id: userId,
          week_start: targetWeekStart,
          week_end: new Date(new Date(targetWeekStart).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          total_calories: 0,
          total_protein_g: 0,
          total_fat_g: 0,
          total_carbs_g: 0,
          avg_daily_calories: 0,
          days_tracked: 0
        };
      }
      console.error('Error getting weekly summary:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to get weekly summary:', error);
    return null;
  }
}

// Delete food entry
export async function deleteFoodEntry(clerkUserId: string, entryId: string): Promise<boolean> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured, cannot delete food entry');
      return false;
    }

    const userId = await getUserIdFromClerkId(clerkUserId);
    if (!userId) {
      console.error('User not found in database');
      return false;
    }

    const { error } = await supabase
      .from('daily_entries')
      .delete()
      .eq('user_id', userId)
      .eq('entry_id', entryId);

    if (error) {
      console.error('Error deleting food entry:', error);
      return false;
    }

    console.log('✅ Food entry deleted from database');
    return true;
  } catch (error) {
    console.error('Failed to delete food entry:', error);
    return false;
  }
}

// Get entries for a date range
export async function getEntriesForDateRange(
  clerkUserId: string, 
  startDate: string, 
  endDate: string
): Promise<FoodEntry[]> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured, cannot get entries for date range');
      return [];
    }

    const userId = await getUserIdFromClerkId(clerkUserId);
    if (!userId) {
      console.error('User not found in database');
      return [];
    }

    const { data, error } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error getting entries for date range:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to get entries for date range:', error);
    return [];
  }
}

// Update weekly summary (called by backend)
export async function updateWeeklySummary(
  clerkUserId: string,
  weekStart: string,
  goals?: {
    calories?: number;
    protein_g?: number;
    fat_g?: number;
    carbs_g?: number;
  }
): Promise<WeeklySummary | null> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured, cannot update weekly summary');
      return null;
    }

    const userId = await getUserIdFromClerkId(clerkUserId);
    if (!userId) {
      console.error('User not found in database');
      return null;
    }

    // Get all daily totals for the week
    const weekEnd = new Date(new Date(weekStart).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const { data: dailyTotals, error } = await supabase
      .from('daily_totals')
      .select('*')
      .eq('user_id', userId)
      .gte('date', weekStart)
      .lte('date', weekEnd);

    if (error) {
      console.error('Error getting daily totals for week:', error);
      return null;
    }

    // Calculate weekly totals
    const totals = dailyTotals?.reduce((acc, day) => ({
      total_calories: acc.total_calories + (day.total_calories || 0),
      total_protein_g: acc.total_protein_g + (day.total_protein_g || 0),
      total_fat_g: acc.total_fat_g + (day.total_fat_g || 0),
      total_carbs_g: acc.total_carbs_g + (day.total_carbs_g || 0),
      days_tracked: acc.days_tracked + (day.entry_count > 0 ? 1 : 0)
    }), {
      total_calories: 0,
      total_protein_g: 0,
      total_fat_g: 0,
      total_carbs_g: 0,
      days_tracked: 0
    }) || {
      total_calories: 0,
      total_protein_g: 0,
      total_fat_g: 0,
      total_carbs_g: 0,
      days_tracked: 0
    };

    const avgDailyCalories = totals.days_tracked > 0 ? totals.total_calories / totals.days_tracked : 0;

    const summaryData = {
      user_id: userId,
      week_start: weekStart,
      week_end: weekEnd,
      total_calories: totals.total_calories,
      total_protein_g: totals.total_protein_g,
      total_fat_g: totals.total_fat_g,
      total_carbs_g: totals.total_carbs_g,
      avg_daily_calories: avgDailyCalories,
      days_tracked: totals.days_tracked,
      goal_calories: goals?.calories,
      goal_protein_g: goals?.protein_g,
      goal_fat_g: goals?.fat_g,
      goal_carbs_g: goals?.carbs_g
    };

    const { data, error: upsertError } = await supabase
      .from('weekly_summaries')
      .upsert(summaryData, { 
        onConflict: 'user_id,week_start',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Error updating weekly summary:', upsertError);
      return null;
    }

    console.log('✅ Weekly summary updated:', data);
    return data;
  } catch (error) {
    console.error('Failed to update weekly summary:', error);
    return null;
  }
}

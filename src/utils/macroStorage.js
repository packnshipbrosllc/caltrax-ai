// Macro tracking storage utilities
import { addFoodEntry as addFoodEntryToDB } from '../lib/dailyTracking';

export const MACRO_STORAGE_KEY = 'caltrax-macros';

export const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

export const getWeekStart = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
};

export const getMacroData = () => {
  try {
    const data = localStorage.getItem(MACRO_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error loading macro data:', error);
    return {};
  }
};

export const saveMacroData = (data) => {
  try {
    localStorage.setItem(MACRO_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving macro data:', error);
  }
};

export const addFoodEntry = async (foodData, clerkUserId = null) => {
  const today = getTodayDate();
  const macroData = getMacroData();
  
  if (!macroData[today]) {
    macroData[today] = {
      date: today,
      entries: [],
      totals: {
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0
      }
    };
  }
  
  const entry = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    name: foodData.name,
    nutrition: foodData.nutrition,
    healthScore: foodData.score || 0,
    confidence: foodData.confidence || 0
  };
  
  macroData[today].entries.push(entry);
  
  // Update totals
  macroData[today].totals.calories += foodData.nutrition.calories || 0;
  macroData[today].totals.protein += foodData.nutrition.protein_g || 0;
  macroData[today].totals.fat += foodData.nutrition.fat_g || 0;
  macroData[today].totals.carbs += foodData.nutrition.carbs_g || 0;
  
  // Save to local storage
  saveMacroData(macroData);
  
  // Also save to database if we have a Clerk user ID
  if (clerkUserId) {
    try {
      console.log('💾 Attempting to save to Supabase...');
      const { supabase } = await import('../config/supabase');

      const { data, error } = await supabase
        .from('food_entries')
        .insert({
          clerk_user_id: clerkUserId,
          date: today,
          name: foodData.name,
          calories: foodData.nutrition.calories || 0,
          protein: foodData.nutrition.protein_g || 0,
          fat: foodData.nutrition.fat_g || 0,
          carbs: foodData.nutrition.carbs_g || 0
        });

      if (error) {
        console.error('❌ Supabase save error:', error);
        // Re-throw so calling code knows it failed
        throw new Error(`Failed to save food entry: ${error.message}`);
      } else {
        console.log('✅ Food entry saved to Supabase:', data);
      }
    } catch (error) {
      console.error('❌ Supabase error:', error);
      // Re-throw so calling code can handle the error
      throw error;
    }
  }
  
  return entry;
};

export const getTodayMacros = () => {
  const today = getTodayDate();
  const macroData = getMacroData();
  return macroData[today] || {
    date: today,
    entries: [],
    totals: {
      calories: 0,
      protein_g: 0,
      fat_g: 0,
      carbs_g: 0
    }
  };
};

export const getWeekMacros = () => {
  const weekStart = getWeekStart();
  const macroData = getMacroData();
  const weekData = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    weekData.push(macroData[dateStr] || {
      date: dateStr,
      entries: [],
      totals: {
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0
      }
    });
  }
  
  return weekData;
};

export const getWeeklyTotals = () => {
  const weekData = getWeekMacros();
  return weekData.reduce((totals, day) => ({
    calories: totals.calories + day.totals.calories,
    protein: totals.protein + day.totals.protein,
    fat: totals.fat + day.totals.fat,
    carbs: totals.carbs + day.totals.carbs
  }), {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0
  });
};

export const deleteFoodEntry = (date, entryId) => {
  const macroData = getMacroData();
  if (!macroData[date]) return false;
  
  const entryIndex = macroData[date].entries.findIndex(entry => entry.id === entryId);
  if (entryIndex === -1) return false;
  
  const entry = macroData[date].entries[entryIndex];
  
  // Remove from totals
  macroData[date].totals.calories -= entry.nutrition.calories || 0;
  macroData[date].totals.protein -= entry.nutrition.protein_g || 0;
  macroData[date].totals.fat -= entry.nutrition.fat_g || 0;
  macroData[date].totals.carbs -= entry.nutrition.carbs_g || 0;
  
  // Remove entry
  macroData[date].entries.splice(entryIndex, 1);
  
  saveMacroData(macroData);
  return true;
};
import { db, FoodEntry } from './supabase';

export const MACRO_STORAGE_KEY = 'caltrax-macros';

export const getTodayDate = () => {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
};

export const getWeekStart = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  d.setDate(diff);
  return d.toISOString().split('T')[0];
};

export const getMacroData = async (userId: string) => {
  try {
    const entries = await db.getFoodEntries(userId);
    return entries;
  } catch (error) {
    console.error('Error loading macro data:', error);
    return [];
  }
};

export const saveMacroData = async (userId: string, data: FoodEntry[]) => {
  // This function is not needed with Supabase as data is saved directly
  console.log('Data saved to Supabase:', data);
};

export const addFoodEntry = async (userId: string, foodData: Omit<FoodEntry, 'id' | 'user_id' | 'created_at'>) => {
  try {
    const entry = await db.addFoodEntry({
      ...foodData,
      user_id: userId,
    });
    
    if (entry) {
      console.log('Food entry added successfully:', entry);
      return entry;
    }
    
    return null;
  } catch (error) {
    console.error('Error adding food entry:', error);
    return null;
  }
};

export const getTodayMacros = async (userId: string) => {
  try {
    const today = getTodayDate();
    const entries = await db.getFoodEntries(userId, today);
    
    const totalCalories = entries.reduce((sum, entry) => sum + entry.calories, 0);
    const totalProtein = entries.reduce((sum, entry) => sum + entry.protein, 0);
    const totalFat = entries.reduce((sum, entry) => sum + entry.fat, 0);
    const totalCarbs = entries.reduce((sum, entry) => sum + entry.carbs, 0);
    
    return {
      date: today,
      entries: entries,
      totalCalories,
      totalProtein,
      totalFat,
      totalCarbs
    };
  } catch (error) {
    console.error('Error getting today macros:', error);
    return {
      date: getTodayDate(),
      entries: [],
      totalCalories: 0,
      totalProtein: 0,
      totalFat: 0,
      totalCarbs: 0
    };
  }
};

export const getWeekMacros = async (userId: string) => {
  try {
    const weekStart = getWeekStart();
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const entries = await db.getFoodEntries(userId);
    
    // Filter entries for the current week
    const weekEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= new Date(weekStart) && entryDate <= weekEnd;
    });
    
    // Group by date
    const groupedEntries: { [key: string]: FoodEntry[] } = {};
    weekEntries.forEach(entry => {
      if (!groupedEntries[entry.date]) {
        groupedEntries[entry.date] = [];
      }
      groupedEntries[entry.date].push(entry);
    });
    
    // Calculate totals for each day
    const weekData: { [key: string]: any } = {};
    Object.keys(groupedEntries).forEach(date => {
      const dayEntries = groupedEntries[date];
      weekData[date] = {
        date,
        entries: dayEntries,
        totalCalories: dayEntries.reduce((sum, entry) => sum + entry.calories, 0),
        totalProtein: dayEntries.reduce((sum, entry) => sum + entry.protein, 0),
        totalFat: dayEntries.reduce((sum, entry) => sum + entry.fat, 0),
        totalCarbs: dayEntries.reduce((sum, entry) => sum + entry.carbs, 0)
      };
    });
    
    return weekData;
  } catch (error) {
    console.error('Error getting week macros:', error);
    return {};
  }
};

export const getWeeklyTotals = async (userId: string) => {
  try {
    const weekData = await getWeekMacros(userId);
    
    let totalCalories = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;
    
    Object.values(weekData).forEach((day: any) => {
      totalCalories += day.totalCalories;
      totalProtein += day.totalProtein;
      totalFat += day.totalFat;
      totalCarbs += day.totalCarbs;
    });
    
    return {
      totalCalories,
      totalProtein,
      totalFat,
      totalCarbs
    };
  } catch (error) {
    console.error('Error getting weekly totals:', error);
    return {
      totalCalories: 0,
      totalProtein: 0,
      totalFat: 0,
      totalCarbs: 0
    };
  }
};

export const deleteFoodEntry = async (userId: string, entryId: string) => {
  try {
    const success = await db.deleteFoodEntry(entryId);
    return success;
  } catch (error) {
    console.error('Error deleting food entry:', error);
    return false;
  }
};

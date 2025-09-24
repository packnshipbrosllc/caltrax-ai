import { createClient } from '@supabase/supabase-js';

// Only initialize Supabase if we have valid environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

// Check if we have valid environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not configured. Using mock client for development.');
}

// Create a mock Supabase client if environment variables are missing
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      // Mock Supabase client for development
      auth: {
        signUp: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        signIn: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        signOut: () => Promise.resolve({ error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
        insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
        update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) }),
        delete: () => ({ eq: () => Promise.resolve({ error: null }) })
      })
    };

// Database types
export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  name?: string;
  height?: number;
  weight?: number;
  age?: number;
  gender?: 'male' | 'female';
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'very' | 'extreme';
  goals?: string[];
  dietary_restrictions?: string[];
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  created_at: string;
  updated_at: string;
}

export interface FoodEntry {
  id: string;
  user_id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  quantity: number;
  unit: string;
  date: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: string;
  plan_name: string;
  current_period_start: string;
  current_period_end: string;
  trial_end?: string;
  created_at: string;
  updated_at: string;
}

// Database functions
export const db = {
  // User Profile functions
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    
    return data;
  },

  async createUserProfile(profile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(profile)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating user profile:', error);
      return null;
    }
    
    return data;
  },

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
    
    return data;
  },

  // Food Entry functions
  async getFoodEntries(userId: string, date?: string): Promise<FoodEntry[]> {
    let query = supabase
      .from('food_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (date) {
      query = query.eq('date', date);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching food entries:', error);
      return [];
    }
    
    return data || [];
  },

  async addFoodEntry(entry: Omit<FoodEntry, 'id' | 'created_at'>): Promise<FoodEntry | null> {
    const { data, error } = await supabase
      .from('food_entries')
      .insert(entry)
      .select()
      .single();
    
    if (error) {
      console.error('Error adding food entry:', error);
      return null;
    }
    
    return data;
  },

  async deleteFoodEntry(entryId: string): Promise<boolean> {
    const { error } = await supabase
      .from('food_entries')
      .delete()
      .eq('id', entryId);
    
    if (error) {
      console.error('Error deleting food entry:', error);
      return false;
    }
    
    return true;
  },

  // Subscription functions
  async getSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
    
    return data;
  },

  async createSubscription(subscription: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert(subscription)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating subscription:', error);
      return null;
    }
    
    return data;
  },

  async updateSubscription(subscriptionId: string, updates: Partial<Subscription>): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('id', subscriptionId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating subscription:', error);
      return null;
    }
    
    return data;
  },
};

// Database utilities for CalTrax - Updated to work with existing profiles table
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// User tracking interface - adapted for existing profiles table
export interface CalTraxUser {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  height_inches?: number;
  weight_lbs?: number;
  age?: number;
  gender?: string;
  activity_level?: string;
  goals?: string[];
  dietary_restrictions?: string[];
  calories?: number;
  protein_g?: number;
  fat_g?: number;
  carbs_g?: number;
  customer_id?: string;
  subscription_id?: string;
  subscription_status?: string;
  // Additional fields for CalTrax
  clerk_user_id?: string;
  has_paid?: boolean;
  plan?: 'trial' | 'monthly' | 'yearly' | null;
  payment_date?: string | null;
  trial_used?: boolean;
  trial_start_date?: string | null;
}

// Create or update user in database using existing profiles table
export async function createOrUpdateUser(userData: {
  clerk_user_id: string;
  email: string;
  has_paid?: boolean;
  plan?: 'trial' | 'monthly' | 'yearly' | null;
  payment_date?: string | null;
  trial_used?: boolean;
  trial_start_date?: string | null;
  profile_data?: any;
}) {
  try {
    console.log('Creating/updating user in database:', userData);
    
    // First, try to find existing user by email
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', userData.email)
      .single();

    let profileData = {};
    
    // If profile_data is provided, extract the relevant fields
    if (userData.profile_data) {
      profileData = {
        height_inches: userData.profile_data.height,
        weight_lbs: userData.profile_data.weight,
        age: userData.profile_data.age,
        gender: userData.profile_data.gender,
        activity_level: userData.profile_data.activityLevel,
        goals: userData.profile_data.goals || [],
        dietary_restrictions: userData.profile_data.dietaryRestrictions || [],
        calories: userData.profile_data.calories,
        protein_g: userData.profile_data.macros?.protein,
        fat_g: userData.profile_data.macros?.fat,
        carbs_g: userData.profile_data.macros?.carbs,
      };
    }

    const updateData = {
      email: userData.email,
      clerk_user_id: userData.clerk_user_id,
      has_paid: userData.has_paid || false,
      plan: userData.plan || null,
      payment_date: userData.payment_date || null,
      trial_used: userData.trial_used || false,
      trial_start_date: userData.trial_start_date || null,
      subscription_status: userData.has_paid ? 'active' : 'inactive',
      updated_at: new Date().toISOString(),
      ...profileData
    };

    let data;
    if (existingUser) {
      // Update existing user
      const { data: updatedData, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('email', userData.email)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      data = updatedData;
    } else {
      // Create new user
      const { data: newData, error } = await supabase
        .from('profiles')
        .insert({
          ...updateData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      data = newData;
    }

    console.log('User created/updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to create/update user:', error);
    throw error;
  }
}

// Get user by Clerk ID
export async function getUserByClerkId(clerkUserId: string): Promise<CalTraxUser | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No user found
        return null;
      }
      console.error('Database error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to get user:', error);
    throw error;
  }
}

// Check if email has used trial before
export async function hasUsedTrial(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('trial_used')
      .eq('email', email)
      .eq('trial_used', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No trial found
        return false;
      }
      console.error('Database error:', error);
      throw error;
    }

    return data?.trial_used || false;
  } catch (error) {
    console.error('Failed to check trial usage:', error);
    return false; // Default to allowing trial if check fails
  }
}

// Update user payment status
export async function updateUserPayment(
  clerkUserId: string, 
  hasPaid: boolean, 
  plan: 'trial' | 'monthly' | 'yearly',
  paymentDate?: string
) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        has_paid: hasPaid,
        plan: plan,
        payment_date: paymentDate || new Date().toISOString(),
        subscription_status: hasPaid ? 'active' : 'inactive',
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_user_id', clerkUserId)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('User payment status updated:', data);
    return data;
  } catch (error) {
    console.error('Failed to update payment status:', error);
    throw error;
  }
}

// Mark trial as used
export async function markTrialUsed(clerkUserId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        trial_used: true,
        trial_start_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_user_id', clerkUserId)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('Trial marked as used:', data);
    return data;
  } catch (error) {
    console.error('Failed to mark trial as used:', error);
    throw error;
  }
}

// Database utilities for CalTrax
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// User tracking interface
export interface CalTraxUser {
  id: string;
  clerk_user_id: string;
  email: string;
  has_paid: boolean;
  plan: 'trial' | 'monthly' | 'yearly' | null;
  payment_date: string | null;
  trial_used: boolean;
  trial_start_date: string | null;
  created_at: string;
  updated_at: string;
  profile_data: any | null;
}

// Create or update user in database
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
    
    const { data, error } = await supabase
      .from('caltrax_users')
      .upsert({
        clerk_user_id: userData.clerk_user_id,
        email: userData.email,
        has_paid: userData.has_paid || false,
        plan: userData.plan || null,
        payment_date: userData.payment_date || null,
        trial_used: userData.trial_used || false,
        trial_start_date: userData.trial_start_date || null,
        profile_data: userData.profile_data || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'clerk_user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
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
      .from('caltrax_users')
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
      .from('caltrax_users')
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
      .from('caltrax_users')
      .update({
        has_paid: hasPaid,
        plan: plan,
        payment_date: paymentDate || new Date().toISOString(),
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
      .from('caltrax_users')
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

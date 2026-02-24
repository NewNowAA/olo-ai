import { supabase } from './supabase/client';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  user_role: string;
  status?: string;
  avatar_url?: string;
  org_id?: string;
  mobile_number?: string;
  whatsapp_id?: string;
  telegram_id?: string;
  link_token?: string;
  token_expires_at?: string;
}

export interface InviteUserPayload {
  email: string;
  role: string;
  fullName: string;
  phone: string;
  org_id: string;
}

export const userService = {
  // Get current user profile
  getCurrentProfile: async (): Promise<UserProfile | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) {
       // If profile doesn't exist but auth user does, return basic info or null
       console.error("Error fetching user profile", error);
       return null;
    }
    return data;
  },

  // Get all users in the same organization
  getTeamMembers: async (orgId: string): Promise<UserProfile[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('org_id', orgId);

    if (error) {
      console.error('Error fetching team members:', error);
      return [];
    }
    return data;
  },

  updateProfile: async (userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
    return data;
  },

  inviteUser: async (payload: InviteUserPayload): Promise<any> => {
    const { data, error } = await supabase.functions.invoke('invite-user', {
      body: payload
    });

    if (error) throw error;
    return data;
  }
};

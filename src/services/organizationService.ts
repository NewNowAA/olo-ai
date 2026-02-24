import { supabase } from './supabase/client';

export interface Organization {
  id: string;
  name: string;
  sector?: string;
  objective_description?: string;
  onboarding_status?: string;
  currency_default?: string;
  ai_personality?: string;
  tax_id?: string;
  fiscal_address?: string;
  employee_range?: string;
}

export const organizationService = {
  getOrganization: async (orgId: string): Promise<Organization | null> => {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();

    if (error) {
      console.error('Error fetching organization:', error);
      return null;
    }
    return data;
  },

  updateOrganization: async (orgId: string, updates: Partial<Organization>): Promise<Organization | null> => {
    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', orgId)
      .select()
      .single();

    if (error) {
      console.error('Error updating organization:', error);
      throw error;
    }
    return data;
  }
};

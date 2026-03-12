// =============================================
// Olo.AI — useAuth Hook (Supabase Auth)
// =============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Role } from '../types';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  orgId: string;
  name?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Resolve user profile from public.users table (now profiles)
  const resolveProfile = useCallback(async (authUser: User): Promise<AuthUser | null> => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, role, full_name')
        .eq('id', authUser.id)
        .single();

      if (!profile) return null;

      // Map DB role to Olo.AI role
      let role: Role = 'client';
      const dbRole = profile.role || authUser.user_metadata?.role;
      if (dbRole === 'system_admin' || dbRole === 'dev') role = 'dev';
      else if (dbRole === 'admin' || dbRole === 'owner') role = 'owner';
      else role = 'client';

      return {
        id: authUser.id,
        email: authUser.email || '',
        role,
        orgId: profile.organization_id || '',
        name: profile.full_name || authUser.email,
      };
    } catch {
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const profile = await resolveProfile(authUser);
          setUser(profile);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    init();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await resolveProfile(session.user);
        setUser(profile);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [resolveProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) {
      const profile = await resolveProfile(data.user);
      setUser(profile);
      return profile;
    }
    return null;
  }, [resolveProfile]);

  const signUp = useCallback(async (
    email: string,
    password: string,
    name: string,
    role: 'owner' | 'client',
    businessName?: string,
    sector?: string
  ) => {
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/api\/?$/, '');
    
    const response = await fetch(`${baseUrl}/api/public/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, role, businessName, sector }),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar conta');
    }

    // Backend creates user, but client needs to be signed in
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (signInError) {
         console.error('Sign in after registration failed:', signInError);
         throw new Error('Conta criada, mas falha ao fazer login automático.');
    }

    return { userId: result.userId, orgId: result.orgId };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return {
    user,
    role: user?.role || null,
    orgId: user?.orgId || null,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
  };
}

export default useAuth;

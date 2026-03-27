// =============================================
// Olo.AI — AuthContext (Shared Auth State)
// =============================================
// Provides auth state once at the root level so all
// components share the same session — no duplicate DB calls.

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  role: Role | null;
  orgId: string | null;
  signIn: (email: string, password: string) => Promise<AuthUser | null>;
  signUp: (email: string, password: string, name: string, role: 'owner' | 'client', businessName?: string, sector?: string) => Promise<{ userId: string; orgId: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuthContext(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}

async function resolveProfile(authUser: User): Promise<AuthUser | null> {
  try {
    // maybeSingle() returns null (not an error) when 0 rows found
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role, full_name')
      .eq('id', authUser.id)
      .maybeSingle();

    // Fall back to user_metadata stored in JWT (no extra DB call)
    const dbRole = profile?.role || authUser.user_metadata?.role;
    const orgId = profile?.organization_id || authUser.user_metadata?.org_id || '';
    const name = profile?.full_name || authUser.user_metadata?.name || authUser.email;

    let role: Role = 'client';
    if (dbRole === 'system_admin' || dbRole === 'dev') role = 'dev';
    else if (dbRole === 'admin' || dbRole === 'owner') role = 'owner';

    return {
      id: authUser.id,
      email: authUser.email || '',
      role,
      orgId,
      name,
    };
  } catch {
    // Last resort: build minimal profile from JWT user_metadata
    const dbRole = authUser.user_metadata?.role;
    let role: Role = 'client';
    if (dbRole === 'dev') role = 'dev';
    else if (dbRole === 'admin' || dbRole === 'owner') role = 'owner';
    return {
      id: authUser.id,
      email: authUser.email || '',
      role,
      orgId: authUser.user_metadata?.org_id || '',
      name: authUser.user_metadata?.name || authUser.email,
    };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Safety net: never leave the app stuck in loading beyond 6 seconds
    const safetyTimeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 6000);

    // Supabase v2 best practice: use onAuthStateChange as the single source of truth.
    // INITIAL_SESSION fires immediately from localStorage on every page load (no network needed).
    // This replaces the old getSession() + onAuthStateChange dual approach which could hang
    // when getSession() tried to refresh an expired token over a slow network.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        if (session?.user) {
          const profile = await resolveProfile(session.user);
          if (mounted) setUser(profile);
        } else {
          if (mounted) setUser(null);
        }
        clearTimeout(safetyTimeout);
        if (mounted) setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        if (mounted) setUser(null);
        clearTimeout(safetyTimeout);
        if (mounted) setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Re-resolve profile silently on token refresh (doesn't change loading state)
        const profile = await resolveProfile(session.user);
        if (mounted) setUser(profile);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthUser | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) {
      const profile = await resolveProfile(data.user);
      setUser(profile);
      return profile;
    }
    return null;
  }, []);

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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, role, businessName, sector }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Erro ao criar conta');

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) throw new Error('Conta criada, mas falha ao fazer login automático.');

    return { userId: result.userId, orgId: result.orgId };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      role: user?.role || null,
      orgId: user?.orgId || null,
      signIn,
      signUp,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

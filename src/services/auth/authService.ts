/**
 * Authentication Service
 * Centralizes all Supabase Auth operations
 */

import { supabase } from '../supabase/client';

// Types
export interface RegisterData {
    // Step 1
    accountType: 'company' | 'freelancer';

    // Step 2 - Manager Data
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    channels: string[];

    // Step 3 - Business Data
    companyName: string;
    taxId: string;
    sector: string;
    employeeRange: string;

    // Step 5 - Modules
    activeModules: string[];

    // Optional Channel Data
    whatsappNumber?: string;
    telegramUsername?: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface AuthResult {
    success: boolean;
    error?: string;
    userId?: string;
    orgId?: string;
    linkToken?: string;
}

/**
 * Register a new user with organization
 */
export async function registerUser(data: RegisterData): Promise<AuthResult> {
    try {
        const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/api\/?$/, '');
        
        const response = await fetch(`${baseUrl}/api/public/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: result.error || 'Erro ao registrar utilizador',
            };
        }

        // We still need to sign in the user on the client side so they are logged in.
        // The backend creates the user, but doesn't return a session token that the client can use directly
        // to hydrate the Supabase client without doing a signIn.
        // So we will perform a signIn here right after successful registration.
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        });

        if (signInError) {
             console.error('Sign in after registration failed:', signInError);
             return { success: false, error: 'Conta criada, mas falha ao fazer login automático.' };
        }

        return {
            success: true,
            userId: result.userId,
            orgId: result.orgId,
            linkToken: result.linkToken,
        };
    } catch (error) {
        console.error('Registration error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        };
    }
}

/**
 * Send password reset email
 */
export async function resetPasswordForEmail(email: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/update-password', // or handled by App state
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: 'Erro ao enviar email de recuperação' };
    }
}

/**
 * Login user with email and password
 */
export async function loginUser(data: LoginData): Promise<AuthResult> {
    try {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return {
            success: true,
            userId: authData.user?.id
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro de login'
        };
    }
}

/**
 * Logout current user
 */
export async function logoutUser(): Promise<void> {
    await supabase.auth.signOut();
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

/**
 * Get current user profile from public.users table
 */
export async function getCurrentUserProfile() {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data } = await supabase
        .from('users')
        .select('*, organizations(*)')
        .eq('id', user.id)
        .single();

    return data;
}

/**
 * Check if email already exists
 */
export async function checkEmailExists(email: string): Promise<boolean> {
    try {
        const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/api\/?$/, '');
        const response = await fetch(`${baseUrl}/api/public/check-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        const result = await response.json();
        return result.exists === true;
    } catch (err) {
        console.error('Email check failed:', err);
        return false;
    }
}

/**
 * Check if phone number already exists
 */
export async function checkPhoneExists(phone: string): Promise<boolean> {
    try {
        const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/api\/?$/, '');
        const response = await fetch(`${baseUrl}/api/public/check-phone`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone }),
        });
        const result = await response.json();
        return result.exists === true;
    } catch (err) {
        console.error('Phone check failed:', err);
        return false;
    }
}

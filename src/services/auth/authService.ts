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
}

/**
 * Register a new user with organization
 */
export async function registerUser(data: RegisterData): Promise<AuthResult> {
    try {
        // 1. Create auth user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: {
                    first_name: data.firstName,
                    last_name: data.lastName,
                }
            }
        });

        if (authError) {
            console.error('Auth signup error:', authError);
            return { success: false, error: authError.message };
        }

        if (!authData.user) {
            return { success: false, error: 'Falha ao criar utilizador' };
        }

        const authUserId = authData.user.id;

        // 2. Create organization
        const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .insert({
                name: data.companyName,
                tax_id: data.taxId,
                sector: data.sector,
                employee_range: data.employeeRange,
                account_type: data.accountType,
                active_modules: data.activeModules,
                onboarding_status: 'completed',
            })
            .select('id')
            .single();

        if (orgError) {
            console.error('Organization creation error:', orgError);
            // Cleanup: delete auth user if org creation fails
            await supabase.auth.admin.deleteUser(authUserId);
            return { success: false, error: 'Falha ao criar organização: ' + orgError.message };
        }

        const orgId = orgData.id;

        // 3. Create user profile in public.users table
        const { error: userError } = await supabase
            .from('users')
            .insert({
                id: authUserId, // Use same ID as auth user
                org_id: orgId,
                first_name: data.firstName,
                last_name: data.lastName,
                full_name: `${data.firstName} ${data.lastName}`,
                email: data.email,
                mobile_number: data.phone,
                preferred_channels: data.channels,
                whatsapp_id: data.whatsappNumber,
                telegram_id: data.telegramUsername,
                user_role: 'admin', // Creator is admin
                password: 'managed_by_supabase_auth', // Placeholder for n8n compatibility
            });

        if (userError) {
            console.error('User profile creation error:', userError);
            // Note: We don't delete in this case as the core account exists
            return { success: false, error: 'Falha ao criar perfil: ' + userError.message };
        }

        return {
            success: true,
            userId: authUserId,
            orgId: orgId
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
 * Check if email already exists (uses RPC to bypass RLS)
 */
export async function checkEmailExists(email: string): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .rpc('check_email_exists', { check_email: email });

        if (error) {
            console.error('Email check error:', error);
            // Return false on error - will be caught at registration
            return false;
        }

        return data === true;
    } catch (err) {
        console.error('Email check failed:', err);
        return false;
    }
}

/**
 * Check if phone number already exists (uses RPC to bypass RLS)
 */
export async function checkPhoneExists(phone: string): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .rpc('check_phone_exists', { check_phone: phone });

        if (error) {
            console.error('Phone check error:', error);
            return false;
        }

        return data === true;
    } catch (err) {
        console.error('Phone check failed:', err);
        return false;
    }
}

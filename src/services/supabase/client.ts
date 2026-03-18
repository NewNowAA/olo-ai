import { createClient } from '@supabase/supabase-js';

// ===========================================
// Supabase Client Configuration
// ===========================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase credentials not found. Please check your .env file.');
}

/**
 * Supabase client instance
 * Use this throughout the app for database operations
 */
export const supabase = createClient(
    SUPABASE_URL || '',
    SUPABASE_ANON_KEY || '',
    {
        auth: {
            storageKey: 'olo-ai-auth',
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        },
    }
);

/**
 * Helper to check if Supabase is configured
 */
export const isSupabaseConfigured = (): boolean => {
    return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
};

export default supabase;

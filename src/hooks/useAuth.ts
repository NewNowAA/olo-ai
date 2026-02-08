import { useState, useCallback } from 'react';
import type { PageId, AuthView } from '@/src/types';

// ===========================================
// useAuth Hook
// ===========================================

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user' | 'pro';
    avatar?: string;
}

export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    authView: AuthView;
}

/**
 * Custom hook for managing authentication state
 */
export function useAuth() {
    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: false,
        user: null,
        authView: 'landing',
    });

    const login = useCallback((user?: User) => {
        setAuthState({
            isAuthenticated: true,
            user: user || {
                id: '1',
                name: 'Alex Morgan',
                email: 'alex@lumea.ai',
                role: 'pro',
                avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAA7S9yhFXk294T9os4H2nZ73Ye4sGgPvCL1T6UKO9gSLjjPY2EKJMR0ilYFyCHpANawfLPYXziZ_XjAiTXedd3Zc7Fy8QjiZcepcE9cEW8k_2AKvOeLcJ2Puf3F_1yXe3h1U2_DDDCboIQXcYmfec02eRQ2aF596Ag_HaUeBgBtkaood65M_fDyJxO8EwfZtWFK46AS33k3NoVvezn8stuHWT6aTltqeRns2rk73peLEkStvvJvG4tylKUzJmL54uyUCKFanZ5p1A',
            },
            authView: 'landing',
        });
    }, []);

    const logout = useCallback(() => {
        setAuthState({
            isAuthenticated: false,
            user: null,
            authView: 'landing',
        });
    }, []);

    const setAuthView = useCallback((view: AuthView) => {
        setAuthState(prev => ({ ...prev, authView: view }));
    }, []);

    return {
        ...authState,
        login,
        logout,
        setAuthView,
    };
}

export default useAuth;

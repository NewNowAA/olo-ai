import { useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

// ===========================================
// useDarkMode Hook
// ===========================================

/**
 * Custom hook for managing dark mode state
 * Persists preference and updates document classes
 */
export function useDarkMode(): {
    darkMode: boolean;
    toggleDarkMode: () => void;
    setDarkMode: (value: boolean) => void;
} {
    const [darkMode, setDarkMode] = useLocalStorage<boolean>('darkMode', false);

    // Update document class when dark mode changes
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    const toggleDarkMode = useCallback(() => {
        setDarkMode(!darkMode);
    }, [darkMode, setDarkMode]);

    return {
        darkMode,
        toggleDarkMode,
        setDarkMode,
    };
}

export default useDarkMode;

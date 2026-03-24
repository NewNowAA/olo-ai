// =============================================
// Olo.AI — useAuth Hook
// =============================================
// Thin wrapper around AuthContext — auth state is
// fetched once at the root and shared across all components.

export { useAuthContext as useAuth, useAuthContext } from '../contexts/AuthContext';
export type { AuthUser } from '../contexts/AuthContext';

// Default export for components using `import useAuth from '...'`
export { useAuthContext as default } from '../contexts/AuthContext';

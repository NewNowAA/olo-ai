// =============================================
// Olo.AI — RoleGuard (Inline Visibility)
// =============================================

import React from 'react';
import useAuth from '../../hooks/useAuth';
import type { Role } from '../../types';

interface RoleGuardProps {
  children: React.ReactNode;
  roles: Role[];
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, roles, fallback = null }: RoleGuardProps) {
  const { role } = useAuth();

  if (!role || !roles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default RoleGuard;

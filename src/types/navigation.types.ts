// ===========================================
// Navigation Types
// ===========================================

export type PageId = 'dashboard' | 'billing' | 'ai' | 'goals' | 'builder' | 'settings' | 'help';
export type AuthView = 'landing' | 'login' | 'register';

export interface NavItem {
  id: PageId;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  label: string;
  badge?: string;
}

import {
    LayoutDashboard,
    Receipt,
    BrainCircuit,
    Target,
    PenTool,
    Settings,
    HelpCircle
} from 'lucide-react';
import type { NavItem } from '../types';

// ===========================================
// Navigation Constants
// ===========================================

export const MAIN_NAV_ITEMS: NavItem[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Painel' },
    { id: 'billing', icon: Receipt, label: 'Faturamento' },
    { id: 'ai', icon: BrainCircuit, label: 'Inteligência IA' },
    { id: 'goals', icon: Target, label: 'Metas e Objetivos' },
    { id: 'builder', icon: PenTool, label: 'Construtor', badge: 'Breve' },
];

export const BOTTOM_NAV_ITEMS: NavItem[] = [
    { id: 'settings', icon: Settings, label: 'Configurações' },
    { id: 'help', icon: HelpCircle, label: 'Ajuda e Suporte' },
];

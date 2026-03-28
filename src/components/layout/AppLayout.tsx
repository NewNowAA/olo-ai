// =============================================
// Olo.AI — AppLayout (Owner Dashboard Layout)
// =============================================

import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquare, Bot, Package, Archive,
  Users, Clock, Settings, LogOut, Menu, X, Layers, UserCog
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { FeedbackButton } from './FeedbackButton';

const NAV_ITEMS = [
  { to: '/app/dashboard',    label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/app/conversations',label: 'Conversas',  icon: MessageSquare },
  { to: '/app/agent',        label: 'Agente IA',  icon: Bot },
  { to: '/app/catalog',      label: 'Catálogo',   icon: Package },
  { to: '/app/stock',        label: 'Stock',       icon: Archive },
  { to: '/app/operations',   label: 'Operações',  icon: Layers },
  { to: '/app/customers',    label: 'Clientes',    icon: Users },
  { to: '/app/hours',        label: 'Horário',     icon: Clock },
  { to: '/app/team',         label: 'Equipa',      icon: UserCog },
  { to: '/app/settings',     label: 'Definições',  icon: Settings },
];

export function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-50 text-blue-700'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-gray-200
        flex flex-col transition-transform lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="px-4 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900">🤖 Olo.AI</h1>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
          {user?.name && (
            <p className="text-xs text-gray-500 mt-1 truncate">{user.name}</p>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={linkClass}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 w-full transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600 hover:text-gray-900">
            <Menu size={24} />
          </button>
          <h1 className="text-sm font-bold text-gray-900">🤖 Olo.AI</h1>
          <div className="w-6" />
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
      
      <FeedbackButton />
    </div>
  );
}

export default AppLayout;

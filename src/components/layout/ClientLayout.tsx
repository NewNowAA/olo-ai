// =============================================
// Olo.AI — ClientLayout (Client-Facing Layout)
// =============================================

import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { CalendarDays, ShoppingBag, LogOut } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { FeedbackButton } from './FeedbackButton';

export function ClientLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-50 text-blue-700'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-gray-900">🤖 Olo.AI</h1>
            <nav className="flex items-center gap-1">
              <NavLink to="/client/appointments" className={linkClass}>
                <span className="flex items-center gap-2"><CalendarDays size={16} /> Marcações</span>
              </NavLink>
              <NavLink to="/client/orders" className={linkClass}>
                <span className="flex items-center gap-2"><ShoppingBag size={16} /> Pedidos</span>
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {user?.name && <span className="text-sm text-gray-500">{user.name}</span>}
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <Outlet />
      </main>

      <FeedbackButton />
    </div>
  );
}

export default ClientLayout;

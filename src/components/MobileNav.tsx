import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, FileText, MessageSquare, Clock, Settings } from 'lucide-react';

const navItems = [
  { id: 'dashboard', path: '/dashboard', icon: LayoutGrid, label: 'Painel' },
  { id: 'billing', path: '/billing', icon: FileText, label: 'Faturas' },
  { id: 'ai', path: '/ai', icon: MessageSquare, label: 'IA' },
  { id: 'goals', path: '/goals', icon: Clock, label: 'Metas' },
  { id: 'settings', path: '/settings', icon: Settings, label: 'Ajustes' },
];

const MobileNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area"
      style={{
        backgroundColor: 'var(--sidebar-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div className="flex justify-around items-center p-2">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path) || (item.id === 'dashboard' && location.pathname === '/');
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center w-full py-2 gap-1 transition-colors"
              style={{ color: isActive ? 'var(--blue)' : 'var(--t3)' }}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="text-[10px]" style={{ fontWeight: isActive ? 600 : 400, fontFamily: "'Outfit', sans-serif" }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNav;

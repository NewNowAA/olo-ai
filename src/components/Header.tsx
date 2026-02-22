import React, { useState, useRef, useEffect } from 'react';
import { Search, Calendar, Bell, Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Header: React.FC = () => {
  const { theme, toggleTheme, isDark } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Click outside to close notifications
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifications]);

  const notifications = [
    { id: 1, text: 'Nova fatura processada por IA', time: '2 min', unread: true },
    { id: 2, text: 'Relatório mensal disponível', time: '1h', unread: true },
    { id: 3, text: 'Backup concluído com sucesso', time: '3h', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="h-20 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30"
      style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
      {/* Search */}
      <div className="flex items-center gap-4 flex-1 max-w-lg" id="header-search">
        <div className="relative w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: 'var(--t3)' }} size={18} />
          <input
            type="text"
            className="w-full pl-11 pr-4 py-2.5 border rounded-xl text-[13px] font-sans focus:outline-none focus:ring-2 transition-all"
            style={{
              backgroundColor: 'var(--input-bg)',
              borderColor: 'var(--border)',
              color: 'var(--t1)',
              fontFamily: "'Outfit', sans-serif",
            }}
            placeholder="Pesquisar faturas, clientes..."
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Date Picker */}
        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer"
          style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border)' }}>
          <Calendar size={15} style={{ color: 'var(--t3)' }} />
          <input type="date" className="bg-transparent text-[11.5px] border-none outline-none cursor-pointer"
            style={{ color: 'var(--t2)', fontFamily: "'JetBrains Mono', monospace" }}
            defaultValue={new Date().toISOString().split('T')[0]} />
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 flex items-center justify-center rounded-xl border transition-all relative"
            style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--t2)' }}>
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold text-white"
                style={{ backgroundColor: 'var(--pink)' }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-72 rounded-xl border overflow-hidden shadow-xl z-50"
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', backdropFilter: 'blur(16px)' }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className="text-[13px] font-semibold" style={{ color: 'var(--t1)', fontFamily: "'Outfit', sans-serif" }}>
                  Notificações
                </span>
              </div>
              {notifications.map(n => (
                <div key={n.id}
                  className="px-4 py-3 border-b last:border-b-0 transition-colors cursor-pointer"
                  style={{
                    borderColor: 'var(--border)',
                    backgroundColor: n.unread ? 'var(--blue-a)' : 'transparent',
                  }}>
                  <p className="text-[12px]" style={{ color: 'var(--t1)', fontFamily: "'Outfit', sans-serif" }}>
                    {n.text}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--t3)', fontFamily: "'Outfit', sans-serif" }}>
                    {n.time} atrás
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle — prominent 64x32px slider */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="relative w-16 h-8 rounded-full border transition-all flex items-center overflow-hidden"
          style={{
            backgroundColor: isDark ? 'var(--blue-a)' : 'var(--amber-a)',
            borderColor: 'var(--border)',
          }}>
          <div className="absolute inset-0 flex items-center justify-between px-2 text-xs pointer-events-none">
            <Moon size={13} style={{ color: isDark ? 'var(--blue)' : 'var(--t3)', opacity: isDark ? 1 : 0.4 }} />
            <Sun size={13} style={{ color: !isDark ? 'var(--amber)' : 'var(--t3)', opacity: !isDark ? 1 : 0.4 }} />
          </div>
          <div
            className="w-6 h-6 rounded-full shadow-md transition-transform duration-300"
            style={{
              backgroundColor: isDark ? 'var(--blue)' : 'var(--amber)',
              transform: isDark ? 'translateX(4px)' : 'translateX(36px)',
            }}
          />
        </button>
      </div>
    </header>
  );
};

export default Header;
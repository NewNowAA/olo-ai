import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, FileText, MessageSquare, Clock, Settings, Send } from 'lucide-react';

const navItems = [
  { id: 'dashboard', path: '/dashboard', icon: LayoutGrid, label: 'Painel' },
  { id: 'billing', path: '/billing', icon: FileText, label: 'Faturas' },
  { id: 'ai', path: '/ai', icon: MessageSquare, label: 'IA' },
  { id: 'telegram', path: 'https://t.me/FacturAIBot', icon: Send, label: 'Bot', isExternal: true },
  { id: 'goals', path: '/goals', icon: Clock, label: 'Metas' },
  { id: 'settings', path: '/settings', icon: Settings, label: 'Ajustes' },
];

const MobileNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [userProfile, setUserProfile] = useState<{ telegramId?: string } | null>(null);
  const [showTelegramModal, setShowTelegramModal] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { userService } = await import('../services/userService');
        const profile = await userService.getCurrentProfile();
        if (profile) {
          setUserProfile({
            telegramId: profile.telegram_id,
          });
        }
      } catch (error) {
        console.error('Failed to load user profile in MobileNav', error);
      }
    };
    loadProfile();
  }, [location.pathname]);

  return (
    <>
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
                onClick={() => {
                  if (item.id === 'telegram') {
                    if (!userProfile?.telegramId) {
                      setShowTelegramModal(true);
                      return;
                    }
                  }
                  if (item.isExternal) {
                    window.open(item.path, '_blank', 'noopener,noreferrer');
                  } else {
                    navigate(item.path);
                  }
                }}
                className="flex flex-col items-center justify-center w-full py-2 gap-1 transition-colors"
                style={{ color: isActive && !item.isExternal ? 'var(--blue)' : 'var(--t3)' }}
              >
                <item.icon size={22} strokeWidth={isActive && !item.isExternal ? 2.2 : 1.8} />
                <span className="text-[10px]" style={{ fontWeight: isActive && !item.isExternal ? 600 : 400, fontFamily: "'Outfit', sans-serif" }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Telegram Setup Modal */}
      {showTelegramModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-200"
               style={{ border: '1px solid var(--border)' }}>

            <button
              onClick={() => setShowTelegramModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <div className="text-center mb-6 mt-2">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg"
                   style={{ background: 'linear-gradient(135deg, #0088cc, var(--cyan))' }}>
                <Send size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Ative o Telegram Bot
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Para utilizar o Telegram Bot, é necessário fazer a primeira activação nas{' '}
                <strong className="text-slate-700 dark:text-slate-200">Configurações</strong>.
                Aceda a <em>Configurações → Telegram Bot</em> e siga as instruções para ligar a sua conta.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowTelegramModal(false);
                  navigate('/settings');
                }}
                className="w-full py-3 px-4 rounded-xl text-white font-bold transition-all hover:scale-[1.02] shadow-md flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #0088cc, var(--cyan))' }}
              >
                <Settings size={18} />
                Ir para Configurações
              </button>
              <button
                onClick={() => setShowTelegramModal(false)}
                className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-colors hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                Agora não
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNav;

import React, { useEffect, useState } from 'react';
import {
  LayoutGrid, FileText, MessageSquare, Clock, Layers, Settings,
  Send, Phone, ChevronRight, LogOut, Package, HelpCircle, Headphones,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  // Map routes to IDs for styling logic
  const currentPath = location.pathname.substring(1) || 'dashboard';

  // --- PRESERVED: User Profile State ---
  const [userProfile, setUserProfile] = useState<{ name: string; role: string; avatar?: string; telegramId?: string } | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { userService } = await import('../services/userService');
        const profile = await userService.getCurrentProfile();
        if (profile) {
          setUserProfile({
            name: profile.full_name || profile.email?.split('@')[0] || 'Utilizador',
            role: profile.user_role === 'admin' ? 'Pro' : 'Membro',
            avatar: profile.avatar_url,
            telegramId: profile.telegram_id,
          });
        }
      } catch (error) {
        console.error('Failed to load user profile in Sidebar', error);
      }
    };
    loadProfile();
  }, []);

  // --- PRESERVED: Nav items ---
  const principalItems = [
    { id: 'dashboard', path: '/dashboard', icon: LayoutGrid, label: 'Painel' },
    { id: 'billing',   path: '/billing',   icon: FileText,   label: 'Faturamento' },
    { id: 'ai',        path: '/ai',        icon: MessageSquare, label: 'Consultor IA' },
  ];
  const toolItems = [
    { id: 'goals',     path: '/goals',     icon: Clock,      label: 'Metas' },
    { id: 'inventory', path: '/inventory', icon: Package,    label: 'Inventário', comingSoon: true },
    { id: 'builder',   path: '/builder',   icon: Layers,     label: 'Construtor', comingSoon: true },
  ];
  const systemItems = [
    { id: 'settings', path: '/settings', icon: Settings,    label: 'Configurações' },
    { id: 'support',  path: '/help',     icon: Headphones,  label: 'Suporte & FAQ' },
  ];

  const isActive = (path: string, id: string) => {
    if (id === 'dashboard') return location.pathname === '/' || location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const [showLumeaModal, setShowLumeaModal] = useState(false);
  const [showTelegramModal, setShowTelegramModal] = useState(false);

  const NavItem = ({ item }: { item: typeof principalItems[0] & { badge?: number; comingSoon?: boolean } }) => {
    const active = isActive(item.path, item.id);
    return (
      <button
        key={item.id}
        id={`nav-item-${item.id}`}
        onClick={() => {
          if (item.comingSoon) return;
          if (item.id === 'ai' && !userProfile?.telegramId) {
            setShowLumeaModal(true);
            return;
          }
          handleNavigation(item.path);
        }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${isCollapsed ? 'justify-center' : ''}`}
        style={{
          backgroundColor: active ? 'var(--blue-a)' : 'transparent',
          color: active ? 'var(--blue)' : 'var(--t2)',
          fontFamily: "'Outfit', sans-serif",
          fontSize: '13px',
          fontWeight: active ? 500 : 400,
          cursor: item.comingSoon ? 'not-allowed' : 'pointer',
          opacity: item.comingSoon ? 0.5 : 1,
        }}
        title={isCollapsed ? item.label : ''}
      >
        {active && !isCollapsed && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full" style={{ backgroundColor: 'var(--blue)' }} />
        )}
        <item.icon size={20} strokeWidth={active ? 2.2 : 1.8} />
        {!isCollapsed && (
          <>
            <span className="flex-1 text-left truncate">{item.label}</span>
            {item.badge && (
              <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full text-[10px] font-semibold text-white"
                style={{ backgroundColor: 'var(--blue)', fontSize: '10px' }}>
                {item.badge}
              </span>
            )}
            {item.comingSoon && (
              <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--blue-a)', color: 'var(--blue)', fontSize: '8px' }}>
                Breve
              </span>
            )}
          </>
        )}
      </button>
    );
  };

  const SectionLabel = ({ label }: { label: string }) => (
    !isCollapsed ? (
      <p className="text-[9px] font-semibold uppercase tracking-[1.2px] px-3 pt-5 pb-1.5"
        style={{ color: 'var(--t3)', fontFamily: "'Outfit', sans-serif" }}>
        {label}
      </p>
    ) : <div className="h-4" />
  );

  return (
    <>
    <aside
      className={`h-screen sticky top-0 z-40 transition-all duration-300 ease-in-out hidden md:flex flex-col ${isCollapsed ? 'w-[72px]' : 'w-[232px]'}`}
      style={{
        backgroundColor: 'var(--sidebar-bg)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Logo */}
      <div className={`px-5 py-6 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg"
          style={{ background: 'linear-gradient(135deg, var(--blue), var(--cyan))' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12 L12 2 L22 12 L12 22Z" /></svg>
        </div>
        {!isCollapsed && (
          <span className="text-[14.5px] font-bold tracking-tight" style={{ color: 'var(--t1)', fontFamily: "'Outfit', sans-serif" }}>
            GEFACT.AI
          </span>
        )}
      </div>

      {/* === TOP SECTION: Principal + Ferramentas === */}
      <nav className="flex-1 px-3 overflow-y-auto no-scrollbar flex flex-col">
        <SectionLabel label="Principal" />
        <div className="space-y-0.5">
          {principalItems.map(item => <NavItem key={item.id} item={item} />)}
        </div>

        <SectionLabel label="Ferramentas" />
        <div className="space-y-0.5">
          {toolItems.map(item => <NavItem key={item.id} item={item} />)}
        </div>

        {/* === BOTTOM SECTION: pushed down with margin-top: auto === */}
        <div className="mt-auto pt-4">
          {/* Canais */}
          {!isCollapsed && (
            <>
              <SectionLabel label="Canais" />
              {/* Telegram Card */}
              <button
                onClick={() => {
                  if (!userProfile?.telegramId) {
                    setShowTelegramModal(true);
                  } else {
                    window.open('https://t.me/FacturAIBot', '_blank', 'noopener,noreferrer');
                  }
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mx-0 mb-1 transition-all group cursor-pointer text-left"
                style={{ backgroundColor: 'var(--cyan-a)' }}>
                <Send size={16} style={{ color: 'var(--cyan)' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11.5px] font-semibold" style={{ color: 'var(--t1)', fontFamily: "'Outfit', sans-serif" }}>Telegram Bot</p>
                  <p className="text-[9.5px]" style={{ color: 'var(--t3)', fontFamily: "'Outfit', sans-serif" }}>Envie faturas pelo chat</p>
                </div>
                <ChevronRight size={14} style={{ color: 'var(--cyan)' }} />
              </button>
              {/* WhatsApp Card */}
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mx-0 mb-2 opacity-50 cursor-not-allowed"
                style={{ backgroundColor: 'var(--green-a)' }}>
                <Phone size={16} style={{ color: 'var(--green)' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11.5px] font-semibold" style={{ color: 'var(--t1)', fontFamily: "'Outfit', sans-serif" }}>WhatsApp</p>
                  <p className="text-[9.5px]" style={{ color: 'var(--t3)', fontFamily: "'Outfit', sans-serif" }}>Em breve</p>
                </div>
              </div>
            </>
          )}

          {/* Sistema */}
          <SectionLabel label="Sistema" />
          <div className="space-y-0.5 pb-2">
            {systemItems.map(item => <NavItem key={item.id} item={item} />)}
          </div>
        </div>
      </nav>

      {/* User Profile */}
      <div className="px-3 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <div id="sidebar-user-profile"
          className={`flex items-center gap-3 p-2 rounded-xl transition-colors cursor-pointer ${isCollapsed ? 'justify-center p-0' : ''}`}
          style={{ backgroundColor: 'var(--card)' }}>
          {/* Gradient avatar ring */}
          <div className="w-9 h-9 rounded-full p-[2px] shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--blue), var(--cyan))' }}>
            <img
              src={userProfile?.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=G'}
              alt="User"
              className="w-full h-full rounded-full object-cover border-2"
              style={{ borderColor: 'var(--bg)' }}
            />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-medium truncate" style={{ color: 'var(--t1)', fontFamily: "'Outfit', sans-serif" }}>
                {userProfile?.name || 'Carregando...'}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--cyan)', fontFamily: "'Outfit', sans-serif" }}>
                  {userProfile?.role === 'Pro' ? '✦ PRO' : userProfile?.role || '...'}
                </span>
                <button onClick={onLogout} title="Sair" className="transition-colors" style={{ color: 'var(--t3)' }}>
                  <LogOut size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>

      {/* Lumea Access Modal */}
      {showLumeaModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-200"
               style={{ border: '1px solid var(--border)' }}>
            
            <button 
              onClick={() => setShowLumeaModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <div className="text-center mb-6 mt-2">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg"
                   style={{ background: 'linear-gradient(135deg, var(--blue), var(--cyan))' }}>
                <MessageSquare size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Conecte seu Telegram
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Para usar a Consultora IA Lumea, você precisa conectar sua conta do Telegram primeiro.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowLumeaModal(false);
                  navigate('/settings');
                }}
                className="w-full py-3 px-4 rounded-xl text-white font-bold transition-all hover:scale-[1.02] shadow-md flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, var(--blue), var(--cyan))' }}
              >
                <Settings size={18} />
                Ir para Configurações
              </button>
              <button
                onClick={() => setShowLumeaModal(false)}
                className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-colors hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                Agora não
              </button>
            </div>
          </div>
        </div>
      )}

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

export default Sidebar;
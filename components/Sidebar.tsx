import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  BrainCircuit, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Diamond,
  Target,
  HelpCircle,
  LogOut,
  PenTool
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  currentPage: 'dashboard' | 'billing' | 'ai' | 'goals' | 'builder' | 'settings' | 'help';
  onNavigate: (page: 'dashboard' | 'billing' | 'ai' | 'goals' | 'builder' | 'settings' | 'help') => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar, currentPage, onNavigate, onLogout }) => {
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Painel' },
    { id: 'billing', icon: Receipt, label: 'Faturamento' },
    { id: 'ai', icon: BrainCircuit, label: 'Inteligência IA' },
    { id: 'goals', icon: Target, label: 'Metas e Objetivos' },
    { id: 'builder', icon: PenTool, label: 'Construtor', badge: 'Breve' },
  ];

  return (
    <aside 
      className={`
        h-screen sticky top-0 z-40 transition-all duration-300 ease-in-out flex flex-col
        ${isCollapsed ? 'w-20' : 'w-72'}
        bg-gradient-to-b from-white/20 to-transparent backdrop-blur-md border-r border-white/20
      `}
    >
      {/* Header / Logo */}
      <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl custom-gradient flex items-center justify-center text-white shadow-lg shadow-[#73c6df]/30">
            <Diamond size={20} fill="currentColor" />
          </div>
          {!isCollapsed && (
            <span className="font-extrabold text-xl tracking-tight text-slate-700">
              faturAI
            </span>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto no-scrollbar">
        {navItems.map((item, index) => {
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={index}
              onClick={() => onNavigate(item.id as any)}
              className={`
                w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden
                ${isActive 
                  ? 'bg-white/40 shadow-sm border border-white/30 text-[#2e8ba6]' 
                  : 'text-slate-600 hover:bg-white/20 hover:text-[#73c6df]'}
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title={isCollapsed ? item.label : ''}
            >
              {isActive && !isCollapsed && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#73c6df] rounded-r-full"></div>
              )}

              <item.icon 
                size={22} 
                className={`transition-colors relative z-10 ${isActive ? 'text-[#73c6df]' : 'text-slate-500 group-hover:text-[#73c6df]'}`} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              {!isCollapsed && (
                <span className={`font-semibold text-sm relative z-10 ${isActive ? 'text-slate-800' : ''}`}>
                  {item.label}
                </span>
              )}

              {/* Badge for "Brevemente" */}
              {!isCollapsed && item.badge && (
                <span className="ml-auto text-[9px] font-bold uppercase tracking-wider bg-[#73c6df]/20 text-[#2e8ba6] px-2 py-0.5 rounded-full relative z-10">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Toggle Button */}
      <div className="px-4 mb-4">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-white/20 hover:text-[#73c6df] transition-colors"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Bottom Actions (Settings, Help, Profile) */}
      <div className="p-4 border-t border-white/10 space-y-2 bg-white/5">
        
        {/* Helper Links - Now acting as navigation buttons */}
        <div className={`flex flex-col gap-1 ${isCollapsed ? 'items-center' : ''}`}>
            <button 
                onClick={() => onNavigate('settings')}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${currentPage === 'settings' ? 'bg-white/40 text-[#2e8ba6]' : 'text-slate-500 hover:text-[#73c6df] hover:bg-white/20'} ${isCollapsed ? 'justify-center w-10 px-0' : ''}`}
            >
                <Settings size={20} />
                {!isCollapsed && <span className="text-sm font-medium">Configurações</span>}
            </button>
            <button 
                onClick={() => onNavigate('help')}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${currentPage === 'help' ? 'bg-white/40 text-[#2e8ba6]' : 'text-slate-500 hover:text-[#73c6df] hover:bg-white/20'} ${isCollapsed ? 'justify-center w-10 px-0' : ''}`}
            >
                <HelpCircle size={20} />
                {!isCollapsed && <span className="text-sm font-medium">Ajuda e Suporte</span>}
            </button>
        </div>

        {/* User Profile */}
        <div className={`
          flex items-center gap-3 p-2 rounded-2xl bg-white/40 border border-white/40 hover:bg-white/60 transition-colors cursor-pointer mt-2
          ${isCollapsed ? 'justify-center p-0 w-10 h-10 mx-auto bg-transparent border-0' : ''}
        `}>
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAA7S9yhFXk294T9os4H2nZ73Ye4sGgPvCL1T6UKO9gSLjjPY2EKJMR0ilYFyCHpANawfLPYXziZ_XjAiTXedd3Zc7Fy8QjiZcepcE9cEW8k_2AKvOeLcJ2Puf3F_1yXe3h1U2_DDDCboIQXcYmfec02eRQ2aF596Ag_HaUeBgBtkaood65M_fDyJxO8EwfZtWFK46AS33k3NoVvezn8stuHWT6aTltqeRns2rk73peLEkStvvJvG4tylKUzJmL54uyUCKFanZ5p1A" 
            alt="User" 
            className="w-10 h-10 rounded-full border-2 border-white/50 object-cover"
          />
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">Alex Morgan</p>
              <div className="flex items-center justify-between">
                 <p className="text-[10px] uppercase font-bold text-[#73c6df] tracking-wider">Pro</p>
                 <button onClick={onLogout} title="Sair">
                    <LogOut size={12} className="text-slate-400 hover:text-rose-500" />
                 </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
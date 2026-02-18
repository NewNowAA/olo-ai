import React from 'react';
import { Search, Bell } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
}

const Header: React.FC<HeaderProps> = ({ darkMode }) => {
  return (
    <header className="h-20 px-6 md:px-10 flex items-center justify-between sticky top-0 z-30 bg-transparent backdrop-blur-sm">
      {/* Search */}
      <div className="flex items-center gap-6 w-full max-w-lg" id="header-search">
        <div className="relative w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#73c6df] transition-colors" size={18} />
          <input 
            type="text" 
            className={`
              w-full pl-11 pr-4 py-3 border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#73c6df]/30 shadow-sm transition-all
              ${darkMode 
                ? 'bg-slate-800/50 border-slate-700 text-slate-200 placeholder-slate-500 focus:bg-slate-800' 
                : 'bg-white/40 border-white/60 text-slate-700 placeholder-slate-500 focus:bg-white/80 focus:border-transparent'}
            `}
            placeholder="Pergunte à IA sobre sua receita..." 
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button className={`
          w-11 h-11 flex items-center justify-center rounded-xl border transition-all relative shadow-sm
          ${darkMode 
            ? 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-[#73c6df] hover:bg-slate-800' 
            : 'bg-white/40 border-white/60 text-slate-500 hover:text-[#73c6df] hover:bg-white hover:border-[#73c6df]/30'}
        `}>
          <Bell size={20} />
          <span className="absolute top-3 right-3 w-2 h-2 bg-[#73c6df] border-2 border-white dark:border-slate-800 rounded-full"></span>
        </button>
        
        {/* User profile is in Sidebar, removed Insights button as it was redundant */}
      </div>
    </header>
  );
};

export default Header;
import React from 'react';
import { Construction, ArrowLeft } from 'lucide-react';

interface ComingSoonProps {
  title?: string;
  description?: string;
  onBack?: () => void;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ 
  title = "Em Breve", 
  description = "Estamos trabalhando duro para trazer esta funcionalidade para você. Fique ligado!",
  onBack 
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[600px] p-8 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="w-24 h-24 bg-[#73c6df]/10 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-[#73c6df]/10">
        <Construction size={48} className="text-[#2e8ba6]" />
      </div>
      
      <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 dark:text-white mb-4 tracking-tight">
        {title}
      </h1>
      
      <p className="text-lg text-slate-500 dark:text-slate-400 max-w-lg mb-10 leading-relaxed">
        {description}
      </p>

      {onBack && (
        <button 
          onClick={onBack}
          className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2 shadow-sm"
        >
          <ArrowLeft size={18} />
          Voltar ao Início
        </button>
      )}

      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#73c6df]/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#8bd7bf]/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
    </div>
  );
};

export default ComingSoon;

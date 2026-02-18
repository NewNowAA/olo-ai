import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { MetricData } from '../types';

interface MetricCardProps {
  data: MetricData;
  lastUpdated?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ data, lastUpdated }) => {
  const { title, value, change, isPositive, trend, icon: Icon, colorClass } = data;

  return (
    <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/50 dark:border-slate-700 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${colorClass}`}>
          <Icon size={24} />
        </div>
        {trend === 'peak' && (
           <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-[#73c6df]/10 text-[#73c6df] uppercase tracking-tighter">Pico</span>
        )}
         {trend === 'stable' && (
           <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 uppercase tracking-tighter">Estável</span>
        )}
        {trend === 'up' && (
           <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-[#8bd7bf]/20 text-[#5fb397] uppercase tracking-tighter">Ativo</span>
        )}
      </div>

      <div>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
        <p className="text-3xl font-extrabold text-slate-800 dark:text-white">{value}</p>
        
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {isPositive ? (
              <div className="flex items-center text-[#5fb397] bg-[#8bd7bf]/10 px-2 py-0.5 rounded-lg">
                <TrendingUp size={14} className="mr-1" />
                <span className="text-[11px] font-bold">{change}</span>
              </div>
            ) : (
              <div className="flex items-center text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded-lg">
                <TrendingDown size={14} className="mr-1" />
                <span className="text-[11px] font-bold">{change}</span>
              </div>
            )}
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium ml-1">vs mês anterior</span>
          </div>
        </div>
        
        {lastUpdated && (
             <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-3 text-right">Atualizado: {lastUpdated}</p>
        )}
      </div>
      
      {/* Progress bar simulation for Revenue */}
      {title === 'Receita Total' && (
        <div className="mt-4 h-1.5 w-full bg-slate-200/50 dark:bg-slate-700 rounded-full overflow-hidden">
             <div className="h-full bg-[#8bd7bf] w-[75%] rounded-full"></div>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
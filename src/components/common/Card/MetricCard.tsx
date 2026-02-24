import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from './Card';

// ===========================================
// MetricCard Component - For displaying KPI metrics
// ===========================================

export interface MetricCardProps {
    title: string;
    value: string;
    change: string;
    isPositive: boolean;
    trend: 'up' | 'down' | 'stable' | 'peak';
    icon: React.ComponentType<{ size?: number; className?: string }>;
    colorClass: string;
    lastUpdated?: string;
}

const trendLabels: Record<string, { text: string; className: string }> = {
    peak: { text: 'Pico', className: 'bg-[#73c6df]/10 text-[#73c6df]' },
    stable: { text: 'Estável', className: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300' },
    up: { text: 'Ativo', className: 'bg-[#8bd7bf]/20 text-[#5fb397]' },
    down: { text: 'Queda', className: 'bg-rose-100 text-rose-500' },
};

export const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    change,
    isPositive,
    trend,
    icon: Icon,
    colorClass,
    lastUpdated,
}) => {
    const trendInfo = trendLabels[trend] || trendLabels.stable;

    return (
        <Card hover className="group">
            <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${colorClass}`}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter ${trendInfo.className}`}>
                        {trendInfo.text}
                    </span>
                )}
            </div>

            <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">
                    {title}
                </p>
                <p className="text-3xl font-extrabold text-slate-800 dark:text-white">
                    {value}
                </p>

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
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium ml-1">
                            vs mês anterior
                        </span>
                    </div>
                </div>

                {lastUpdated && (
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-3 text-right">
                        Atualizado: {lastUpdated}
                    </p>
                )}
            </div>
        </Card>
    );
};

export default MetricCard;

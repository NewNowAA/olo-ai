import React, { useEffect, useMemo } from 'react';
import { X, TrendingUp, TrendingDown, Receipt, Banknote, ShoppingCart, Wallet } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Cell,
} from 'recharts';
import { Invoice } from '../types';

// KPI definitions
const KPI_CONFIG: Record<string, {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accentColor: string;
  filterFn?: (inv: Invoice) => boolean;
  valueFn: (invoices: Invoice[]) => number;
}> = {
  invoices: {
    title: 'Total Faturas',
    subtitle: 'Visão geral de todas as faturas registadas',
    icon: <Receipt size={22} />,
    accentColor: 'var(--blue)',
    valueFn: (inv) => inv.length,
  },
  revenue: {
    title: 'Receita Total',
    subtitle: 'Análise detalhada das suas entradas',
    icon: <Banknote size={22} />,
    accentColor: 'var(--green)',
    filterFn: (inv) => inv.type === 'Receita',
    valueFn: (inv) => inv.filter(i => i.type === 'Receita').reduce((s, i) => s + i.amount, 0),
  },
  expenses: {
    title: 'Despesas',
    subtitle: 'Análise detalhada das suas saídas',
    icon: <ShoppingCart size={22} />,
    accentColor: 'var(--pink)',
    filterFn: (inv) => inv.type === 'Despesa',
    valueFn: (inv) => inv.filter(i => i.type === 'Despesa').reduce((s, i) => s + i.amount, 0),
  },
  profit: {
    title: 'Lucro Líquido',
    subtitle: 'Balanço entre receita e despesas',
    icon: <Wallet size={22} />,
    accentColor: 'var(--cyan)',
    valueFn: (inv) => {
      const rev = inv.filter(i => i.type === 'Receita').reduce((s, i) => s + i.amount, 0);
      const exp = inv.filter(i => i.type === 'Despesa').reduce((s, i) => s + i.amount, 0);
      return rev - exp;
    },
  },
};

interface KPIDetailModalProps {
  kpiId: string;
  invoices: Invoice[];
  onClose: () => void;
  trendChange?: number;
}

const KPIDetailModal: React.FC<KPIDetailModalProps> = ({ kpiId, invoices, onClose, trendChange }) => {
  const config = KPI_CONFIG[kpiId];

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Filtered invoices for this KPI
  const relevantInvoices = useMemo(() => {
    if (!config?.filterFn) return invoices;
    return invoices.filter(config.filterFn);
  }, [invoices, config]);

  // Main value
  const mainValue = useMemo(() => config?.valueFn(invoices) || 0, [invoices, config]);

  // Monthly trend data for chart
  const monthlyData = useMemo(() => {
    const byMonth: Record<string, { revenue: number; expense: number; count: number }> = {};
    const sorted = [...invoices].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sorted.forEach(inv => {
      const d = new Date(inv.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = { revenue: 0, expense: 0, count: 0 };
      byMonth[key].count++;
      if (inv.type === 'Receita') byMonth[key].revenue += inv.amount;
      else byMonth[key].expense += inv.amount;
    });

    return Object.entries(byMonth).map(([key, val]) => {
      const [y, m] = key.split('-');
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return {
        name: `${monthNames[parseInt(m) - 1]} ${y.slice(2)}`,
        receita: val.revenue,
        despesa: val.expense,
        lucro: val.revenue - val.expense,
        count: val.count,
      };
    });
  }, [invoices]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    relevantInvoices.forEach(inv => {
      const cat = inv.category || 'Sem categoria';
      cats[cat] = (cats[cat] || 0) + inv.amount;
    });
    return Object.entries(cats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, value]) => ({ name: name.length > 18 ? name.slice(0, 16) + '…' : name, value, fullName: name }));
  }, [relevantInvoices]);

  // Top transactions
  const topTransactions = useMemo(() => {
    return [...relevantInvoices]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [relevantInvoices]);

  // Chart data key based on kpiId
  const chartDataKey = kpiId === 'revenue' ? 'receita'
    : kpiId === 'expenses' ? 'despesa'
    : kpiId === 'profit' ? 'lucro'
    : 'count';

  const chartColor = kpiId === 'revenue' ? '#22C55E'
    : kpiId === 'expenses' ? '#E94C76'
    : kpiId === 'profit' ? '#06B6D4'
    : '#1042FF';

  const barColors = ['#1042FF', '#22C55E', '#E94C76', '#F59E0B', '#8B5CF6', '#06B6D4'];

  const fmtKz = (v: number) => `Kz ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;

  if (!config) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{
          backgroundColor: 'var(--bg)',
          border: '1px solid var(--border)',
          boxShadow: '0 25px 80px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 pb-4 rounded-t-2xl"
          style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `color-mix(in srgb, ${chartColor} 15%, transparent)`, color: chartColor }}>
              {config.icon}
            </div>
            <div>
              <h2 className="text-[16px] font-bold" style={{ color: 'var(--t1)', fontFamily: "'Outfit', sans-serif" }}>
                {config.title}
              </h2>
              <p className="text-[11px]" style={{ color: 'var(--t3)', fontFamily: "'Outfit', sans-serif" }}>
                {config.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:scale-110 transition-transform"
            style={{ backgroundColor: 'var(--input-bg)', color: 'var(--t2)' }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Hero Value */}
          <div className="card-glass p-6 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider mb-1"
                style={{ color: 'var(--t3)', fontFamily: "'Outfit', sans-serif" }}>
                {kpiId === 'invoices' ? 'Total Registadas' : 'Valor Total'}
              </p>
              <p className="text-[32px] font-bold tracking-tight"
                style={{ color: 'var(--t1)', fontFamily: "'JetBrains Mono', monospace" }}>
                {kpiId === 'invoices' ? mainValue : fmtKz(mainValue)}
              </p>
            </div>
            {trendChange !== undefined && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold"
                style={{
                  backgroundColor: trendChange >= 0 ? 'var(--green-a)' : 'var(--red-a)',
                  color: trendChange >= 0 ? 'var(--green)' : 'var(--red)',
                  fontFamily: "'Outfit', sans-serif",
                }}>
                {trendChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {trendChange > 0 ? '+' : ''}{trendChange.toFixed(1)}%
              </div>
            )}
          </div>

          {/* Trend Chart */}
          {monthlyData.length > 0 && (
            <div className="card-glass p-6">
              <h3 className="text-[12px] font-semibold mb-4 uppercase tracking-wider"
                style={{ color: 'var(--t2)', fontFamily: "'Outfit', sans-serif" }}>
                Evolução Mensal
              </h3>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`kpiGrad-${kpiId}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColor} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false}
                      tick={{ fill: 'var(--t3)', fontSize: 10, fontFamily: "'Outfit', sans-serif" }} dy={8} />
                    <YAxis axisLine={false} tickLine={false}
                      tick={{ fill: 'var(--t3)', fontSize: 10 }}
                      tickFormatter={(v) => kpiId === 'invoices' ? v : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: '11px',
                      }}
                      formatter={(value: number) => [kpiId === 'invoices' ? value : fmtKz(value), config.title]}
                    />
                    <Area type="monotone" dataKey={chartDataKey}
                      stroke={chartColor} strokeWidth={2.5}
                      fillOpacity={1} fill={`url(#kpiGrad-${kpiId})`} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Two-column: Category Breakdown + Top Transactions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Breakdown */}
            {categoryData.length > 0 && kpiId !== 'invoices' && (
              <div className="card-glass p-5">
                <h3 className="text-[12px] font-semibold mb-4 uppercase tracking-wider"
                  style={{ color: 'var(--t2)', fontFamily: "'Outfit', sans-serif" }}>
                  Por Categoria
                </h3>
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid horizontal={false} stroke="var(--border)" strokeOpacity={0.3} />
                      <XAxis type="number" axisLine={false} tickLine={false}
                        tick={{ fill: 'var(--t3)', fontSize: 9 }}
                        tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                      <YAxis type="category" dataKey="name" axisLine={false} tickLine={false}
                        tick={{ fill: 'var(--t2)', fontSize: 10, fontFamily: "'Outfit', sans-serif" }} width={100} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card)', borderRadius: '10px',
                          border: '1px solid var(--border)', fontSize: '11px',
                        }}
                        formatter={(value: number) => [fmtKz(value), 'Valor']}
                      />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={14}>
                        {categoryData.map((_, idx) => (
                          <Cell key={idx} fill={barColors[idx % barColors.length]} fillOpacity={0.8} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Top Transactions */}
            <div className={`card-glass p-5 ${kpiId === 'invoices' || categoryData.length === 0 ? 'md:col-span-2' : ''}`}>
              <h3 className="text-[12px] font-semibold mb-4 uppercase tracking-wider"
                style={{ color: 'var(--t2)', fontFamily: "'Outfit', sans-serif" }}>
                Top Transações
              </h3>
              <div className="space-y-2.5">
                {topTransactions.length === 0 ? (
                  <p className="text-[11px]" style={{ color: 'var(--t3)' }}>Sem transações neste período.</p>
                ) : (
                  topTransactions.map((inv, idx) => (
                    <div key={inv.id} className="flex items-center justify-between py-2 px-3 rounded-lg"
                      style={{ backgroundColor: idx % 2 === 0 ? 'var(--input-bg)' : 'transparent' }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium truncate"
                          style={{ color: 'var(--t1)', fontFamily: "'Outfit', sans-serif" }}>
                          {inv.client || 'Desconhecido'}
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--t3)' }}>
                          {new Date(inv.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          {inv.category ? ` • ${inv.category}` : ''}
                        </p>
                      </div>
                      <span className="text-[12px] font-semibold ml-3 whitespace-nowrap"
                        style={{
                          color: inv.type === 'Receita' ? 'var(--green)' : 'var(--pink)',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}>
                        {inv.type === 'Receita' ? '+' : '-'}Kz {inv.amount.toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPIDetailModal;

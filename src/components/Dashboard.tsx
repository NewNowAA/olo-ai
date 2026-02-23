import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  Receipt,
  Banknote,
  ShoppingCart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  RefreshCw,
  Wallet,
  TrendingUp,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, YAxis,
} from 'recharts';
import { invoiceService, analyticsService } from '../services';
import { Invoice } from '../types';
import ReactMarkdown from 'react-markdown';
import { useInvoiceFilters, useChartData } from '../hooks';
import FilterControls from './Shared/FilterControls';
import KPICard from './KPICard';
import KPIDetailModal from './KPIDetailModal';

// --- Main Component ---
interface DashboardProps {
  onNavigate: (page: 'billing') => void;
  lastUpdated: string;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, lastUpdated }) => {
  const [viewMode, setViewMode] = useState<'full' | 'revenue' | 'expenses'>('full');
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedKPI, setSelectedKPI] = useState<string | null>(null);

  // KPI Deeplink: read ?kpi= from URL on mount
  useEffect(() => {
    const kpiParam = searchParams.get('kpi');
    if (kpiParam && ['invoices', 'revenue', 'expenses', 'profit'].includes(kpiParam)) {
      setSelectedKPI(kpiParam);
    }
  }, []);

  const handleKPIClick = useCallback((kpiId: string) => {
    setSelectedKPI(kpiId);
    setSearchParams({ kpi: kpiId }, { replace: true });
  }, [setSearchParams]);

  const handleKPIClose = useCallback(() => {
    setSelectedKPI(null);
    searchParams.delete('kpi');
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  // --- PRESERVED: Data States ---
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- PRESERVED: Hook for filtering and stats ---
  const { filters, setFilter, filteredInvoices, stats } = useInvoiceFilters(invoices);

  // Define order for directional animation
  const modes = ['full', 'revenue', 'expenses'];

  // --- PRESERVED: Data Loading ---
  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [invData, analysisText] = await Promise.all([
        invoiceService.getInvoices(),
        analyticsService.getDailyAnalysis()
      ]);
      setInvoices(invData);
      setAiAnalysis(analysisText);
    } catch (error) {
      console.error("Dashboard data load error", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- PRESERVED: Aggregations & Calculations ---
  const metrics = useMemo(() => {
    const totalRev = stats.totalRevenue;
    const totalExp = stats.totalExpenses;
    const netProfit = stats.profit;
    const totalInvoices = stats.totalTransactions;
    const healthScore = totalRev > 0 ? Math.round(((totalRev - totalExp) / totalRev) * 100) : 0;
    return {
      totalRev, totalExp, netProfit, totalInvoices,
      headerStatus: healthScore > 20 ? 'Excelente' : (healthScore > 0 ? 'Bom' : 'Atenção'),
      healthScore,
      trends: stats.trends,
    };
  }, [stats]);

  const chartData = useChartData(filteredInvoices, filters);

  const recentTransactions = useMemo(() => {
    const sorted = [...invoices].sort((a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime());
    return sorted.slice(0, 5).map(inv => ({
      company: inv.client,
      date: new Date(inv.created_at || inv.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
      amount: inv.amount,
      status: inv.status,
      type: inv.type,
    }));
  }, [invoices]);

  // --- PRESERVED: View switching ---
  const handleViewChange = (mode: 'full' | 'revenue' | 'expenses') => { setViewMode(mode); };
  const getAnimationClass = (modeName: string) => {
    const currentIndex = modes.indexOf(viewMode);
    const targetIndex = modes.indexOf(modeName);
    if (currentIndex === targetIndex) return "opacity-100 translate-x-0 relative z-10 transition-all duration-500 ease-out";
    if (targetIndex < currentIndex) return "opacity-0 -translate-x-[20%] absolute top-0 left-0 w-full pointer-events-none transition-all duration-500 ease-out";
    return "opacity-0 translate-x-[20%] absolute top-0 left-0 w-full pointer-events-none transition-all duration-500 ease-out";
  };

  // --- PRESERVED: AI Card ---
  const AICard = ({ type }: { type: 'full' | 'revenue' | 'expenses' }) => {
    const labels = { full: 'Análise Geral', revenue: 'Inteligência de Receita', expenses: 'Auditoria de Custos' };
    return (
      <div className="card-glass p-5 relative overflow-hidden" style={{ borderLeft: '3px solid var(--blue)' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[9px] font-bold uppercase tracking-[0.8px] px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'var(--blue-a)', color: 'var(--blue)', fontFamily: "'Outfit', sans-serif" }}>
            <Sparkles size={10} className="inline mr-1" />AI Insight
          </span>
          <span className="text-[11px] font-medium" style={{ color: 'var(--t2)', fontFamily: "'Outfit', sans-serif" }}>
            {labels[type]}
          </span>
        </div>
        <div className="text-[12px] leading-[1.6]" style={{ color: 'var(--t2)', fontFamily: "'Outfit', sans-serif", overflowWrap: 'break-word', wordBreak: 'break-word' }}>
          {aiAnalysis ? (
            <ReactMarkdown>{aiAnalysis.slice(0, 500) + (aiAnalysis.length > 500 ? '...' : '')}</ReactMarkdown>
          ) : (
            <p style={{ color: 'var(--t3)' }}>A carregar análise IA...</p>
          )}
        </div>
      </div>
    );
  };

  // --- PRESERVED: Date Filter ---
  const DateFilter = () => (
    <div className="flex justify-end">
      <FilterControls
        dateRange={filters.dateRange}
        customStartDate={filters.customStartDate}
        customEndDate={filters.customEndDate}
        onDateRangeChange={(range) => setFilter('dateRange', range)}
        onCustomDatesChange={(dates) => {
          setFilter('customStartDate', dates.start);
          setFilter('customEndDate', dates.end);
        }}
      />
    </div>
  );

  const fmtKz = (v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toLocaleString();
  const fmtChange = (v: number | undefined) => `${(v || 0) > 0 ? '+' : ''}${(v || 0).toFixed(1)}%`;
  const changeDir = (v: number | undefined) => ((v || 0) >= 0 ? 'up' : 'down') as 'up' | 'down';

  // --- Skeleton ---
  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
        <div className="skeleton h-8 w-56" /><div className="skeleton h-4 w-72 mt-2" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-28" />)}
        </div>
        <div className="skeleton h-80 mt-6" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6 pb-20 overflow-hidden min-h-screen">

      {/* Title + View Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-bold tracking-[-0.4px]" style={{ color: 'var(--t1)', fontFamily: "'Outfit', sans-serif" }}>
            Visão Financeira Unificada
          </h1>
          <p className="text-[12px] mt-1 flex items-center gap-1.5" style={{ color: 'var(--t2)', fontFamily: "'Outfit', sans-serif" }}>
            <Sparkles size={14} style={{ color: 'var(--blue)' }} />
            Saúde financeira: <span style={{ color: 'var(--blue)', fontWeight: 600 }}>{metrics.headerStatus}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={loadData}
            className="px-3 py-2 rounded-xl border text-[12px] font-medium flex items-center gap-1.5 transition-all"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--t2)', fontFamily: "'Outfit', sans-serif" }}>
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Atualizar
          </button>

          {/* View Tabs */}
          <div className="flex items-center rounded-xl border overflow-hidden"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
            {[
              { key: 'full', label: 'Geral' },
              { key: 'revenue', label: 'Receitas' },
              { key: 'expenses', label: 'Despesas' },
            ].map(tab => (
              <button key={tab.key} onClick={() => handleViewChange(tab.key as any)}
                className="px-4 py-2 text-[13.5px] transition-all relative"
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: viewMode === tab.key ? 600 : 500,
                  color: viewMode === tab.key ? 'var(--t1)' : 'var(--t2)',
                  backgroundColor: viewMode === tab.key ? 'var(--blue-a)' : 'transparent',
                }}>
                {tab.label}
                {viewMode === tab.key && (
                  <div className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full" style={{ backgroundColor: 'var(--blue)' }} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative w-full">

        {/* VIEW 1: Full Dashboard */}
        <div className={getAnimationClass('full')}>
          <div className="space-y-6">
            <AICard type="full" />
            <DateFilter />

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard label="Total Faturas" value={metrics.totalInvoices.toString()} unit="" change={`${metrics.totalInvoices}`} changeType="flat" changeSubtext="registadas" accentColor="var(--blue)" delay={0} icon={<Receipt size={18} />} kpiId="invoices" onClick={handleKPIClick} />
              <KPICard label="Receita Total" value={fmtKz(metrics.totalRev)} unit="Kz" change={fmtChange(metrics.trends?.revenueChange)} changeType={changeDir(metrics.trends?.revenueChange)} changeSubtext="vs período anterior" accentColor="var(--green)" delay={80} icon={<Banknote size={18} />} kpiId="revenue" onClick={handleKPIClick} />
              <KPICard label="Despesas" value={fmtKz(metrics.totalExp)} unit="Kz" change={fmtChange(metrics.trends?.expensesChange)} changeType={changeDir(metrics.trends?.expensesChange)} changeSubtext="vs período anterior" accentColor="var(--pink)" delay={160} icon={<ShoppingCart size={18} />} kpiId="expenses" onClick={handleKPIClick} />
              <KPICard label="Lucro Líquido" value={fmtKz(metrics.netProfit)} unit="Kz" change={fmtChange(metrics.trends?.profitChange)} changeType={changeDir(metrics.trends?.profitChange)} changeSubtext="vs período anterior" accentColor="var(--cyan)" delay={240} icon={<TrendingUp size={18} />} kpiId="profit" onClick={handleKPIClick} />
            </div>

            {/* Chart Section */}
            <div className="card-glass p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-3">
                <div>
                  <h2 className="text-[13.5px] font-semibold tracking-[-0.2px]" style={{ color: 'var(--t1)', fontFamily: "'Outfit', sans-serif" }}>Desempenho Financeiro</h2>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--t2)', fontFamily: "'Outfit', sans-serif" }}>Comparativo Receita × Despesa</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--blue)' }} /><span className="text-[10px] font-medium" style={{ color: 'var(--t2)' }}>Receita</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--pink)' }} /><span className="text-[10px] font-medium" style={{ color: 'var(--t2)' }}>Despesa</span></div>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1042FF" stopOpacity={0.2} /><stop offset="95%" stopColor="#1042FF" stopOpacity={0} /></linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#E94C76" stopOpacity={0.1} /><stop offset="95%" stopColor="#E94C76" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--t3)', fontSize: 10, fontWeight: 500 }} dy={10} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'none' }} itemStyle={{ fontWeight: 600, fontSize: 12 }} />
                    <Area type="monotone" dataKey="value" name="Receita" stroke="#1042FF" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                    <Area type="monotone" dataKey="expense" name="Despesa" stroke="#E94C76" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 card-glass p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-[13.5px] font-semibold" style={{ color: 'var(--t1)', fontFamily: "'Outfit', sans-serif" }}>Transações Recentes</h3>
                  <button onClick={() => onNavigate('billing')} className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--blue)', fontFamily: "'Outfit', sans-serif" }}>Ver Tudo</button>
                </div>
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Cliente','Data','Valor','Status'].map(h => (
                        <th key={h} className="text-left pb-3 text-[10.5px] font-semibold uppercase tracking-[0.8px]" style={{ color: 'var(--t3)', fontFamily: "'Outfit', sans-serif" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((t, i) => (
                      <tr key={i} className="group" style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="py-3 text-[13px] font-medium" style={{ color: 'var(--t1)', fontFamily: "'Outfit', sans-serif" }}>{t.company}</td>
                        <td className="py-3 text-[10.5px]" style={{ color: 'var(--t3)', fontFamily: "'Outfit', sans-serif" }}>{t.date}</td>
                        <td className="py-3 text-[12px] font-medium" style={{ color: t.type === 'Receita' ? 'var(--green)' : 'var(--red)', fontFamily: "'JetBrains Mono', monospace" }}>
                          {t.type === 'Receita' ? '+' : '-'}{t.amount.toLocaleString()} Kz
                        </td>
                        <td className="py-3">
                          <span className="text-[9px] font-semibold uppercase tracking-[0.4px] px-2 py-1 rounded-full"
                            style={{
                              backgroundColor: t.status === 'Pago' ? 'var(--green-a)' : t.status === 'Pendente' ? 'var(--amber-a)' : 'var(--red-a)',
                              color: t.status === 'Pago' ? 'var(--green)' : t.status === 'Pendente' ? 'var(--amber)' : 'var(--red)',
                              fontFamily: "'Outfit', sans-serif",
                            }}>
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {recentTransactions.length === 0 && <tr><td colSpan={4} className="text-center py-6 text-[12px]" style={{ color: 'var(--t3)' }}>Nenhuma transação encontrada.</td></tr>}
                  </tbody>
                </table>
              </div>

              {/* Health Score */}
              <div className="card-glass p-6 flex flex-col">
                <h3 className="text-[13.5px] font-semibold mb-4" style={{ color: 'var(--t1)', fontFamily: "'Outfit', sans-serif" }}>Eficiência Financeira</h3>
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="relative w-36 h-36 mb-4">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="var(--border)" strokeWidth="6" fill="transparent" />
                      <circle cx="50" cy="50" r="40" stroke="var(--blue)" strokeWidth="6" fill="transparent" strokeDasharray="251.2" strokeDashoffset={`${251.2 * (1 - metrics.healthScore / 100)}`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[24px] font-semibold" style={{ color: 'var(--t1)', fontFamily: "'JetBrains Mono', monospace" }}>{metrics.healthScore}%</span>
                      <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color: 'var(--t3)', fontFamily: "'Outfit', sans-serif" }}>Score</span>
                    </div>
                  </div>
                  <div className="card-glass p-3 w-full mt-2" style={{ borderLeft: '3px solid var(--blue)' }}>
                    <p className="text-[9px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1" style={{ color: 'var(--blue)', fontFamily: "'Outfit', sans-serif" }}>
                      <Sparkles size={10} /> Conselho IA
                    </p>
                    <p className="text-[11px] leading-relaxed" style={{ color: 'var(--t2)', fontFamily: "'Outfit', sans-serif" }}>
                      {metrics.healthScore > 50 ? "Saúde financeira excelente. Continue!" : "Atenção aos gastos. Otimize despesas."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VIEW 2: Revenue Only */}
        <div className={getAnimationClass('revenue')}>
          <div className="space-y-6">
            <AICard type="revenue" />
            <DateFilter />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <KPICard label="Receita Total" value={fmtKz(metrics.totalRev)} unit="Kz" change={fmtChange(metrics.trends?.revenueChange)} changeType={changeDir(metrics.trends?.revenueChange)} changeSubtext="vs período anterior" accentColor="var(--green)" icon={<Banknote size={18} />} />
              <KPICard label="Transações de Entrada" value={filteredInvoices.filter(i => i.type === 'Receita').length.toString()} unit="" change={`${filteredInvoices.filter(i => i.type === 'Receita').length}`} changeType="flat" changeSubtext="faturas" accentColor="var(--cyan)" icon={<ArrowUpRight size={18} />} />
            </div>
            <div className="card-glass p-6 md:p-8">
              <h2 className="text-[13.5px] font-semibold mb-5" style={{ color: 'var(--t1)', fontFamily: "'Outfit', sans-serif" }}>Evolução da Receita</h2>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs><linearGradient id="colorRevOnly" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1042FF" stopOpacity={0.2} /><stop offset="95%" stopColor="#1042FF" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--t3)', fontSize: 10 }} dy={10} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }} />
                    <Area type="monotone" dataKey="value" name="Receita" stroke="#1042FF" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevOnly)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* VIEW 3: Expenses Only */}
        <div className={getAnimationClass('expenses')}>
          <div className="space-y-6">
            <AICard type="expenses" />
            <DateFilter />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <KPICard label="Despesas Totais" value={fmtKz(metrics.totalExp)} unit="Kz" change={fmtChange(metrics.trends?.expensesChange)} changeType={changeDir(metrics.trends?.expensesChange)} changeSubtext="vs período anterior" accentColor="var(--pink)" icon={<ShoppingCart size={18} />} />
              <KPICard label="Transações de Saída" value={filteredInvoices.filter(i => i.type === 'Despesa').length.toString()} unit="" change={`${filteredInvoices.filter(i => i.type === 'Despesa').length}`} changeType="flat" changeSubtext="faturas" accentColor="var(--red)" icon={<ArrowDownRight size={18} />} />
            </div>
            <div className="card-glass p-6 md:p-8">
              <h2 className="text-[13.5px] font-semibold mb-5" style={{ color: 'var(--t1)', fontFamily: "'Outfit', sans-serif" }}>Análise de Despesas</h2>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs><linearGradient id="colorExpOnly" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#E94C76" stopOpacity={0.2} /><stop offset="95%" stopColor="#E94C76" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--t3)', fontSize: 10 }} dy={10} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }} />
                    <Area type="monotone" dataKey="expense" name="Despesa" stroke="#E94C76" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExpOnly)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* KPI Detail Modal */}
      {selectedKPI && (
        <KPIDetailModal
          kpiId={selectedKPI}
          invoices={filteredInvoices}
          onClose={handleKPIClose}
          trendChange={
            selectedKPI === 'revenue' ? metrics.trends?.revenueChange :
            selectedKPI === 'expenses' ? metrics.trends?.expensesChange :
            selectedKPI === 'profit' ? metrics.trends?.profitChange :
            undefined
          }
        />
      )}
    </div>
  );
};

export default Dashboard;
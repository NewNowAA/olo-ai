import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  BrainCircuit,
  Receipt,
  Banknote,
  ShoppingCart,
  BarChart3,
  Filter,
  MoreHorizontal,
  Building2,
  Rocket,
  Target,
  Users,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  Calendar,
  Clock,
  X,
  Download,
  History,
  ChevronDown,
  CalendarDays,
  TrendingUp,
  AlertTriangle,
  Wallet,
  Zap,
  RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Cell, PieChart as RePieChart, Pie, Cell as ReCell, Legend,
  YAxis
} from 'recharts';
import MetricCard from './MetricCard';
import { invoiceService, analyticsService } from '../src/services';
import { Invoice } from '../src/types';
import ReactMarkdown from 'react-markdown';
import { useInvoiceFilters, useChartData } from '../src/hooks';
import FilterControls from './Shared/FilterControls';

// --- Custom KPI Cards ---

const RevenueMetricCard = ({ title, value, change, icon: Icon }: { title: string, value: string, change: string, icon: any }) => (
  <div className="bg-gradient-to-br from-[#f0fdf4] to-[#ecfeff] dark:from-slate-800 dark:to-slate-800/60 p-6 rounded-[2.5rem] border border-[#ccfbf1] dark:border-slate-700 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-125 duration-500 pointer-events-none">
      <Icon size={120} className="text-[#2dd4bf]" />
    </div>

    <div className="relative z-10 flex flex-col h-full justify-between min-h-[140px]">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-white dark:bg-slate-700 rounded-2xl shadow-sm text-[#0d9488]">
          <Icon size={24} />
        </div>
        <span className="text-xs font-extrabold text-[#0f766e] dark:text-[#5eead4] uppercase tracking-widest opacity-80">{title}</span>
      </div>

      <div>
        <h3 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight mb-2">{value}</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#2dd4bf]/10 px-2 py-1 rounded-lg text-[#0d9488] dark:text-[#2dd4bf] text-xs font-bold">
            <TrendingUp size={14} />
            {change}
          </div>
          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">vs período anterior</span>
        </div>
      </div>
    </div>
  </div>
);

const ExpenseMetricCard = ({ title, value, change, icon: Icon, alert = false, progress }: { title: string, value: string, change: string, icon: any, alert?: boolean, progress: number }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
    {/* Side Accent Line */}
    <div className={`absolute left-0 top-0 bottom-0 w-2 ${alert ? 'bg-rose-500' : 'bg-orange-400'}`}></div>

    <div className="flex justify-between items-start mb-4 pl-4">
      <div>
        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-2xl font-black text-slate-800 dark:text-white">{value}</h3>
      </div>
      <div className={`p-2 rounded-xl ${alert ? 'bg-rose-50 text-rose-500' : 'bg-orange-50 text-orange-500'} dark:bg-slate-700`}>
        <Icon size={20} />
      </div>
    </div>

    <div className="pl-4 mt-auto">
      <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full mb-2 overflow-hidden">
        <div className={`h-full rounded-full ${alert ? 'bg-rose-500' : 'bg-orange-400'}`} style={{ width: `${progress}%` }}></div>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
        {alert ? <AlertTriangle size={12} className="text-rose-500" /> : <TrendingUp size={12} className="text-orange-500" />}
        <span className={alert ? 'text-rose-600 font-bold' : 'text-orange-500 font-bold'}>{change}</span>
        <span className="opacity-70">de variação</span>
      </p>
    </div>
  </div>
);

// --- Main Component ---

interface DashboardProps {
  onNavigate: (page: 'billing') => void;
  lastUpdated: string;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, lastUpdated }) => {
  const [viewMode, setViewMode] = useState<'full' | 'revenue' | 'expenses'>('full');

  // Data States
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hook for filtering and stats
  const { filters, setFilter, filteredInvoices, stats } = useInvoiceFilters(invoices);

  // Modal States
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Define order for directional animation
  const modes = ['full', 'revenue', 'expenses'];

  // --- Data Loading ---
  useEffect(() => {
    loadData();
  }, []);

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

  // --- Aggregations & Calculations (Using stats from hook) ---

  const metrics = useMemo(() => {
    const totalRev = stats.revenue;
    const totalExp = stats.expenses;
    const netProfit = stats.profit;
    const totalInvoices = stats.totalTransactions;

    const healthScore = totalRev > 0 ? Math.round(((totalRev - totalExp) / totalRev) * 100) : 0;

    return {
      totalRev,
      totalExp,
      netProfit,
      totalInvoices,
      headerStatus: healthScore > 20 ? 'Excelente' : (healthScore > 0 ? 'Bom' : 'Atenção'),
      healthScore
    };
  }, [stats]);

  const chartData = useChartData(filteredInvoices, filters);

  const recentTransactions = useMemo(() => {
    // Show the absolute last 3 added invoices (unfiltered by date range)
    // Using created_at for true insertion order
    const sorted = [...invoices].sort((a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime());
    return sorted.slice(0, 3).map(inv => ({
      company: inv.client,
      date: new Date(inv.created_at || inv.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
      amount: `$${inv.amount.toLocaleString()}`,
      status: inv.status,
      icon: inv.type === 'Receita' ? Building2 : ShoppingCart,
      color: inv.type === 'Receita' ? 'text-[#73c6df] bg-[#73c6df]/10' : 'text-rose-500 bg-rose-50',
      statusColor: inv.status === 'Pago' ? 'bg-[#8bd7bf]/20 text-[#4ca68a]' : (inv.status === 'Pendente' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500')
    }));
  }, [invoices]);


  const handleViewChange = (mode: 'full' | 'revenue' | 'expenses') => {
    setViewMode(mode);
  };

  const getAnimationClass = (modeName: string) => {
    const currentIndex = modes.indexOf(viewMode);
    const targetIndex = modes.indexOf(modeName);

    if (currentIndex === targetIndex) {
      return "opacity-100 translate-x-0 relative z-10 transition-all duration-500 ease-out";
    } else if (targetIndex < currentIndex) {
      return "opacity-0 -translate-x-[20%] absolute top-0 left-0 w-full pointer-events-none transition-all duration-500 ease-out";
    } else {
      return "opacity-0 translate-x-[20%] absolute top-0 left-0 w-full pointer-events-none transition-all duration-500 ease-out";
    }
  };

  const AICard = ({ type }: { type: 'full' | 'revenue' | 'expenses' }) => {
    return (
      <div className="p-8 rounded-[2.5rem] bg-slate-800 text-white shadow-lg">
        <h3 className="text-xl font-bold">Computed AI Analysis</h3>
        <p className="mt-4">{type === 'full' ? 'General Analysis' : (type === 'revenue' ? 'Revenue Intelligence' : 'Cost Audit')}</p>
        <p className="text-sm mt-2 opacity-80">{aiAnalysis || "Loading analysis..."}</p>
      </div>
    );
  };

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

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 pb-20 overflow-hidden min-h-screen">

      {/* Title Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Visão Financeira Unificada</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium flex items-center gap-2">
            <Sparkles size={16} className="text-[#73c6df]" />
            Saúde financeira classificada como <span className="text-[#2e8ba6] font-bold">{metrics.headerStatus}</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button onClick={loadData} className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2">
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> Atualizar
          </button>

          {/* Toggle Controls (Main View) */}
          <div className="bg-white/40 dark:bg-slate-800/40 p-1.5 rounded-2xl border border-white/60 dark:border-slate-700 flex items-center shadow-sm backdrop-blur-sm relative">
            {/* Sliding Background */}
            <div
              className={`absolute top-1.5 bottom-1.5 rounded-xl bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600 transition-all duration-300 ease-out z-0`}
              style={{
                left: viewMode === 'full' ? '6px' : viewMode === 'revenue' ? '33.33%' : '66.66%',
                width: 'calc(33.33% - 4px)',
              }}
            />

            <button
              onClick={() => handleViewChange('full')}
              className={`flex-1 px-4 py-2 text-xs font-bold rounded-xl relative z-10 transition-colors ${viewMode === 'full' ? 'text-[#2e8ba6]' : 'text-slate-500 dark:text-slate-400 hover:text-[#2e8ba6]'}`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => handleViewChange('revenue')}
              className={`flex-1 px-4 py-2 text-xs font-bold rounded-xl relative z-10 transition-colors ${viewMode === 'revenue' ? 'text-[#2e8ba6]' : 'text-slate-500 dark:text-slate-400 hover:text-[#2e8ba6]'}`}
            >
              Receita
            </button>
            <button
              onClick={() => handleViewChange('expenses')}
              className={`flex-1 px-4 py-2 text-xs font-bold rounded-xl relative z-10 transition-colors ${viewMode === 'expenses' ? 'text-[#2e8ba6]' : 'text-slate-500 dark:text-slate-400 hover:text-[#2e8ba6]'}`}
            >
              Despesas
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area Container */}
      <div className="relative w-full">

        {/* VIEW 1: Full Dashboard */}
        <div className={getAnimationClass('full')}>
          <div className="space-y-6">

            <AICard type="full" />
            <DateFilter />

            {/* Metric Grid - Real Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                lastUpdated={lastUpdated}
                data={{ title: 'Total de Faturas', value: metrics.totalInvoices.toString(), change: '+0%', isPositive: true, trend: 'stable', icon: Receipt, colorClass: 'bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-300' }}
              />
              <MetricCard
                lastUpdated={lastUpdated}
                data={{ title: 'Receita Total', value: `$${metrics.totalRev.toLocaleString()}`, change: '+--%', isPositive: true, trend: 'up', icon: Banknote, colorClass: 'bg-[#8bd7bf]/20 text-[#4ca68a]' }}
              />
              <MetricCard
                lastUpdated={lastUpdated}
                data={{ title: 'Despesas Totais', value: `$${metrics.totalExp.toLocaleString()}`, change: '-0%', isPositive: false, trend: 'stable', icon: ShoppingCart, colorClass: 'bg-rose-50 text-rose-500 dark:bg-rose-900/30 dark:text-rose-400' }}
              />
              <MetricCard
                lastUpdated={lastUpdated}
                data={{ title: 'Lucro Líquido', value: `$${metrics.netProfit.toLocaleString()}`, change: '+--%', isPositive: metrics.netProfit >= 0, trend: metrics.netProfit >= 0 ? 'peak' : 'down', icon: BarChart3, colorClass: 'bg-[#73c6df]/20 text-[#73c6df]' }}
              />
            </div>

            {/* Chart Section */}
            <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700 rounded-[2.5rem] p-8 md:p-10 relative shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Desempenho Financeiro</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium italic mt-1">Comparativo Receita x Despesa</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#73c6df]"></span>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tighter">Receita</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-rose-400"></span>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tighter">Despesa</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#73c6df" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#73c6df" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                      dy={10}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                      itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="value" name="Receita" stroke="#73c6df" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                    <Area type="monotone" dataKey="expense" name="Despesa" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom Grid: Transactions & Portfolio */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700 rounded-[2.5rem] p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">Transações Recentes (Últimas 3 Adicionadas)</h3>
                  <button onClick={() => onNavigate('billing')} className="text-xs font-extrabold text-[#2e8ba6] hover:underline uppercase tracking-widest">Ver Tudo</button>
                </div>
                <div className="space-y-4">
                  {recentTransactions.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-3xl bg-white/40 dark:bg-slate-700/40 border border-white/50 dark:border-slate-600 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                          <item.icon size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{item.company}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium italic">{item.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{item.amount}</p>
                        <span className={`text-[9px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest ${item.statusColor}`}>{item.status}</span>
                      </div>
                    </div>
                  ))}
                  {recentTransactions.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Nenhuma transação recente encontrada.</p>}
                </div>
              </div>
              <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700 rounded-[2.5rem] p-8 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">Otimizador</h3>
                  <MoreHorizontal className="text-slate-400" size={20} />
                </div>
                <div className="flex-1 flex flex-col justify-center items-center">
                  <div className="relative w-48 h-48 mb-8">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="#f1f5f9" className="dark:stroke-slate-700" strokeWidth="8" fill="transparent" />
                      <circle cx="50" cy="50" r="40" stroke="#73c6df" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset={`${251.2 * (1 - metrics.healthScore / 100)}`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-extrabold text-slate-800 dark:text-white">{metrics.healthScore}%</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Eficiência</span>
                    </div>
                  </div>
                  <div className="mt-8 p-4 w-full bg-[#73c6df]/10 dark:bg-[#73c6df]/5 rounded-2xl border border-[#73c6df]/20 border-dashed">
                    <p className="text-[10px] text-[#2e8ba6] font-bold flex items-center gap-2 mb-2"><Sparkles size={12} /> CONSELHO INTELIGENTE</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      {metrics.healthScore > 50
                        ? "Sua saúde financeira está excelente. Continue assim!"
                        : "Atenção aos gastos. Tente otimizar suas despesas."}
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

            {/* Revenue Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RevenueMetricCard
                title="Receita Total"
                value={`$${metrics.totalRev.toLocaleString()}`}
                change="+--%"
                icon={Banknote}
              />
              <MetricCard
                lastUpdated={lastUpdated}
                data={{ title: 'Transações de Entrada', value: filteredInvoices.filter(i => i.type === 'Receita').length.toString(), change: '+0%', isPositive: true, trend: 'stable', icon: ArrowUpRight, colorClass: 'bg-[#8bd7bf]/20 text-[#4ca68a]' }}
              />
            </div>

            {/* Revenue Chart */}
            <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700 rounded-[2.5rem] p-8 md:p-10 relative shadow-sm">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Evolução da Receita</h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRevOnly" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#73c6df" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#73c6df" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={10} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                    <Area type="monotone" dataKey="value" name="Receita" stroke="#73c6df" strokeWidth={4} fillOpacity={1} fill="url(#colorRevOnly)" />
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

            {/* Expense Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ExpenseMetricCard
                title="Despesas Totais"
                value={`$${metrics.totalExp.toLocaleString()}`}
                change="-0%"
                progress={75} // Example static progress for now, ideally calculated vs budget
                icon={ShoppingCart}
                alert={true}
              />
              <MetricCard
                lastUpdated={lastUpdated}
                data={{ title: 'Transações de Saída', value: filteredInvoices.filter(i => i.type === 'Despesa').length.toString(), change: '+0%', isPositive: false, trend: 'stable', icon: ArrowDownRight, colorClass: 'bg-rose-50 text-rose-500' }}
              />
            </div>

            {/* Expense Chart */}
            <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700 rounded-[2.5rem] p-8 md:p-10 relative shadow-sm">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Análise de Despesas</h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorExpOnly" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={10} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                    <Area type="monotone" dataKey="expense" name="Despesa" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorExpOnly)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
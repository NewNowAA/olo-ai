import React, { useState } from 'react';
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
  Wallet
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, 
  BarChart, Bar, Cell, PieChart as RePieChart, Pie, Cell as ReCell, Legend,
  YAxis
} from 'recharts';
import MetricCard from './MetricCard';

const chartData = [
  { name: 'Jan', value: 2400, expense: 1200 },
  { name: 'Fev', value: 1398, expense: 900 },
  { name: 'Mar', value: 9800, expense: 2300 },
  { name: 'Abr', value: 3908, expense: 1100 },
  { name: 'Mai', value: 4800, expense: 2100 },
  { name: 'Jun', value: 3800, expense: 1800 },
  { name: 'Jul', value: 12500, expense: 4500 },
  { name: 'Ago', value: 8500, expense: 3200 },
  { name: 'Set', value: 14500, expense: 5100 },
  { name: 'Out', value: 18400, expense: 6200 }, // Peak
  { name: 'Nov', value: 11000, expense: 4100 },
  { name: 'Dez', value: 13000, expense: 4800 },
];

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
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">vs mês anterior</span>
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
  const [dateRange, setDateRange] = useState('30days');
  
  // Modal States
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  
  // Define order for directional animation
  const modes = ['full', 'revenue', 'expenses'];
  
  const handleViewChange = (mode: 'full' | 'revenue' | 'expenses') => {
    setViewMode(mode);
  };

  // Helper to determine animation class based on index comparison
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
     const isRevenue = type === 'revenue';
     const isExpense = type === 'expenses';
     
     // Dynamic Colors based on type
     const bgGradient = isExpense 
        ? "bg-gradient-to-br from-rose-400 to-rose-600" 
        : "custom-gradient";
     
     const shadowColor = isExpense ? "shadow-rose-500/20" : "shadow-[#73c6df]/20";
     const iconBg = isExpense ? "bg-white/20" : "bg-white/20";
     const buttonPrimary = isExpense ? "bg-white text-rose-500" : "bg-[#2e8ba6] text-white border border-white/20";
     const buttonSecondary = isExpense ? "bg-white/20 text-white" : "bg-white/90 text-[#2e8ba6]";

     return (
        <div className={`${bgGradient} p-8 rounded-[2.5rem] shadow-lg ${shadowColor} flex flex-col lg:flex-row items-center gap-8 relative overflow-hidden text-white`}>
            {/* Decorative background blurs */}
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/20 blur-[80px] rounded-full pointer-events-none"></div>
            <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-white/10 blur-[60px] rounded-full pointer-events-none"></div>

            <div className={`w-20 h-20 rounded-3xl ${iconBg} backdrop-blur-md shadow-inner border border-white/30 flex-shrink-0 flex items-center justify-center text-white`}>
                <BrainCircuit size={40} />
            </div>
            
            <div className="flex-1 space-y-3 text-center lg:text-left relative z-10">
                <h3 className="text-xl font-bold flex items-center justify-center lg:justify-start gap-3">
                {type === 'full' && "Avaliação Geral Lumea"}
                {type === 'revenue' && "Inteligência de Receita"}
                {type === 'expenses' && "Auditoria de Custos"}
                <span className="px-3 py-1 rounded-full text-[10px] bg-white/20 border border-white/30 text-white uppercase font-extrabold tracking-widest">
                    {type === 'expenses' ? 'Alerta' : 'Otimizado'}
                </span>
                </h3>
                <p className="text-white/90 leading-relaxed text-sm max-w-3xl font-medium">
                {type === 'full' && "Com base na velocidade atual das transações, prevemos um aumento de 22% no Lucro Líquido. Recomendação: Reinvista o excedente de $12k."}
                {type === 'revenue' && "A receita recorrente (ARR) cresceu 4% este mês impulsionada pelo plano Enterprise. A taxa de churn caiu para 0.8%."}
                {type === 'expenses' && "Detectamos um aumento de 15% nos custos de servidor (AWS). Sugerimos migrar instâncias ociosas para spot instances para economizar $400/mês."}
                </p>
                <p className="text-[10px] text-white/60">Última atualização: {lastUpdated}</p>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto relative z-10">
                <button 
                    onClick={() => setIsReportOpen(true)}
                    className={`px-8 py-3 rounded-xl ${buttonSecondary} backdrop-blur-sm text-xs font-bold hover:bg-white transition-all whitespace-nowrap shadow-lg`}
                >
                    Relatório Detalhado
                </button>
                <button className={`px-8 py-3 rounded-xl ${buttonPrimary} text-xs font-bold hover:opacity-90 transition-all shadow-lg whitespace-nowrap`}>
                    Aplicar Estratégias
                </button>
            </div>
        </div>
     );
  };

  const DateFilter = () => (
    <div className="flex justify-end relative">
        <div className="bg-white/60 dark:bg-slate-800/60 p-1 rounded-xl border border-white/60 dark:border-slate-700 flex items-center shadow-sm w-full md:w-auto overflow-x-auto">
            <button 
                onClick={() => { setDateRange('24h'); setIsDatePickerOpen(false); }}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap ${dateRange === '24h' ? 'bg-[#73c6df] text-white' : 'text-slate-500 dark:text-slate-400 hover:text-[#73c6df]'}`}
            >
                <Clock size={12} /> Últimas 24h
            </button>
            <button 
                onClick={() => { setDateRange('30days'); setIsDatePickerOpen(false); }}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${dateRange === '30days' ? 'bg-[#73c6df] text-white' : 'text-slate-500 dark:text-slate-400 hover:text-[#73c6df]'}`}
            >
                30 Dias
            </button>
            <button 
                onClick={() => { setDateRange('year'); setIsDatePickerOpen(false); }}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${dateRange === 'year' ? 'bg-[#73c6df] text-white' : 'text-slate-500 dark:text-slate-400 hover:text-[#73c6df]'}`}
            >
                Este Ano
            </button>
            <div className="relative">
                <button 
                    onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap ${dateRange === 'custom' ? 'bg-[#73c6df] text-white' : 'text-slate-500 dark:text-slate-400 hover:text-[#73c6df]'}`}
                >
                    <Calendar size={12} />
                    Personalizar
                </button>
                
                {/* Custom Date Picker Popup */}
                {isDatePickerOpen && (
                    <div className="absolute top-10 right-0 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-600 z-50 w-72 animate-in fade-in zoom-in-95">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                            <CalendarDays size={16} className="text-[#73c6df]" /> Selecione o Período
                        </h4>
                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Data Inicial</label>
                                <input 
                                    type="date" 
                                    value={customDates.start}
                                    onChange={(e) => setCustomDates({...customDates, start: e.target.value})}
                                    className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-medium dark:text-white focus:outline-none focus:ring-2 focus:ring-[#73c6df]"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Data Final</label>
                                <input 
                                    type="date" 
                                    value={customDates.end}
                                    onChange={(e) => setCustomDates({...customDates, end: e.target.value})}
                                    className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-medium dark:text-white focus:outline-none focus:ring-2 focus:ring-[#73c6df]"
                                />
                            </div>
                            <button 
                                onClick={() => { setDateRange('custom'); setIsDatePickerOpen(false); }}
                                className="w-full py-2 bg-[#2e8ba6] text-white rounded-lg text-xs font-bold hover:bg-[#257a91] transition-colors mt-2"
                            >
                                Aplicar Filtro
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
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
            Saúde financeira classificada como <span className="text-[#2e8ba6] font-bold">Excelente</span>.
          </p>
        </div>
        
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

      {/* Main Content Area Container */}
      <div className="relative w-full">
        
        {/* VIEW 1: Full Dashboard */}
        <div className={getAnimationClass('full')}>
          <div className="space-y-6">
            
            <AICard type="full" />
            <DateFilter />

            {/* Metric Grid - Keep generic MetricCard for Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard 
                lastUpdated={lastUpdated}
                data={{ title: 'Total de Faturas', value: '1.284', change: '+5.2%', isPositive: true, trend: 'up', icon: Receipt, colorClass: 'bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-300' }}
              />
              <MetricCard 
                lastUpdated={lastUpdated}
                data={{ title: 'Receita Total', value: '$482.900', change: '+14.2%', isPositive: true, trend: 'up', icon: Banknote, colorClass: 'bg-[#8bd7bf]/20 text-[#4ca68a]' }}
              />
              <MetricCard 
                lastUpdated={lastUpdated}
                data={{ title: 'Despesas Totais', value: '$140.250', change: '-2.4%', isPositive: false, trend: 'stable', icon: ShoppingCart, colorClass: 'bg-rose-50 text-rose-500 dark:bg-rose-900/30 dark:text-rose-400' }}
              />
              <MetricCard 
                lastUpdated={lastUpdated}
                data={{ title: 'Lucro Líquido', value: '$342.650', change: '+8.1%', isPositive: true, trend: 'peak', icon: BarChart3, colorClass: 'bg-[#73c6df]/20 text-[#73c6df]' }}
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
                        <stop offset="5%" stopColor="#73c6df" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#73c6df" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
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

            {/* Bottom Grid: Transactions & Portfolio (Kept for Overview) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700 rounded-[2.5rem] p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">Transações Recentes</h3>
                  <button onClick={() => onNavigate('billing')} className="text-xs font-extrabold text-[#2e8ba6] hover:underline uppercase tracking-widest">Ver Tudo</button>
                </div>
                <div className="space-y-4">
                  {[
                    { company: 'Quantum Cloud Services', date: '15 Out, 2023', amount: '$4.250,00', status: 'Liquidado', icon: Building2, color: 'text-[#73c6df] bg-[#73c6df]/10', statusColor: 'bg-[#8bd7bf]/20 text-[#4ca68a]' },
                    { company: 'Nexus Data Foundry', date: '14 Out, 2023', amount: '$2.100,00', status: 'Processando', icon: BrainCircuit, color: 'text-[#8bd7bf] bg-[#8bd7bf]/20', statusColor: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' },
                    { company: 'Nebula Systems', date: '13 Out, 2023', amount: '$1.850,00', status: 'Rascunho', icon: Rocket, color: 'text-slate-500 bg-slate-100 dark:bg-slate-700', statusColor: 'bg-slate-100 dark:bg-slate-700 text-slate-500' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-3xl bg-white/40 dark:bg-slate-700/40 border border-white/50 dark:border-slate-600 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                          <item.icon size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{item.company}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium italic">#INV-2024-08{9-idx} • {item.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{item.amount}</p>
                        <span className={`text-[9px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest ${item.statusColor}`}>{item.status}</span>
                      </div>
                    </div>
                  ))}
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
                        <circle cx="50" cy="50" r="40" stroke="#73c6df" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset="45" strokeLinecap="round" />
                        <circle cx="50" cy="50" r="40" stroke="#8bd7bf" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset="180" strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-extrabold text-slate-800 dark:text-white">82%</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Eficiência</span>
                      </div>
                  </div>
                  <div className="mt-8 p-4 w-full bg-[#73c6df]/10 dark:bg-[#73c6df]/5 rounded-2xl border border-[#73c6df]/20 border-dashed">
                      <p className="text-[10px] text-[#2e8ba6] font-bold flex items-center gap-2 mb-2"><Sparkles size={12} /> CONSELHO INTELIGENTE</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">Suas reservas líquidas estão 5% acima do histórico.</p>
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

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <RevenueMetricCard 
                    title="Receita Total" 
                    value="$482.900" 
                    change="+14.2%" 
                    icon={Banknote} 
                 />
                 <RevenueMetricCard 
                    title="MRR (Recorrente)" 
                    value="$124.500" 
                    change="+2.1%" 
                    icon={Briefcase} 
                 />
                 <RevenueMetricCard 
                    title="LTV Médio" 
                    value="$8.200" 
                    change="+5%" 
                    icon={Users} 
                 />
             </div>

             <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700 rounded-[2.5rem] p-8 shadow-sm">
                 <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Tendência de Receita</h2>
                 <div className="h-[400px]">
                     <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenueOnly" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#73c6df" stopOpacity={0.5}/>
                                    <stop offset="95%" stopColor="#73c6df" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                            <Tooltip contentStyle={{ borderRadius: '12px' }} />
                            <Area type="monotone" dataKey="value" stroke="#2e8ba6" strokeWidth={4} fill="url(#colorRevenueOnly)" />
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ExpenseMetricCard 
                        title="Despesas Totais" 
                        value="$140.250" 
                        change="-2.4%" 
                        icon={ShoppingCart} 
                        progress={65}
                    />
                    <ExpenseMetricCard 
                        title="Burn Rate" 
                        value="$32.100" 
                        change="+1.2%" 
                        icon={Rocket} 
                        alert={true} 
                        progress={80}
                    />
                    <ExpenseMetricCard 
                        title="Maiores Ofensores" 
                        value="AWS" 
                        change="Infra" 
                        icon={Building2} 
                        progress={45}
                    />
                </div>

                <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700 rounded-[2.5rem] p-8 shadow-sm">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Detalhamento de Custos</h2>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px' }} />
                                <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
         </div>

      </div>

      {/* --- DETAILED REPORT MODAL --- */}
      {isReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={() => setIsReportOpen(false)}></div>
            <div className="relative bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                
                {/* Modal Header */}
                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#73c6df]/20 text-[#2e8ba6] flex items-center justify-center">
                            <BrainCircuit size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-extrabold text-slate-800 dark:text-white">Relatório de Inteligência Detalhado</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Análise aprofundada gerada pela Lumea AI.</p>
                        </div>
                    </div>
                    <button onClick={() => setIsReportOpen(false)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="px-8 py-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-800">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative group w-full sm:w-64">
                            <History size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select className="w-full pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl appearance-none text-xs font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#73c6df]/30 cursor-pointer">
                                <option>Relatório Atual (Outubro 2023)</option>
                                <option>Setembro 2023</option>
                                <option>Agosto 2023</option>
                                <option>Q3 Consolidado</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-[#2e8ba6] text-white rounded-xl text-xs font-bold hover:bg-[#257a91] transition-all shadow-md w-full sm:w-auto justify-center">
                        <Download size={16} /> Baixar PDF
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white dark:bg-slate-800">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-4">
                             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Resumo Executivo</h3>
                             <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                                 O mês de Outubro apresentou um desempenho excepcional, superando as previsões iniciais em <strong>12.5%</strong>. O principal vetor de crescimento foi a expansão da base de clientes Enterprise, que agora representa 45% da receita total.
                                 <br/><br/>
                                 Entretanto, observa-se uma pressão nos custos de infraestrutura digital, correlacionada diretamente com o aumento de tráfego. A margem de lucro operacional mantém-se saudável em <strong>28%</strong>.
                             </p>
                         </div>
                         <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
                             <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Target size={16} className="text-[#73c6df]" /> Principais Insights</h3>
                             <ul className="space-y-3">
                                 {[
                                     "Taxa de conversão de leads aumentou 2.3% após nova campanha.",
                                     "Churn involuntário reduzido graças ao novo gateway de pagamento.",
                                     "Custo de Aquisição (CAC) estável em $320.",
                                     "Previsão de fluxo de caixa positivo para os próximos 6 meses."
                                 ].map((item, i) => (
                                     <li key={i} className="flex gap-3 text-xs font-medium text-slate-600 dark:text-slate-300">
                                         <span className="w-1.5 h-1.5 rounded-full bg-[#8bd7bf] mt-1.5 shrink-0"></span>
                                         {item}
                                     </li>
                                 ))}
                             </ul>
                         </div>
                     </div>

                     <div>
                         <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Detalhamento por Categoria</h3>
                         <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                             <table className="w-full text-sm text-left">
                                 <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-bold">
                                     <tr>
                                         <th className="px-6 py-3">Categoria</th>
                                         <th className="px-6 py-3">Valor</th>
                                         <th className="px-6 py-3">MoM %</th>
                                         <th className="px-6 py-3">Status</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                     <tr className="dark:text-slate-300">
                                         <td className="px-6 py-4 font-medium">Assinaturas SaaS</td>
                                         <td className="px-6 py-4">$42,300</td>
                                         <td className="px-6 py-4 text-emerald-500 font-bold">+15%</td>
                                         <td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded text-[10px] font-bold uppercase">Acima da Meta</span></td>
                                     </tr>
                                     <tr className="dark:text-slate-300">
                                         <td className="px-6 py-4">Serviços Cloud (AWS)</td>
                                         <td className="px-6 py-4">$12,100</td>
                                         <td className="px-6 py-4 text-rose-500 font-bold">+8%</td>
                                         <td className="px-6 py-4"><span className="px-2 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded text-[10px] font-bold uppercase">Atenção</span></td>
                                     </tr>
                                     <tr className="dark:text-slate-300">
                                         <td className="px-6 py-4">Marketing Digital</td>
                                         <td className="px-6 py-4">$8,500</td>
                                         <td className="px-6 py-4 text-slate-400 font-bold">0%</td>
                                         <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded text-[10px] font-bold uppercase">Estável</span></td>
                                     </tr>
                                 </tbody>
                             </table>
                         </div>
                     </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;

import React, { useState } from 'react';


import { Target, TrendingUp, CheckCircle2, Plus, Flag, Trophy, Clock, X, Bot, Sparkles, Loader2, Users, User, BarChart as BarChartIcon, PieChart as PieChartIcon, BrainCircuit, Pencil, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';
import { geminiService } from '../services';
import { invoiceService } from '../services/invoice/invoiceService';
import { goalsService, Goal } from '../services/goalsService';
import { goalSchema } from '../validation/schemas';

interface GoalsProps {
    lastUpdated: string;
}

const Goals: React.FC<GoalsProps> = ({ lastUpdated }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [analyzing, setAnalyzing] = useState(false);
    const [aiAdvice, setAiAdvice] = useState<string | null>(null);
    const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');

    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);

    const [categories, setCategories] = useState<string[]>([]);
    const [newGoal, setNewGoal] = useState<Partial<Goal>>({
        type: 'Individual',
        kpi: 'Receita',
        start_date: new Date().toISOString().split('T')[0],
        category: '',
        target_type: 'currency',
        color: 'bg-[#73c6df]'
    });


    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

    React.useEffect(() => {
        loadGoals();

    }, [lastUpdated]);

    const loadCategories = (invoices: any[]) => {
        const uniqueCategories = Array.from(new Set(invoices.map((inv: any) => inv.category))).filter(Boolean) as string[];
        setCategories(uniqueCategories);
    };

    const loadGoals = async () => {
        try {
            const [goalsData, invoicesData] = await Promise.all([
                goalsService.getGoals(),
                invoiceService.getInvoices()
            ]);

            loadCategories(invoicesData);

            // Calculate dynamic progress
            const enhancedGoals = goalsData.map(g => {
                // Automate KPIs: Receita, Despesa, Lucro
                if (['Receita', 'Despesa', 'Lucro'].includes(g.kpi || '') && g.start_date) {
                    const startDate = new Date(g.start_date);
                    const deadline = new Date(g.deadline);
                    // Adjust deadline to end of day
                    deadline.setHours(23, 59, 59, 999);

                    const relevantInvoices = invoicesData.filter((inv: any) => {
                        if (!inv.date) return false;
                        const invDate = new Date(inv.date);
                        // Filter by Date
                        if (invDate < startDate || invDate > deadline) return false;
                        // Filter by Category (if set)
                        if (g.category && g.category !== '' && inv.category !== g.category) return false;
                        return true;
                    });

                    let current = 0;

                    if (g.kpi === 'Receita') {
                        current = relevantInvoices
                            .filter((inv: any) => inv.type === 'Receita')
                            .reduce((sum: number, inv: any) => sum + inv.amount, 0);
                    } else if (g.kpi === 'Despesa') {
                        current = relevantInvoices
                            .filter((inv: any) => inv.type === 'Despesa')
                            .reduce((sum: number, inv: any) => sum + inv.amount, 0);
                    } else if (g.kpi === 'Lucro') {
                        const receita = relevantInvoices
                            .filter((inv: any) => inv.type === 'Receita')
                            .reduce((sum: number, inv: any) => sum + inv.amount, 0);
                        const despesa = relevantInvoices
                            .filter((inv: any) => inv.type === 'Despesa')
                            .reduce((sum: number, inv: any) => sum + inv.amount, 0);
                        current = receita - despesa;
                    }

                    // For expenses, if current > target, it might be bad, but progress usually implies "how much of the budget used". 
                    // Or if goal is "Limit expenses to X", then progress > 100% is bad.
                    // For now, we stick to standard progress: (Current / Target) * 100.
                    // If Target is 0 (unlikely), handle division by zero.
                    const progress = g.target_value ? Math.round((current / g.target_value) * 100) : 0;

                    return { ...g, current_value: Number(current.toFixed(2)), progress: Math.min(100, Math.max(0, progress)) };
                }
                return g;
            });

            setGoals(enhancedGoals);
        } catch (error) {
            console.error("Failed to load goals or invoices", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'Em andamento';
            case 'completed': return 'Concluída';
            case 'archived': return 'Arquivada';
            default: return status;
        }
    };

    const filteredGoals = goals.filter(g => {
        if (activeTab === 'active') return g.status === 'active' || !g.status; // Default to active
        if (activeTab === 'history') return g.status === 'completed' || g.status === 'archived';
        return true;
    });

    const pieData = [
        { name: 'Completed', value: goals.filter(g => (g.progress || 0) >= 100).length },
        { name: 'Remaining', value: goals.filter(g => (g.progress || 0) < 100).length },
    ];

    const barData = goals.map(g => ({ name: g.title.substring(0, 10) + '...', progress: g.progress || 0 }));

    const COLORS = ['#1042FF', 'rgba(128,128,128,0.2)'];
    const overallProgress = goals.length > 0 ? Math.round(goals.reduce((acc, curr) => acc + (curr.progress || 0), 0) / goals.length) : 0;

    const handleSaveGoal = async () => {
        // Validation with Zod
        const validationResult = goalSchema.safeParse(newGoal);
        if (!validationResult.success) {
            const fieldErrors = validationResult.error.flatten().fieldErrors;
            const errorMessages = Object.entries(fieldErrors)
                .map(([field, errs]) => `${field}: ${errs?.join(', ')}`)
                .join('\n');
            console.error(`Por favor, corrija os seguintes erros:\n${errorMessages}`);
            return;
        }


        try {
            if (newGoal.id) {
                // Update existing
                await goalsService.updateGoal(newGoal.id, {
                    title: newGoal.title,
                    target_value: Number(newGoal.target_value),
                    deadline: newGoal.deadline,
                    type: newGoal.type as any,
                    kpi: newGoal.kpi || 'Geral',
                    target_type: newGoal.target_type || 'currency'
                });
            } else {
                // Create new
                await goalsService.createGoal({
                    title: newGoal.title,
                    target_value: Number(newGoal.target_value),
                    deadline: newGoal.deadline,
                    type: newGoal.type as any,
                    kpi: newGoal.kpi || 'Geral',
                    target_type: newGoal.target_type || 'currency'
                });
            }
            await loadGoals();
            setIsModalOpen(false);
            setNewGoal({
                type: 'Individual',
                kpi: 'Receita',
                color: 'bg-[#73c6df]',
                start_date: new Date().toISOString().split('T')[0],
                category: '',
                target_type: 'currency'
            });
        } catch (error) {
            console.error("Error saving goal", error);
        }
    };

    const handleDeleteGoal = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Tem certeza que deseja excluir esta meta?')) return;
        try {
            await goalsService.deleteGoal(id);
            await loadGoals();
        } catch (error) {
            console.error("Error deleting goal", error);
        }
    };

    const handleCompleteGoal = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Deseja marcar esta meta como conclúida e movê-la para o histórico?')) return;
        try {
            await goalsService.updateGoalStatus(id, 'completed');
            await loadGoals();
        } catch (error) {
            console.error("Error completing goal", error);
        }
    };

    const handleEditGoal = (goal: Goal, e: React.MouseEvent) => {
        e.stopPropagation();
        setNewGoal({
            id: goal.id,
            title: goal.title,
            target_value: goal.target_value,
            deadline: goal.deadline,
            type: goal.type,
            kpi: goal.kpi,
            color: goal.color,
            start_date: goal.start_date,
            category: goal.category,
            target_type: goal.target_type || 'currency'
        });
        setIsModalOpen(true);
    };

    const openNewGoalModal = () => {
        setNewGoal({
            type: 'Individual',
            kpi: 'Receita',
            color: 'bg-[#73c6df]',
            start_date: new Date().toISOString().split('T')[0],
            category: '',
            target_type: 'currency'
        });
        setIsModalOpen(true);
    };

    const generateAIAnalysis = async () => {
        setAnalyzing(true);
        try {
            const goalsList = goals.map(g => `- ${g.title} (${g.progress}% completo, Prazo: ${g.deadline})`).join('\n');
            const prompt = `Analise essas metas corporativas e dê um feedback curto e estratégico de 2 frases sobre como acelerar o progresso: \n${goalsList}`;

            const advice = await geminiService.analyzeGoals(prompt);
            setAiAdvice(advice);
        } catch (e) {
            setAiAdvice("Não foi possível conectar à IA no momento.");
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 pb-20">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--t1)' }}>Metas e Objetivos</h1>
                    <p className="mt-2 font-medium" style={{ color: 'var(--t2)' }}>Acompanhe o progresso estratégico da empresa.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={generateAIAnalysis}
                        disabled={analyzing}
                        className="px-5 py-2.5 rounded-xl border text-sm font-bold shadow-sm transition-all flex items-center gap-2 hover:opacity-80"
                        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--blue)', color: 'var(--blue)' }}
                    >
                        {analyzing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                        {analyzing ? 'Analisando...' : 'Análise IA'}
                    </button>
                    <button
                        onClick={openNewGoalModal}
                        className="px-5 py-2.5 rounded-xl text-white font-bold text-sm transition-all shadow-lg active:scale-95 flex items-center gap-2"
                        style={{ background: 'linear-gradient(135deg, var(--blue), var(--cyan))' }}
                    >
                        <Plus size={18} /> Nova Meta
                    </button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card-glass p-5 rounded-[2rem] flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" style={{ background: 'linear-gradient(135deg, rgba(16, 66, 255, 0.1), transparent)' }}></div>
                    <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: 'var(--t3)' }}>Metas Ativas</p>
                    <p className="text-3xl font-extrabold" style={{ color: 'var(--t1)' }}>{goals.filter(g => g.status === 'active' || !g.status).length}</p>
                </div>
                <div className="card-glass p-5 rounded-[2rem] flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), transparent)' }}></div>
                    <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: 'var(--t3)' }}>Concluídas</p>
                    <p className="text-3xl font-extrabold" style={{ color: 'var(--t1)' }}>{goals.filter(g => g.status === 'completed').length}</p>
                </div>
                <div className="card-glass p-5 rounded-[2rem] flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), transparent)' }}></div>
                    <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: 'var(--t3)' }}>Taxa de Sucesso</p>
                    <p className="text-3xl font-extrabold" style={{ color: 'var(--t1)' }}>{goals.length > 0 ? Math.round((goals.filter(g => g.status === 'completed').length / goals.length) * 100) : 0}%</p>
                </div>
                <div className="card-glass p-5 rounded-[2rem] flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" style={{ background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.1), transparent)' }}></div>
                    <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: 'var(--t3)' }}>Média Progresso</p>
                    <p className="text-3xl font-extrabold" style={{ color: 'var(--blue)' }}>{overallProgress}%</p>
                </div>
            </div>

            {/* Tabs for History */}
            <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('active')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'active' ? 'bg-white dark:bg-slate-700 shadow-sm text-[#2e8ba6]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                >
                    Ativas
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white dark:bg-slate-700 shadow-sm text-[#2e8ba6]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                >
                    Histórico
                </button>
            </div>

            {/* AI Advice Section */}
            {aiAdvice && activeTab === 'active' && (
                <div className="card-glass p-8 rounded-[2rem] flex flex-col lg:flex-row items-center gap-8 relative overflow-hidden animate-in fade-in slide-in-from-top-4" style={{ background: 'linear-gradient(135deg, var(--blue-dark), var(--blue))', color: 'white' }}>
                    <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 blur-[80px] rounded-full pointer-events-none"></div>

                    <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md shadow-inner border border-white/30 flex-shrink-0 flex items-center justify-center text-white">
                        <BrainCircuit size={32} />
                    </div>

                    <div className="flex-1 relative z-10">
                        <div className="flex justify-between items-start">
                            <h3 className="text-lg font-bold mb-2">Feedback Estratégico Lumea</h3>
                            <button onClick={() => setAiAdvice(null)} className="text-white/70 hover:text-white"><X size={18} /></button>
                        </div>
                        <p className="text-white/90 leading-relaxed text-sm font-medium">{aiAdvice}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Goal Card (Only show if activeTab is active) */}
                {activeTab === 'active' && (
                    <div className="md:col-span-2 card-glass p-8 rounded-[2.5rem] relative flex flex-col justify-between group">
                        {filteredGoals.length > 0 ? (
                            <>
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white shadow-sm shadow-blue-500/20" style={{ background: 'linear-gradient(135deg, var(--blue), var(--cyan))' }}>Meta Principal</span>
                                            <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: 'var(--t3)' }}><Clock size={12} /> {filteredGoals[0].deadline}</span>
                                        </div>
                                        <h2 className="text-2xl font-extrabold" style={{ color: 'var(--t1)' }}>{filteredGoals[0].title}</h2>
                                        <p className="mt-1 max-w-lg text-sm font-medium" style={{ color: 'var(--t2)' }}>Foco principal da organização no momento.</p>
                                    </div>
                                    <div className="w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: 'var(--bg)', color: 'var(--blue)' }}>
                                        <Trophy size={32} />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-4xl font-extrabold" style={{ color: 'var(--t1)' }}>
                                            {filteredGoals[0].target_type === 'percentage' 
                                                ? `${filteredGoals[0].current_value}%` 
                                                : `$${filteredGoals[0].current_value}`}
                                        </span>
                                        <span className="text-sm font-bold" style={{ color: 'var(--t3)' }}>
                                            Alvo: {filteredGoals[0].target_type === 'percentage' 
                                                ? `${filteredGoals[0].target_value}%` 
                                                : `$${filteredGoals[0].target_value}`}
                                        </span>
                                    </div>
                                    <div className="w-full h-4 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border)' }}>
                                        <div className="h-full rounded-full shadow-sm relative transition-all duration-1000" style={{ width: `${filteredGoals[0].progress}%`, background: 'linear-gradient(135deg, var(--blue), var(--cyan))' }}>
                                            <div className="absolute right-0 top-0 bottom-0 w-1 animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.4)' }}></div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold" style={{ color: 'var(--t3)' }}>
                                        <span>Progresso atual</span>
                                        <div className="flex flex-col items-end">
                                            <span>{filteredGoals[0].progress}% Concluído</span>
                                            <span className="text-[9px] opacity-70 mt-0.5">Atualizado: {lastUpdated}</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <Flag size={48} className="text-slate-300 mb-4" />
                                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">Sem metas ativas</h3>
                                <p className="text-slate-500 dark:text-slate-400 mt-2">Crie sua primeira meta para começar a acompanhar o progresso.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Progress Chart Card */}
                {activeTab === 'active' && (
                    <div className="card-glass p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center relative">
                        <div className="absolute top-6 right-6 flex gap-1 bg-white/50 dark:bg-slate-700/50 rounded-lg p-1">
                            <button
                                onClick={() => setChartType('pie')}
                                className={`p-1.5 rounded-md transition-all shadow-sm ${chartType === 'pie' ? 'text-white' : 'text-slate-400'}`}
                                style={chartType === 'pie' ? { backgroundColor: 'var(--blue)' } : {}}
                            >
                                <PieChartIcon size={14} />
                            </button>
                            <button
                                onClick={() => setChartType('bar')}
                                className={`p-1.5 rounded-md transition-all shadow-sm ${chartType === 'bar' ? 'text-white' : 'text-slate-400'}`}
                                style={chartType === 'bar' ? { backgroundColor: 'var(--blue)' } : {}}
                            >
                                <BarChartIcon size={14} />
                            </button>
                        </div>

                        <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--t1)' }}>Taxa de Sucesso</h3>

                        <div className="w-full h-48 relative">
                            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                                {chartType === 'pie' ? (
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={75}
                                            paddingAngle={5}
                                            dataKey="value"
                                            startAngle={90}
                                            endAngle={-270}
                                            stroke="none"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                ) : (
                                    <BarChart data={barData}>
                                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                        <Bar dataKey="progress" fill="#73c6df" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                )}
                            </ResponsiveContainer>

                            {chartType === 'pie' && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-3xl font-extrabold text-slate-800 dark:text-white">{overallProgress}%</span>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 font-medium">Média ponderada de todas as metas ativas.</p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">Atualizado: {lastUpdated}</p>
                    </div>
                )}
            </div>

            {/* Goals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGoals.map((goal) => (
                    <div
                        key={goal.id}
                        className="card-glass rounded-[2rem] p-6 hover:opacity-90 transition-all group relative cursor-pointer"
                        onClick={(e) => handleEditGoal(goal, e)}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex gap-2">
                                <div className="p-2 bg-white dark:bg-slate-700 rounded-xl text-slate-500 dark:text-slate-300 shadow-sm">
                                    {goal.progress >= 100 || goal.status === 'completed' ? <CheckCircle2 size={20} className="text-emerald-500" /> : <Target size={20} />}
                                </div>
                                {goal.type === 'Conjunta' && (
                                    <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-500 dark:text-slate-300 shadow-sm" title="Meta Conjunta">
                                        <Users size={20} />
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest ${goal.progress >= 100 || goal.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                                    {getStatusLabel(goal.status || 'active')}
                                </span>
                                {goal.status === 'active' && (
                                    <button
                                        onClick={(e) => handleCompleteGoal(goal.id, e)}
                                        className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                        title="Concluir Meta"
                                    >
                                        <CheckCircle2 size={14} />
                                    </button>
                                )}
                                <button
                                    onClick={(e) => handleDeleteGoal(goal.id, e)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white mb-1 pr-4">{goal.title}</h3>
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-xs text-slate-400 font-medium flex items-center gap-1">KPI: {goal.kpi} {goal.category && <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[9px]">{goal.category}</span>}</p>
                            <div className="text-right">
                                <p className="text-[9px] text-slate-400">Prazo: {goal.deadline}</p>
                                {goal.start_date && <p className="text-[9px] text-slate-400/70">Início: {goal.start_date}</p>}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border)' }}>
                                <div className={`h-full rounded-full ${goal.status === 'completed' ? 'bg-emerald-500' : ''}`} style={goal.status !== 'completed' ? { width: `${goal.progress}%`, background: 'linear-gradient(135deg, var(--blue), var(--cyan))' } : { width: `${goal.progress}%` }}></div>
                            </div>
                            <span className="text-xs font-bold" style={{ color: 'var(--t1)' }}>{goal.progress}%</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2 text-right">
                            {goal.target_type === 'percentage' 
                                ? `${goal.current_value}% / ${goal.target_value}%` 
                                : `$${goal.current_value.toLocaleString()} / $${goal.target_value.toLocaleString()}`}
                        </p>
                    </div>
                ))}

                {activeTab === 'active' && (
                    <button onClick={openNewGoalModal} className="border border-dashed card-glass rounded-[2rem] p-6 flex flex-col items-center justify-center transition-all gap-3 min-h-[180px] hover:opacity-80" style={{ borderColor: 'var(--blue)', color: 'var(--blue)' }}>
                        <Plus size={32} />
                        <span className="font-bold text-sm">Adicionar Novo Objetivo</span>
                    </button>
                )}
            </div>

            {/* --- New/Edit Goal Modal --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={() => setIsModalOpen(false)}></div>

                    <div className="relative bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <div>
                                <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">{newGoal.id ? 'Editar Meta' : 'Criar Nova Meta'}</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Defina os parâmetros para o sucesso.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>

                        <div className="p-8 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Nome da Meta</label>
                                <input
                                    type="text"
                                    value={newGoal.title || ''}
                                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#73c6df]/30 font-medium dark:text-white"
                                    placeholder="Ex: Aumentar Leads em 20%"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">KPI Alvo</label>
                                    <select
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#73c6df]/30 font-medium text-slate-600 dark:text-slate-200"
                                        value={newGoal.kpi}
                                        onChange={(e) => setNewGoal({ ...newGoal, kpi: e.target.value })}
                                    >
                                        <option value="Receita">Receita (Automático)</option>
                                        <option value="Despesa">Despesa (Automático)</option>
                                        <option value="Lucro">Lucro (Automático)</option>
                                        <option value="Churn">Churn Rate</option>
                                        <option value="Leads">Novos Leads</option>
                                        <option value="NPS">NPS</option>
                                        <option value="Cashflow">Fluxo de Caixa</option>
                                        <option value="Geral">Outro</option>
                                    </select>

                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Categoria (Opcional)</label>
                                    <select
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#73c6df]/30 font-medium text-slate-600 dark:text-slate-200"
                                        value={newGoal.category || ''}
                                        onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                                    >
                                        <option value="">Todas as Categorias</option>
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Tipo</label>
                                    <div className="flex bg-slate-50 dark:bg-slate-700 p-1 rounded-xl border border-slate-200 dark:border-slate-600">
                                        <button
                                            onClick={() => setNewGoal({ ...newGoal, type: 'Individual' })}
                                            className={`flex-1 py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${newGoal.type === 'Individual' ? 'bg-white dark:bg-slate-600 shadow-sm text-[#73c6df]' : 'text-slate-400'}`}
                                        >
                                            <User size={12} /> Indiv.
                                        </button>
                                        <button
                                            onClick={() => setNewGoal({ ...newGoal, type: 'Conjunta' })}
                                            className={`flex-1 py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${newGoal.type === 'Conjunta' ? 'bg-white dark:bg-slate-600 shadow-sm text-[#73c6df]' : 'text-slate-400'}`}
                                        >
                                            <Users size={12} /> Time
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Formato do Alvo</label>
                                    <div className="flex bg-slate-50 dark:bg-slate-700 p-1 rounded-xl border border-slate-200 dark:border-slate-600">
                                        <button
                                            onClick={() => setNewGoal({ ...newGoal, target_type: 'currency' })}
                                            className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${newGoal.target_type === 'currency' ? 'bg-white dark:bg-slate-600 shadow-sm text-[#73c6df]' : 'text-slate-400'}`}
                                        >
                                            Valor ($/Kz)
                                        </button>
                                        <button
                                            onClick={() => setNewGoal({ ...newGoal, target_type: 'percentage' })}
                                            className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${newGoal.target_type === 'percentage' ? 'bg-white dark:bg-slate-600 shadow-sm text-[#73c6df]' : 'text-slate-400'}`}
                                        >
                                            Percentagem (%)
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Valor Alvo</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#73c6df]/30 font-medium dark:text-white"
                                        placeholder="Ex: 50000"
                                        value={newGoal.target_value || ''}
                                        onChange={(e) => setNewGoal({ ...newGoal, target_value: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Data Início</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#73c6df]/30 font-medium text-slate-600 dark:text-slate-200"
                                        value={newGoal.start_date || ''}
                                        onChange={(e) => setNewGoal({ ...newGoal, start_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Prazo</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#73c6df]/30 font-medium text-slate-600 dark:text-slate-200"
                                        value={newGoal.deadline || ''}
                                        onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-[#73c6df]/10 dark:bg-[#73c6df]/5 rounded-2xl border border-[#73c6df]/20">
                                <div className="p-2 bg-white dark:bg-slate-700 rounded-full text-[#2e8ba6] shadow-sm"><Sparkles size={16} /></div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-700 dark:text-white">Monitoramento Inteligente</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">A IA analisará o progresso diariamente.</p>
                                </div>
                                <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                    <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-[#73c6df]" defaultChecked />
                                    <label htmlFor="toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-slate-300 dark:bg-slate-600 cursor-pointer checked:bg-[#73c6df]"></label>
                                </div>
                            </div>

                            <button
                                onClick={handleSaveGoal}
                                className="w-full py-4 rounded-xl bg-[#2e8ba6] text-white font-bold hover:bg-[#257a91] shadow-lg flex items-center justify-center gap-2 mt-2"
                            >
                                <Flag size={18} /> {newGoal.id ? 'Salvar Alterações' : 'Definir Meta'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div >
    );
};

export default Goals;
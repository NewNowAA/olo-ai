
import React, { useState } from 'react';
import { Target, TrendingUp, CheckCircle2, Plus, Flag, Trophy, Clock, X, Bot, Sparkles, Loader2, Users, User, BarChart as BarChartIcon, PieChart as PieChartIcon, BrainCircuit, Pencil, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';
import { geminiService } from '@/src/services';
import { goalsService, Goal } from '@/src/services/goalsService';

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

    const [newGoal, setNewGoal] = useState<Partial<Goal>>({
        type: 'Individual',
        kpi: 'Receita',
        color: 'bg-[#73c6df]'
    });

    // Fetch goals on mount
    React.useEffect(() => {
        loadGoals();
    }, [lastUpdated]);

    const loadGoals = async () => {
        try {
            const data = await goalsService.getGoals();
            setGoals(data);
        } catch (error) {
            console.error("Failed to load goals", error);
        } finally {
            setLoading(false);
        }
    };

    const pieData = [
        { name: 'Completed', value: goals.filter(g => (g.progress || 0) >= 100).length },
        { name: 'Remaining', value: goals.filter(g => (g.progress || 0) < 100).length },
    ];

    const barData = goals.map(g => ({ name: g.title.substring(0, 10) + '...', progress: g.progress || 0 }));

    const COLORS = ['#73c6df', '#e2e8f0'];
    const overallProgress = goals.length > 0 ? Math.round(goals.reduce((acc, curr) => acc + (curr.progress || 0), 0) / goals.length) : 0;

    const handleSaveGoal = async () => {
        if (!newGoal.title || !newGoal.target_value || !newGoal.deadline) return;

        try {
            if (newGoal.id) {
                // Update existing
                await goalsService.updateGoal(newGoal.id, {
                    title: newGoal.title,
                    target_value: Number(newGoal.target_value),
                    deadline: newGoal.deadline,
                    type: newGoal.type as any,
                    kpi: newGoal.kpi || 'Geral'
                });
            } else {
                // Create new
                await goalsService.createGoal({
                    title: newGoal.title,
                    target_value: Number(newGoal.target_value),
                    deadline: newGoal.deadline,
                    type: newGoal.type as any,
                    kpi: newGoal.kpi || 'Geral'
                });
            }
            await loadGoals();
            setIsModalOpen(false);
            setNewGoal({ type: 'Individual', kpi: 'Receita', color: 'bg-[#73c6df]' });
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

    const handleEditGoal = (goal: Goal, e: React.MouseEvent) => {
        e.stopPropagation();
        setNewGoal({
            id: goal.id,
            title: goal.title,
            target_value: goal.target_value,
            deadline: goal.deadline,
            type: goal.type,
            kpi: goal.kpi,
            color: goal.color
        });
        setIsModalOpen(true);
    };

    const openNewGoalModal = () => {
        setNewGoal({ type: 'Individual', kpi: 'Receita', color: 'bg-[#73c6df]' });
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
                    <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Metas e Objetivos</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Acompanhe o progresso estratégico da empresa.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={generateAIAnalysis}
                        disabled={analyzing}
                        className="px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-[#73c6df] text-[#2e8ba6] font-bold text-sm hover:bg-[#73c6df]/10 transition-all flex items-center gap-2"
                    >
                        {analyzing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                        {analyzing ? 'Analisando...' : 'Análise IA'}
                    </button>
                    <button
                        onClick={openNewGoalModal}
                        className="px-5 py-2.5 rounded-xl bg-[#2e8ba6] text-white font-bold text-sm hover:bg-[#257a91] transition-all shadow-lg shadow-[#73c6df]/20 flex items-center gap-2"
                    >
                        <Plus size={18} /> Nova Meta
                    </button>
                </div>
            </div>

            {/* AI Advice Section */}
            {aiAdvice && (
                <div className="custom-gradient p-8 rounded-[2rem] shadow-lg shadow-[#73c6df]/20 flex flex-col lg:flex-row items-center gap-8 relative overflow-hidden text-white animate-in fade-in slide-in-from-top-4">
                    <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/20 blur-[80px] rounded-full pointer-events-none"></div>

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
                {/* Main Goal Card */}
                <div className="md:col-span-2 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700 p-8 rounded-[2.5rem] relative overflow-hidden flex flex-col justify-between group">
                    {goals.length > 0 ? (
                        <>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-3 py-1 bg-[#8bd7bf]/20 text-[#4ca68a] rounded-full text-[10px] font-bold uppercase tracking-widest">Meta Principal</span>
                                        <span className="text-slate-400 dark:text-slate-500 text-xs font-bold flex items-center gap-1"><Clock size={12} /> {goals[0].deadline}</span>
                                    </div>
                                    <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">{goals[0].title}</h2>
                                    <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-lg">Foco principal da organização no momento.</p>
                                </div>
                                <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-2xl shadow-sm flex items-center justify-center text-[#73c6df] group-hover:scale-110 transition-transform">
                                    <Trophy size={32} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-4xl font-extrabold text-slate-800 dark:text-white">${goals[0].current_value}</span>
                                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Alvo: ${goals[0].target_value}</span>
                                </div>
                                <div className="w-full h-4 bg-white/60 dark:bg-slate-700/60 rounded-full overflow-hidden border border-white/50 dark:border-slate-600">
                                    <div className="h-full bg-gradient-to-r from-[#73c6df] to-[#8bd7bf] rounded-full shadow-sm relative transition-all duration-1000" style={{ width: `${goals[0].progress}%` }}>
                                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/40 animate-pulse"></div>
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                                    <span>Progresso atual</span>
                                    <div className="flex flex-col items-end">
                                        <span>{goals[0].progress}% Concluído</span>
                                        <span className="text-[9px] opacity-70 mt-0.5">Atualizado: {lastUpdated}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <Flag size={48} className="text-slate-300 mb-4" />
                            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">Sem metas definidas</h3>
                            <p className="text-slate-500 dark:text-slate-400 mt-2">Crie sua primeira meta para começar a acompanhar o progresso.</p>
                        </div>
                    )}
                </div>

                {/* Progress Chart Card */}
                <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700 p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center relative">
                    <div className="absolute top-6 right-6 flex gap-1 bg-white/50 dark:bg-slate-700/50 rounded-lg p-1">
                        <button
                            onClick={() => setChartType('pie')}
                            className={`p-1.5 rounded-md transition-all ${chartType === 'pie' ? 'bg-[#73c6df] text-white shadow-sm' : 'text-slate-400'}`}
                        >
                            <PieChartIcon size={14} />
                        </button>
                        <button
                            onClick={() => setChartType('bar')}
                            className={`p-1.5 rounded-md transition-all ${chartType === 'bar' ? 'bg-[#73c6df] text-white shadow-sm' : 'text-slate-400'}`}
                        >
                            <BarChartIcon size={14} />
                        </button>
                    </div>

                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Taxa de Sucesso</h3>

                    <div className="w-full h-48 relative">
                        <ResponsiveContainer width="100%" height="100%">
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
            </div>

            {/* Goals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.map((goal) => (
                    <div
                        key={goal.id}
                        className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/50 dark:border-slate-700 rounded-[2rem] p-6 hover:bg-white/60 dark:hover:bg-slate-700/60 transition-all group relative cursor-pointer"
                        onClick={(e) => handleEditGoal(goal, e)}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex gap-2">
                                <div className="p-2 bg-white dark:bg-slate-700 rounded-xl text-slate-500 dark:text-slate-300 shadow-sm">
                                    {goal.progress >= 100 ? <CheckCircle2 size={20} className="text-emerald-500" /> : <Target size={20} />}
                                </div>
                                {goal.type === 'Conjunta' && (
                                    <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-500 dark:text-slate-300 shadow-sm" title="Meta Conjunta">
                                        <Users size={20} />
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest ${goal.progress >= 100 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                                    {goal.status}
                                </span>
                                <button
                                    onClick={(e) => handleDeleteGoal(goal.id, e)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white mb-1 pr-4">{goal.title}</h3>
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-xs text-slate-400 font-medium flex items-center gap-1">KPI: {goal.kpi}</p>
                            <p className="text-[9px] text-slate-400">Prazo: {goal.deadline}</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-slate-200/50 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${goal.color}`} style={{ width: `${goal.progress}%` }}></div>
                            </div>
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{goal.progress}%</span>
                        </div>
                    </div>
                ))}

                <button onClick={openNewGoalModal} className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-[2rem] p-6 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:border-[#73c6df] hover:text-[#73c6df] hover:bg-[#73c6df]/5 transition-all gap-3 min-h-[180px]">
                    <Plus size={32} />
                    <span className="font-bold text-sm">Adicionar Novo Objetivo</span>
                </button>
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
                                        <option value="Receita">Receita</option>
                                        <option value="Churn">Churn Rate</option>
                                        <option value="Leads">Novos Leads</option>
                                        <option value="NPS">NPS</option>
                                        <option value="Cashflow">Fluxo de Caixa</option>
                                        <option value="Geral">Outro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Tipo</label>
                                    <div className="flex bg-slate-50 dark:bg-slate-700 p-1 rounded-xl border border-slate-200 dark:border-slate-600">
                                        <button
                                            onClick={() => setNewGoal({ ...newGoal, type: 'Individual' })}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 ${newGoal.type === 'Individual' ? 'bg-white dark:bg-slate-600 shadow-sm text-[#2e8ba6]' : 'text-slate-400'}`}
                                        >
                                            <User size={12} /> Indiv.
                                        </button>
                                        <button
                                            onClick={() => setNewGoal({ ...newGoal, type: 'Conjunta' })}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 ${newGoal.type === 'Conjunta' ? 'bg-white dark:bg-slate-600 shadow-sm text-[#2e8ba6]' : 'text-slate-400'}`}
                                        >
                                            <Users size={12} /> Time
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
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

        </div>
    );
};

export default Goals;
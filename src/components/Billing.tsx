import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
    Plus,
    Search,
    Download,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    CheckCircle2,
    AlertCircle,
    FileText,
    ChevronDown,
    Wand2,
    Calendar,
    DollarSign,
    Minus,
    LayoutGrid,
    LayoutList,
    Trash2,
    Eye,
    RefreshCw,
    Filter,
    ArrowUpDown,
    BrainCircuit,
    Banknote,
    ShoppingCart,
    Briefcase,
    TrendingUp,
    MoreVertical,
    Edit3,
    X,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    ChevronFirst,
    ChevronLast
} from 'lucide-react';
import { Invoice, InvoiceStatus, InvoiceType, ExpenseType, ReviewStatus } from '../types';
import { invoiceService, analyticsService, supabase } from '../services';
import { pdfService } from '../services/pdfService';
import { useInvoiceFilters } from '../hooks';
import FilterControls from './Shared/FilterControls';
import Breadcrumbs from './Shared/Breadcrumbs';
import { Loader2 } from 'lucide-react';
import { ConfirmationModal } from './common';
import { InvoiceModal } from './billing_parts/InvoiceModal';
import { AnalysisModal } from './billing_parts/AnalysisModal';

interface BillingProps {
    onNavigate?: (page: 'dashboard' | 'billing' | 'ai' | 'goals' | 'builder' | 'settings' | 'help') => void;
}

const StatusDropdown = ({ invoice, onUpdate }: { invoice: Invoice; onUpdate: (updatedInvoice: Invoice) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const statuses: InvoiceStatus[] = ['Pendente', 'Pago', 'Atrasado'];

    const handleChange = async (newStatus: InvoiceStatus) => {
        try {
            await invoiceService.updateInvoice(invoice.id!, { status: newStatus });
            onUpdate({ ...invoice, status: newStatus });
        } catch (e) {
            console.error('Status update failed', e);
        }
        setIsOpen(false);
    };

    return (
        <div className="relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsOpen(!isOpen)} className={`
          px-3 py-1 rounded-full text-[10px] font-bold uppercase cursor-pointer
          hover:ring-2 hover:ring-offset-1 hover:ring-[#73c6df]/30 transition-all
          ${invoice.status === 'Pago' ? 'bg-[#f0fdf4] text-[#15803d]' : ''}
          ${invoice.status === 'Pendente' ? 'bg-amber-50 text-amber-600' : ''}
          ${invoice.status === 'Atrasado' ? 'bg-rose-50 text-rose-500' : ''}
        `}>
                <div className={`w-1.5 h-1.5 rounded-full inline-block mr-1.5 ${
                    invoice.status === 'Pago' ? 'bg-[#15803d]' :
                    invoice.status === 'Pendente' ? 'bg-amber-500' : 'bg-rose-500'
                }`}></div>
                {invoice.status} <ChevronDown size={10} className="inline ml-1 opacity-50" />
            </button>
            {isOpen && (
                <div className="absolute top-full mt-1 left-0 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl shadow-lg z-50 py-1 min-w-[120px]">
                    {statuses.filter(s => s !== invoice.status).map(s => (
                        <button key={s} onClick={() => handleChange(s)}
                            className="w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-300">
                            {s}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const Billing: React.FC<BillingProps> = ({ onNavigate }) => {
    // --- State ---
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [searchParams, setSearchParams] = useSearchParams();

    // Pagination & Sorting State
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [sortField, setSortField] = useState<keyof Invoice | string>('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [isExporting, setIsExporting] = useState(false);

    // Hook for centralized filtering and stats
    const { filters, setFilter, filteredInvoices, stats } = useInvoiceFilters(invoices);

    const [selectedInvoiceForAnalysis, setSelectedInvoiceForAnalysis] = useState<Invoice | null>(null);

    // AI Analysis
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisTimestamp, setAnalysisTimestamp] = useState<Date | null>(null);
    const [countdown, setCountdown] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);
    
    // Category Options
    const defaultCategories = ['Software', 'Consultoria', 'Infraestrutura', 'Marketing', 'Escritório', 'Salários', 'Impostos'];
    const [availableCategories, setAvailableCategories] = useState(defaultCategories);

    // Custom Confirmation/Alert State
    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm?: () => void;
        type: 'danger' | 'info' | 'success';
        singleButton?: boolean;
    }>({ isOpen: false, title: '', message: '', type: 'info' });

    const showAlert = (title: string, message: string, type: 'danger' | 'info' | 'success' = 'info') => {
        setConfirmation({ isOpen: true, title, message, type, singleButton: true });
    };

    const showConfirm = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'info' | 'warning' = 'info') => {
        setConfirmation({
            isOpen: true,
            title,
            message,
            onConfirm,
            type: type === 'warning' ? 'info' : type as any,
            singleButton: false
        });
    };

    // Load Data
    useEffect(() => {
        loadInvoices();
        loadAnalysis();

        // Realtime Subscription
        const channel = supabase
            .channel('billing-all-invoices')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'invoices' },
                () => { loadInvoices(); }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const loadInvoices = async () => {
        setIsLoading(true);
        try {
            const data = await invoiceService.getInvoices();
            setInvoices(data);
            const usedCategories = Array.from(new Set(data.map(i => i.category).filter(Boolean)));
            setAvailableCategories(prev => Array.from(new Set([...prev, ...usedCategories])));

            // Deep Linking Check
            const invoiceIdParam = searchParams.get('invoiceId');
            if (invoiceIdParam) {
                const targetInvoice = data.find(inv => inv.id === invoiceIdParam);
                if (targetInvoice) {
                    setSelectedInvoiceForAnalysis(targetInvoice);
                }
            }
        } catch (error) {
            console.error('Error loading invoices:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Reset pagination when filters change
    useEffect(() => { setCurrentPage(1); }, [filters]);

    // Derived State: Sorting & Pagination
    const sortedInvoices = useMemo(() => {
        return [...filteredInvoices].sort((a, b) => {
            const valA = (a as any)[sortField];
            const valB = (b as any)[sortField];
            const mod = sortDirection === 'asc' ? 1 : -1;
            if (typeof valA === 'string' && typeof valB === 'string') return valA.localeCompare(valB) * mod;
            return ((valA as number) - (valB as number)) * mod;
        });
    }, [filteredInvoices, sortField, sortDirection]);

    const totalPages = Math.ceil(sortedInvoices.length / rowsPerPage);
    const paginatedInvoices = sortedInvoices.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleExportCSV = () => {
        setIsExporting(true);
        try {
            const headers = ['Data', 'Cliente', 'Categoria', 'Tipo', 'Valor', 'Status', 'Revisão'];
            const rows = sortedInvoices.map(inv => [
                new Date(inv.date).toLocaleDateString(),
                inv.client,
                inv.category,
                inv.type,
                inv.amount.toString(),
                inv.status,
                inv.review_status || 'Não Revisado'
            ]);

            const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `faturas_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } finally {
            setIsExporting(false);
        }
    };

    const loadAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            const text = await analyticsService.getDailyAnalysis();
            setAiAnalysis(text);
            setAnalysisTimestamp(new Date());
        } catch (e) {
            console.warn("Failed to load AI analysis", e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Countdown timer
    // Keyboard Shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            // Ctrl/Cmd + N = Nova fatura
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                openNewInvoice();
            }
            // Ctrl/Cmd + E = Exportar
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                handleExportCSV();
            }
            // Escape = fechar modais
            if (e.key === 'Escape') {
                setIsModalOpen(false);
                setSelectedInvoiceForAnalysis(null);
            }
            // Delete = excluir selecionados
            if (e.key === 'Delete' && selectedInvoices.length > 0) {
                handleBulkDelete();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [selectedInvoices]);

    useEffect(() => {
        const computeCountdown = () => {
            const now = new Date();
            const next7am = new Date(now);
            next7am.setHours(7, 0, 0, 0);
            if (now >= next7am) next7am.setDate(next7am.getDate() + 1);
            const diff = next7am.getTime() - now.getTime();
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setCountdown(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        };
        computeCountdown();
        const interval = setInterval(computeCountdown, 1000);
        return () => clearInterval(interval);
    }, []);

    // --- Handlers ---

    const handleAddCategory = (category: string) => {
        setAvailableCategories(prev => [...new Set([...prev, category])]);
    };

    const openNewInvoice = () => {
        setInvoiceToEdit(null);
        setIsModalOpen(true);
    };

    const openEditModal = (invoice: Invoice) => {
        setInvoiceToEdit(invoice);
        setIsModalOpen(true);
    };

    const handleDeleteInvoice = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        showConfirm(
            'Excluir Fatura',
            'Tem certeza que deseja excluir esta fatura? Esta ação não pode ser desfeita.',
            async () => {
                try {
                    await invoiceService.deleteInvoice(id);
                    showAlert('Sucesso', 'Fatura excluída com sucesso.', 'success');
                    loadInvoices(); // Optimistic update handled by realtime or reload
                } catch (error) {
                    console.error('Error deleting invoice:', error);
                    showAlert('Erro', 'Não foi possível excluir a fatura.', 'danger');
                }
            },
            'danger'
        );
    };

    const handleBulkDelete = () => {
        if (selectedInvoices.length === 0) return;
        showConfirm(
            'Excluir Faturas Selecionadas',
            `Tem certeza que deseja excluir ${selectedInvoices.length} faturas?`,
            async () => {
                try {
                    await Promise.all(selectedInvoices.map(id => invoiceService.deleteInvoice(id)));
                    showAlert('Sucesso', 'Faturas excluídas com sucesso.', 'success');
                    setSelectedInvoices([]);
                    loadInvoices();
                } catch (error) {
                    console.error(error);
                    showAlert('Erro', 'Erro ao excluir faturas.', 'danger');
                }
            },
            'danger'
        );
    };

    const toggleSelection = (id: string) => {
        setSelectedInvoices(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    // --- Render ---
    return (
        <div className="p-6 md:p-10 max-w-[1600px] mx-auto min-h-screen pb-20">
            <Breadcrumbs />
            
            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 {/* Total Revenue */}
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors"></div>
                    <div className="relative">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl text-emerald-600 dark:text-emerald-400">
                                <TrendingUp size={24} />
                            </div>
                            <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">
                                +12.5% <ArrowUpRight size={14} className="ml-1" />
                            </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Receita Total</p>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white">Kz {stats.totalRevenue.toLocaleString()}</h3>
                    </div>
                </div>

                {/* Total Expenses */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl group-hover:bg-rose-500/10 transition-colors"></div>
                    <div className="relative">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-2xl text-rose-600 dark:text-rose-400">
                                <ArrowDownRight size={24} />
                            </div>
                            <span className="flex items-center text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded-lg">
                                +4.2% <ArrowUpRight size={14} className="ml-1" />
                            </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Despesas</p>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white">Kz {stats.totalExpenses.toLocaleString()}</h3>
                    </div>
                </div>

                {/* Net Profit */}
                <div className="bg-gradient-to-br from-[#2e8ba6] to-[#1a6b85] p-6 rounded-[2rem] shadow-lg shadow-[#2e8ba6]/20 relative overflow-hidden text-white group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors"></div>
                    <div className="relative">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                <DollarSign size={24} className="text-white" />
                            </div>
                        </div>
                        <p className="text-cyan-100 text-xs font-bold uppercase tracking-wider mb-1">Lucro Líquido</p>
                        <h3 className="text-3xl font-black text-white">Kz {(stats.totalRevenue - stats.totalExpenses).toLocaleString()}</h3>
                    </div>
                </div>

                {/* Pending */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-colors"></div>
                    <div className="relative">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-2xl text-amber-600 dark:text-amber-400">
                                <Clock size={24} />
                            </div>
                            <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">
                                {invoices.filter(i => i.status === 'Pendente').length} faturas
                            </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Pendente</p>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white">Kz {stats.pendingAmount.toLocaleString()}</h3>
                    </div>
                </div>
            </div>

            {/* AI Analysis Bar */}
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#73c6df] via-[#2e8ba6] to-[#73c6df] animate-gradient bg-[length:200%_100%]"></div>
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-gradient-to-br from-[#73c6df] to-[#2e8ba6] rounded-xl text-white shadow-lg shadow-[#73c6df]/20">
                                <BrainCircuit size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Análise Financeira Diária</h3>
                            <button 
                                onClick={loadAnalysis} 
                                disabled={isAnalyzing}
                                className="ml-auto p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors disabled:opacity-50"
                            >
                                <RefreshCw size={16} className={`text-slate-400 ${isAnalyzing ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                        
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50 relative min-h-[120px]">
                            {isAnalyzing ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
                                    <Loader2 size={24} className="animate-spin text-[#2e8ba6]" />
                                    <span className="text-xs font-medium animate-pulse">Gerando insights com IA...</span>
                                </div>
                            ) : aiAnalysis ? (
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <ReactMarkdown 
                                        components={{
                                            p: ({node, ...props}) => <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-3 last:mb-0" {...props} />,
                                            strong: ({node, ...props}) => <strong className="font-bold text-slate-800 dark:text-slate-100" {...props} />,
                                            ul: ({node, ...props}) => <ul className="list-disc pl-4 space-y-1 mb-3" {...props} />,
                                            li: ({node, ...props}) => <li className="text-slate-600 dark:text-slate-300 text-sm" {...props} />
                                        }}
                                    >
                                        {aiAnalysis}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <div className="text-center text-slate-400 py-4">
                                    <p className="text-sm">Nenhuma análise disponível para hoje.</p>
                                    <button onClick={loadAnalysis} className="mt-2 text-[#2e8ba6] text-xs font-bold hover:underline">Gerar Análise Agora</button>
                                </div>
                            )}
                        </div>
                    </div>
                
                    <div className="md:w-72 flex-none flex flex-col justify-center border-l border-slate-100 dark:border-slate-700 pl-8">
                         <div className="text-center">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Próxima Análise Em</span>
                            <div className="text-3xl font-black text-slate-800 dark:text-white font-mono tracking-tight mb-2">
                                {countdown}
                            </div>
                            <p className="text-xs text-slate-500">Atualizado automaticamente às 07:00</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col lg:flex-row justify-between gap-6 items-end lg:items-center sticky top-0 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xl z-30 py-4 -mx-4 px-4 border-b border-slate-200/50 dark:border-slate-700/50 mt-8 mb-6">
                <FilterControls
                    dateRange={filters.dateRange}
                    customStartDate={filters.customStartDate}
                    customEndDate={filters.customEndDate}
                    onDateRangeChange={(range) => setFilter('dateRange', range)}
                    onCustomDatesChange={(dates) => {
                        setFilter('customStartDate', dates.start);
                        setFilter('customEndDate', dates.end);
                    }}
                    searchText={filters.searchText}
                    onSearchChange={(text) => setFilter('searchText', text)}
                    availableCategories={availableCategories}
                    categoryFilter={filters.subcategoryFilter}
                    onCategoryChange={(cat) => setFilter('subcategoryFilter', cat)}
                />
                <div className="flex gap-3">
                    <button onClick={handleExportCSV} disabled={isExporting || filteredInvoices.length === 0} className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        <Download size={16} /> Exportar CSV
                    </button>
                    <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-slate-100 dark:bg-slate-700 text-[#2e8ba6]' : 'text-slate-400 hover:text-slate-600'}`}><LayoutList size={20} /></button>
                        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-slate-700 text-[#2e8ba6]' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={20} /></button>
                    </div>
                    <button onClick={openNewInvoice} className="px-6 py-3 bg-[#2e8ba6] hover:bg-[#257a91] text-white rounded-xl font-bold shadow-lg shadow-[#2e8ba6]/20 flex items-center gap-2 transition-all active:scale-95">
                        <Plus size={20} /> Nova Fatura
                    </button>
                </div>
            </div>

            {/* Content View */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-96">
                    <Loader2 size={48} className="text-[#2e8ba6] animate-spin mb-4" />
                    <p className="text-slate-400 font-medium animate-pulse">Carregando suas finanças...</p>
                </div>
            ) : viewMode === 'list' ? (
                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-8 py-5 text-left"><input type="checkbox" className="rounded border-slate-300 text-[#2e8ba6] focus:ring-[#2e8ba6]" onChange={(e) => setSelectedInvoices(e.target.checked ? paginatedInvoices.map(i => i.id || '') : [])} checked={selectedInvoices.length === paginatedInvoices.length && paginatedInvoices.length > 0} /></th>
                                    
                                    <th className="px-6 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-[#2e8ba6] transition-colors group" onClick={() => handleSort('client')}>
                                        <div className="flex items-center gap-1">
                                            Fatura / Cliente
                                            {sortField === 'client' ? (sortDirection === 'asc' ? <ChevronUp size={14} className="text-[#2e8ba6]"/> : <ChevronDown size={14} className="text-[#2e8ba6]"/>) : <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />}
                                        </div>
                                    </th>

                                    <th className="px-6 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-[#2e8ba6] transition-colors group" onClick={() => handleSort('category')}>
                                        <div className="flex items-center gap-1">
                                            Categoria
                                            {sortField === 'category' ? (sortDirection === 'asc' ? <ChevronUp size={14} className="text-[#2e8ba6]"/> : <ChevronDown size={14} className="text-[#2e8ba6]"/>) : <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />}
                                        </div>
                                    </th>

                                    <th className="px-6 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-[#2e8ba6] transition-colors group" onClick={() => handleSort('date')}>
                                        <div className="flex items-center gap-1">
                                            Data
                                            {sortField === 'date' ? (sortDirection === 'asc' ? <ChevronUp size={14} className="text-[#2e8ba6]"/> : <ChevronDown size={14} className="text-[#2e8ba6]"/>) : <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />}
                                        </div>
                                    </th>

                                    <th className="px-6 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-[#2e8ba6] transition-colors group" onClick={() => handleSort('status')}>
                                        <div className="flex items-center gap-1">
                                            Status
                                            {sortField === 'status' ? (sortDirection === 'asc' ? <ChevronUp size={14} className="text-[#2e8ba6]"/> : <ChevronDown size={14} className="text-[#2e8ba6]"/>) : <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />}
                                        </div>
                                    </th>

                                    <th className="px-6 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-[#2e8ba6] transition-colors group" onClick={() => handleSort('amount')}>
                                        <div className="flex items-center justify-end gap-1">
                                            Valor
                                            {sortField === 'amount' ? (sortDirection === 'asc' ? <ChevronUp size={14} className="text-[#2e8ba6]"/> : <ChevronDown size={14} className="text-[#2e8ba6]"/>) : <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />}
                                        </div>
                                    </th>

                                    <th className="px-6 py-5 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {paginatedInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center">
                                                    <FileText size={28} className="text-slate-300" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Nenhuma fatura encontrada</p>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        {filters.searchText || filters.filterType !== 'Todos'
                                                            ? 'Tente ajustar os filtros de pesquisa.'
                                                            : 'Clique em "Nova Fatura" para começar.'}
                                                    </p>
                                                </div>
                                                {!filters.searchText && filters.filterType === 'Todos' && (
                                                    <button onClick={openNewInvoice}
                                                        className="mt-2 px-4 py-2 bg-[#73c6df] text-white rounded-xl text-xs font-bold hover:bg-[#5dbad6] transition-colors">
                                                        + Adicionar Primeira Fatura
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedInvoices.map((invoice) => (
                                        <tr key={invoice.id} className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer" onClick={() => setSelectedInvoiceForAnalysis(invoice)}>
                                            <td className="px-8 py-5" onClick={(e) => e.stopPropagation()}>
                                                <input type="checkbox" checked={selectedInvoices.includes(invoice.id || '')} onChange={() => toggleSelection(invoice.id || '')} className="rounded border-slate-300 text-[#2e8ba6] focus:ring-[#2e8ba6]" />
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="relative group/preview">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${invoice.type === 'Receita' ? 'bg-[#f0fdf4] text-[#15803d]' : 'bg-rose-50 text-rose-500'}`}>
                                                            {invoice.type === 'Receita' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">#{invoice.id?.slice(0, 8)}</p>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-xs text-slate-400">{invoice.category}</p>
                                                                {invoice.fileUrl && <Eye size={12} className="text-slate-300 opacity-0 group-hover/preview:opacity-100 transition-opacity" />}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Preview Tooltip */}
                                                    {invoice.fileUrl && (
                                                        <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 z-50 opacity-0 group-hover/preview:opacity-100 pointer-events-none transition-opacity duration-200 hidden md:block">
                                                            <div className="bg-white rounded-xl shadow-2xl border p-2 w-48">
                                                                <img src={invoice.fileUrl} alt="Preview" className="w-full h-auto rounded-lg" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-sm font-medium text-slate-600 dark:text-slate-300">{invoice.client}</td>
                                            <td className="px-6 py-5 text-sm text-slate-500">{new Date(invoice.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                                                <StatusDropdown invoice={invoice} onUpdate={(updated) => setInvoices(prev => prev.map(inv => inv.id === updated.id ? updated : inv))} />
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {invoice.type === 'Receita'
                                                        ? <ArrowUpRight size={14} className="text-emerald-500" />
                                                        : <ArrowDownRight size={14} className="text-rose-400" />
                                                    }
                                                    <span className={`font-bold ${invoice.type === 'Receita' ? 'text-slate-700 dark:text-white' : 'text-rose-500'}`}>
                                                        {invoice.type === 'Despesa' ? '-' : ''}Kz {invoice.amount.toLocaleString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={(e) => { e.stopPropagation(); openEditModal(invoice); }} className="p-2 text-slate-400 hover:text-[#2e8ba6] hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><Edit3 size={16} /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteInvoice(invoice.id || '', e); }} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Footer */}
                    {paginatedInvoices.length > 0 && (
                        <div className="flex items-center justify-between p-6 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                            <span className="text-xs text-slate-400 font-medium">
                                {(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, filteredInvoices.length)} de {filteredInvoices.length}
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(1)}
                                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronFirst size={16} />
                                </button>
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => p - 1)}
                                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 px-2">
                                    Página {currentPage} de {totalPages}
                                </span>
                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={16} />
                                </button>
                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(totalPages)}
                                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLast size={16} />
                                </button>
                            </div>
                            <select
                                value={rowsPerPage}
                                onChange={e => { setRowsPerPage(+e.target.value); setCurrentPage(1); }}
                                className="text-xs border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#73c6df]/50"
                            >
                                <option value={10}>10 por página</option>
                                <option value={15}>15 por página</option>
                                <option value={20}>20 por página</option>
                                <option value={50}>50 por página</option>
                            </select>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredInvoices.map((invoice) => (
                        <div key={invoice.id} className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all group flex flex-col cursor-pointer" onClick={() => setSelectedInvoiceForAnalysis(invoice)}>
                             <div className="flex justify-between items-start mb-6">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${invoice.type === 'Receita' ? 'bg-[#f0fdf4] text-[#15803d]' : 'bg-rose-50 text-rose-500'}`}>
                                    {invoice.type === 'Receita' ? <TrendingUp size={24} /> : <ArrowDownRight size={24} />}
                                </div>
                                <div className="flex gap-2">
                                     <button onClick={(e) => { e.stopPropagation(); openEditModal(invoice); }} className="p-2 text-slate-400 hover:text-[#2e8ba6] rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><Edit3 size={18} /></button>
                                </div>
                             </div>
                             
                             <div className="mb-6 flex-1">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1 line-clamp-1">{invoice.client}</h3>
                                <p className="text-sm text-slate-500">{invoice.category}</p>
                             </div>

                             <div className="flex items-end justify-between border-t border-slate-100 dark:border-slate-700 pt-6">
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">{new Date(invoice.date).toLocaleDateString()}</p>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                                        invoice.status === 'Pago' ? 'bg-[#f0fdf4] text-[#15803d]' : 
                                        invoice.status === 'Pendente' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                                    }`}>{invoice.status}</span>
                                </div>
                                <span className="text-2xl font-black text-slate-800 dark:text-white">Kz {invoice.amount.toLocaleString()}</span>
                             </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- INVOICE MODAL --- */}
            <InvoiceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                invoiceToEdit={invoiceToEdit}
                onSuccess={loadInvoices}
                availableCategories={availableCategories}
                onAddCategory={handleAddCategory}
            />

            {/* --- ANALYSIS MODAL --- */}
            <AnalysisModal
                invoice={selectedInvoiceForAnalysis}
                onClose={() => {
                    setSelectedInvoiceForAnalysis(null);
                    setSearchParams({}); // Clear query param on close
                }}
                onEdit={(inv) => { setSelectedInvoiceForAnalysis(null); openEditModal(inv); }}
                allInvoices={invoices}
            />

            {/* --- CONFIRMATION MODAL --- */}
            <ConfirmationModal
                isOpen={confirmation.isOpen}
                onClose={() => setConfirmation({ ...confirmation, isOpen: false })}
                onConfirm={confirmation.onConfirm}
                title={confirmation.title}
                message={confirmation.message}
                type={confirmation.type}
                singleButton={confirmation.singleButton}
                confirmText={confirmation.type === 'danger' ? 'Excluir' : 'Confirmar'}
            />

            {/* --- BULK ACTIONS FLOATING BAR --- */}
            {selectedInvoices.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-slate-900 dark:bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl shadow-slate-900/20 flex items-center gap-6 animate-in slide-in-from-bottom-10 fade-in duration-300 border border-slate-700/50">
                    <span className="font-bold text-sm flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-[#73c6df] text-slate-900 flex items-center justify-center text-[10px] font-black">
                            {selectedInvoices.length}
                        </div>
                        selecionados
                    </span>
                    <div className="h-4 w-px bg-slate-700"></div>
                    <button
                        onClick={handleBulkDelete}
                        className="flex items-center gap-2 text-rose-400 hover:text-rose-300 font-bold text-sm transition-colors group"
                    >
                        <Trash2 size={16} className="group-hover:scale-110 transition-transform" /> Excluir
                    </button>
                    <button
                        onClick={() => setSelectedInvoices([])}
                        className="p-1 hover:bg-slate-700 rounded-full transition-colors ml-2"
                        title="Limpar seleção"
                    >
                        <X size={14} className="text-slate-500 hover:text-white" />
                    </button>
                </div>
            )}

            <style>{`
                .label-text { @apply text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest; }
                .input-field { @apply px-4 py-3 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#73c6df]/30 dark:text-white transition-all font-medium; }
                .custom-gradient { @apply bg-gradient-to-br from-[#73c6df] to-[#2e8ba6]; }
            `}</style>
        </div>
    );
};

export default Billing;
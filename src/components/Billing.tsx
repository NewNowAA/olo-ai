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
    GripVertical,
    X,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    ChevronFirst,
    ChevronLast,
    Settings,
    Receipt, // Added Receipt icon
    Wallet // Added Wallet icon
} from 'lucide-react';
import KPICard from './KPICard'; // Added KPICard import
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

const ALL_COLUMNS = [
    { key: 'select',      label: '☑',             locked: true },
    { key: 'client',      label: 'Fatura / Cliente', default: true },
    { key: 'category',    label: 'Categoria',      default: true },
    { key: 'date',        label: 'Data',           default: true },
    { key: 'status',      label: 'Status',         default: true },
    { key: 'amount',      label: 'Valor',          default: true },
    { key: 'actions',     label: 'Ações',          locked: true },
];

const StatusDropdown = ({ invoice, onUpdate }: { invoice: Invoice; onUpdate: (updatedInvoice: Invoice) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropRef = React.useRef<HTMLDivElement>(null);
    const statuses: InvoiceStatus[] = ['Pendente', 'Pago', 'Atrasado'];

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropRef.current && !dropRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

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
        <div ref={dropRef} className="relative" onClick={e => e.stopPropagation()}>
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

    // Mobile responsive hook
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);
    const effectiveViewMode = isMobile ? 'grid' : viewMode;

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

    // Column Visibility, Resizing & Reordering
    const [visibleColumns, setVisibleColumns] = useState({
        client: true,
        category: true,
        date: true,
        status: true,
        amount: true,
        select: true,
        actions: true
    });
    const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);

    const [colWidths, setColWidths] = useState<Record<string, number>>({
        select: 50, client: 220, category: 140, date: 120, status: 120, amount: 120, actions: 100
    });
    const [colOrder, setColOrder] = useState<string[]>(ALL_COLUMNS.map(c => c.key));
    const [dragCol, setDragCol] = useState<string | null>(null);

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

    const loadAnalysis = async (forceRefresh: boolean = false) => {
        setIsAnalyzing(true);
        try {
            const text = await analyticsService.getDailyAnalysis(forceRefresh);
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

    // Column Resize Handler
    const onResizeStart = (colKey: string, startX: number) => {
        const startW = colWidths[colKey] || 120;
        const move = (e: MouseEvent) => {
            setColWidths(prev => ({ ...prev, [colKey]: Math.max(60, startW + (e.clientX - startX)) }));
        };
        const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    };

    // Column Reorder Handlers
    const onDragStartCol = (key: string) => setDragCol(key);
    const onDragOverCol = (e: React.DragEvent, key: string) => {
        e.preventDefault();
        if (!dragCol || dragCol === key) return;
        setColOrder(prev => {
            const arr = [...prev];
            const from = arr.indexOf(dragCol);
            const to = arr.indexOf(key);
            if (from !== -1 && to !== -1) {
                arr.splice(from, 1);
                arr.splice(to, 0, dragCol);
            }
            return arr;
        });
    };
    const onDragEndCol = () => setDragCol(null);

    const [aiExpanded, setAiExpanded] = useState(false);

    const truncateInsight = (text: string, max = 500) => {
        if (text.length <= max) return text;
        return text.slice(0, max).replace(/\s+\S*$/, '') + '…';
    };

    // --- Render ---
    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto min-h-screen pb-24 relative space-y-8">
            <Breadcrumbs />
            
            {/* Breathing line */}
            <div className="h-px" style={{ background: 'linear-gradient(to right, transparent, var(--border), transparent)' }} />

            {/* AI Insight — Barra compacta */}
            <div className="card-glass flex items-center gap-3 px-4 py-3" style={{ borderLeft: '3px solid var(--blue)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--blue-a)' }}>
                    <BrainCircuit size={16} style={{ color: 'var(--blue)' }} className={isAnalyzing ? 'animate-pulse' : ''} />
                </div>
                <div className="flex-1 min-w-0 flex flex-col items-start" style={{ transition: 'max-height 0.3s ease' }}>
                    <p className="text-[12px] leading-relaxed w-full" style={{ color: 'var(--t2)', fontFamily: "'Outfit', sans-serif", overflowWrap: 'break-word', wordBreak: 'break-word', hyphens: 'auto' }}>
                        {aiAnalysis && !aiAnalysis.startsWith('Erro')
                            ? (
                                <>
                                    <div className="inline">
                                        <ReactMarkdown>
                                            {aiExpanded ? aiAnalysis : truncateInsight(aiAnalysis, 500)}
                                        </ReactMarkdown>
                                    </div>
                                    {aiAnalysis.length > 500 && (
                                        <button 
                                            onClick={() => setAiExpanded(!aiExpanded)} 
                                            className="text-[11px] font-semibold hover:underline ml-2"
                                            style={{ color: 'var(--cyan)' }}
                                        >
                                            {aiExpanded ? 'Ver menos' : 'Ver mais'}
                                        </button>
                                    )}
                                </>
                            )
                            : <span style={{ color: 'var(--t3)', fontStyle: 'italic' }}>Adicione faturas para gerar insights com IA.</span>
                        }
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] tabular-nums hidden sm:inline" style={{ color: 'var(--t3)', fontFamily: "'JetBrains Mono', monospace" }}>{countdown}</span>
                    <button onClick={() => loadAnalysis(true)} disabled={isAnalyzing} className="p-1.5 rounded-lg transition-colors disabled:opacity-30" title="Atualizar análise">
                        <RefreshCw size={14} style={{ color: isAnalyzing ? 'var(--blue)' : 'var(--t3)' }} className={isAnalyzing ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard label="Receita Total" value={stats.totalRevenue >= 1000000 ? `${(stats.totalRevenue / 1000000).toFixed(1)}M` : stats.totalRevenue >= 1000 ? `${(stats.totalRevenue / 1000).toFixed(0)}K` : stats.totalRevenue.toLocaleString()} unit="Kz" change={`${(stats.trends?.revenueChange || 0) > 0 ? '+' : ''}${(stats.trends?.revenueChange || 0).toFixed(1)}%`} changeType={(stats.trends?.revenueChange || 0) >= 0 ? 'up' : 'down'} changeSubtext="vs período anterior" accentColor="var(--green)" delay={0} icon={<Banknote size={18} />} />
                <KPICard label="Despesas" value={stats.totalExpenses >= 1000000 ? `${(stats.totalExpenses / 1000000).toFixed(1)}M` : stats.totalExpenses >= 1000 ? `${(stats.totalExpenses / 1000).toFixed(0)}K` : stats.totalExpenses.toLocaleString()} unit="Kz" change={`${(stats.trends?.expensesChange || 0) > 0 ? '+' : ''}${(stats.trends?.expensesChange || 0).toFixed(1)}%`} changeType={(stats.trends?.expensesChange || 0) >= 0 ? 'up' : 'down'} changeSubtext="vs período anterior" accentColor="var(--pink)" delay={80} icon={<ArrowDownRight size={18} />} />
                <KPICard label="Lucro Líquido" value={(stats.totalRevenue - stats.totalExpenses) >= 1000000 ? `${((stats.totalRevenue - stats.totalExpenses) / 1000000).toFixed(1)}M` : (stats.totalRevenue - stats.totalExpenses) >= 1000 ? `${((stats.totalRevenue - stats.totalExpenses) / 1000).toFixed(0)}K` : (stats.totalRevenue - stats.totalExpenses).toLocaleString()} unit="Kz" change={`${(stats.trends?.profitChange || 0) > 0 ? '+' : ''}${(stats.trends?.profitChange || 0).toFixed(1)}%`} changeType={(stats.trends?.profitChange || 0) >= 0 ? 'up' : 'down'} changeSubtext="vs período anterior" accentColor="var(--cyan)" delay={160} icon={<Wallet size={18} />} />
                <KPICard label="Pendente" value={stats.pendingAmount >= 1000 ? `${(stats.pendingAmount / 1000).toFixed(0)}K` : stats.pendingAmount.toLocaleString()} unit="Kz" change={`${invoices.filter(i => i.status === 'Pendente').length} faturas`} changeType="flat" accentColor="var(--amber)" delay={240} icon={<Clock size={18} />} />
            </div>

            <div className="h-px" style={{ background: 'linear-gradient(to right, transparent, var(--border), transparent)' }} />

            {/* Controls */}
            <div className="flex flex-col lg:flex-row justify-between gap-4 items-start lg:items-center sticky top-0 z-30 py-4 -mx-4 px-4 mt-4 mb-4" style={{ backgroundColor: 'var(--bg)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}>
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
                <div className="flex gap-3 h-11 items-center">
                    <button onClick={handleExportCSV} disabled={isExporting || filteredInvoices.length === 0} className="h-9 px-4 rounded-xl border text-[12px] font-medium flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--t2)', fontFamily: "'Outfit', sans-serif" }}>
                        <Download size={14} /> Exportar CSV
                    </button>
                    {!isMobile && (<div className="flex p-0.5 rounded-xl h-9 items-center" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                        <button onClick={() => setViewMode('list')} className="p-1.5 rounded-lg transition-colors h-full aspect-square flex items-center justify-center" style={{ backgroundColor: viewMode === 'list' ? 'var(--blue-a)' : 'transparent', color: viewMode === 'list' ? 'var(--blue)' : 'var(--t3)' }}><LayoutList size={16} /></button>
                        <button onClick={() => setViewMode('grid')} className="p-1.5 rounded-lg transition-colors h-full aspect-square flex items-center justify-center" style={{ backgroundColor: viewMode === 'grid' ? 'var(--blue-a)' : 'transparent', color: viewMode === 'grid' ? 'var(--blue)' : 'var(--t3)' }}><LayoutGrid size={16} /></button>
                    </div>)}
                    <div className="relative">
                        <button 
                            onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)} 
                            className="h-9 px-4 rounded-xl border text-[12px] font-medium flex items-center gap-2 transition-colors"
                            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--t2)', fontFamily: "'Outfit', sans-serif" }}
                        >
                            <Settings size={14} /> Colunas
                        </button>
                        {isColumnMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-48 rounded-xl shadow-xl p-2 z-50" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', backdropFilter: 'blur(16px)' }}>
                                <p className="text-[10px] font-semibold uppercase tracking-wider px-3 py-2" style={{ color: 'var(--t3)', fontFamily: "'Outfit', sans-serif" }}>Exibir Colunas</p>
                            {ALL_COLUMNS.filter(c => !c.locked).map(col => (
                                    <label key={col.key} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={visibleColumns[col.key as keyof typeof visibleColumns] !== false} 
                                            onChange={() => setVisibleColumns(prev => ({ ...prev, [col.key]: !prev[col.key as keyof typeof visibleColumns] }))}
                                            className="rounded border-slate-300 text-[#2e8ba6] focus:ring-[#2e8ba6]"
                                        />
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            {col.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}
                        {isColumnMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setIsColumnMenuOpen(false)}></div>}
                    </div>

                    <button onClick={openNewInvoice} className="h-9 px-5 text-white rounded-xl text-[12px] font-semibold shadow-lg flex items-center gap-2 transition-all active:scale-95" style={{ backgroundColor: 'var(--blue)', fontFamily: "'Outfit', sans-serif" }}>
                        <Plus size={16} /> Nova Fatura
                    </button>
                </div>
            </div>

            {/* Content View */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-96">
                    <Loader2 size={36} className="animate-spin mb-4" style={{ color: 'var(--blue)' }} />
                    <p className="text-[13px] animate-pulse" style={{ color: 'var(--t3)', fontFamily: "'Outfit', sans-serif" }}>Carregando suas finanças...</p>
                </div>
            ) : effectiveViewMode === 'list' ? (
                <div className="card-glass flex flex-col" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border)' }}>
                        <table className="w-full border-separate border-spacing-y-0" style={{ tableLayout: 'fixed' }}>
                            <thead style={{ backgroundColor: 'var(--input-bg)', borderBottom: '1px solid var(--border)' }}>
                                <tr>
                                    {colOrder.filter(k => visibleColumns[k as keyof typeof visibleColumns] !== false).map(colKey => (
                                        <th
                                            key={colKey}
                                            style={{ 
                                                width: colWidths[colKey], 
                                                minWidth: '80px', 
                                                color: 'var(--t2)', 
                                                fontFamily: "'Outfit', sans-serif",
                                                borderRight: colKey === 'actions' ? 'none' : '1px solid var(--border)',
                                                overflow: 'hidden',
                                                resize: 'horizontal'
                                            }}
                                            className={`relative group/resizeth px-4 py-4 text-left text-[10.5px] font-semibold uppercase tracking-[0.8px] 
                                                ${dragCol === colKey ? 'opacity-40' : ''} 
                                                ${colKey !== 'select' && colKey !== 'actions' ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                            draggable={colKey !== 'select' && colKey !== 'actions'}
                                            onDragStart={() => onDragStartCol(colKey)}
                                            onDragOver={(e) => onDragOverCol(e, colKey)}
                                            onDragEnd={onDragEndCol}
                                            onClick={() => {
                                                if (colKey !== 'select' && colKey !== 'actions') handleSort(colKey);
                                            }}
                                        >
                                            {colKey === 'select' ? (
                                                <input type="checkbox" className="rounded border-slate-300 text-[#2e8ba6] focus:ring-[#2e8ba6]" onChange={(e) => setSelectedInvoices(e.target.checked ? paginatedInvoices.map(i => i.id || '') : [])} checked={selectedInvoices.length === paginatedInvoices.length && paginatedInvoices.length > 0} />
                                            ) : colKey === 'actions' ? (
                                                'Ações'
                                            ) : (
                                                <div className="flex items-center gap-1 select-none">
                                                    {colKey !== 'select' && colKey !== 'actions' && <GripVertical size={10} className="opacity-20 shrink-0" />}
                                                    {colKey === 'client' ? 'Fatura / Cliente' :
                                                     colKey === 'category' ? 'Categoria' :
                                                     colKey === 'date' ? 'Data' :
                                                     colKey === 'status' ? 'Status' :
                                                     colKey === 'amount' ? 'Valor' : colKey}
                                                    {sortField === colKey ? (sortDirection === 'asc' ? <ChevronUp size={14} className="text-[#2e8ba6]"/> : <ChevronDown size={14} className="text-[#2e8ba6]"/>) : <ArrowUpDown size={14} className="opacity-0 group-hover/resizeth:opacity-50 transition-opacity" />}
                                                </div>
                                            )}
                                            {/* Resizer Handle */}
                                            <div
                                                className="absolute right-0 top-1/4 bottom-1/4 w-[3px] cursor-col-resize bg-transparent hover:bg-[rgba(16,66,255,0.2)] transition-colors z-10"
                                                onMouseDown={(e) => { e.stopPropagation(); onResizeStart(colKey, e.clientX); }}
                                                onClick={(e) => e.stopPropagation()} 
                                            />
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody style={{ backgroundColor: 'var(--bg)' }}>
                                {paginatedInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={colOrder.filter(k => visibleColumns[k as keyof typeof visibleColumns] !== false).length} className="py-20 text-center">
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
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedInvoices.map((invoice) => (
                                        <tr key={invoice.id} className={`group transition-all hover:scale-[1.002] border border-transparent cursor-pointer ${
                                            selectedInvoices.includes(invoice.id || '') ? 'bg-[#f0f9ff]' :
                                            invoice.status === 'Atrasado' ? 'bg-rose-50/40 dark:bg-rose-900/10 hover:bg-rose-50/70' :
                                            invoice.status === 'Pago' ? 'bg-emerald-50/30 dark:bg-emerald-900/10 hover:bg-emerald-50/60' :
                                            'bg-slate-50 dark:bg-slate-700/30 hover:bg-white dark:hover:bg-slate-700'
                                        }`} onClick={() => { setSelectedInvoiceForAnalysis(invoice); setSearchParams({ invoiceId: invoice.id || '' }, { replace: true }); }}>
                                            {colOrder.filter(k => visibleColumns[k as keyof typeof visibleColumns] !== false).map(colKey => (
                                                <td key={colKey} className="px-4 py-4 border-y border-slate-100 dark:border-slate-800 bg-inherit align-middle" style={{ borderRight: colKey === 'actions' ? 'none' : '1px solid var(--border)' }}>
                                                    {colKey === 'select' && (
                                                        <div onClick={(e) => e.stopPropagation()}>
                                                            <input type="checkbox" checked={selectedInvoices.includes(invoice.id || '')} onChange={() => toggleSelection(invoice.id || '')} className="rounded border-slate-300 text-[#2e8ba6] focus:ring-[#2e8ba6]" />
                                                        </div>
                                                    )}
                                                    {colKey === 'client' && (
                                                        <div className="relative group/preview">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${invoice.type === 'Receita' ? 'bg-[#f0fdf4] text-[#34D399]' : 'bg-rose-50 text-[#E94C76]'}`}>
                                                                    {invoice.type === 'Receita' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="font-semibold text-sm truncate max-w-[140px]" style={{ color: 'var(--t1)' }} title={invoice.client}>#{invoice.id?.slice(0, 8)}</p>
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="text-xs truncate max-w-[100px] font-medium" style={{ color: 'var(--t2)' }}>{invoice.client}</p>
                                                                        {invoice.fileUrl && <Eye size={12} className="opacity-0 group-hover/preview:opacity-60 transition-opacity" style={{ color: 'var(--t2)' }} />}
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
                                                    )}
                                                    {colKey === 'category' && <span className="text-sm font-medium truncate block" style={{ color: 'var(--t1)' }}>{invoice.category}</span>}
                                                    {colKey === 'date' && <span className="text-sm truncate block" style={{ color: 'var(--t2)' }}>{new Date(invoice.date).toLocaleDateString()}</span>}
                                                    {colKey === 'status' && (
                                                        <div onClick={(e) => e.stopPropagation()}>
                                                            <StatusDropdown invoice={invoice} onUpdate={(updated) => setInvoices(prev => prev.map(inv => inv.id === updated.id ? updated : inv))} />
                                                        </div>
                                                    )}
                                                    {colKey === 'amount' && (
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {invoice.type === 'Receita'
                                                                ? <ArrowUpRight size={14} className="text-emerald-500" />
                                                                : <ArrowDownRight size={14} className="text-rose-400" />
                                                            }
                                                            <span className={`font-bold ${invoice.type === 'Receita' ? 'text-slate-700 dark:text-white' : 'text-rose-500'}`}>
                                                                {invoice.type === 'Despesa' ? '-' : ''}Kz {invoice.amount.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {colKey === 'actions' && (
                                                        <div className="flex justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={(e) => { e.stopPropagation(); openEditModal(invoice); }} className="p-2 hover:bg-[rgba(16,66,255,0.1)] rounded-lg transition-colors" style={{ color: 'var(--blue)' }}><Edit3 size={16} /></button>
                                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteInvoice(invoice.id || '', e); }} className="p-2 hover:bg-[rgba(233,76,118,0.1)] rounded-lg transition-colors" style={{ color: 'var(--pink)' }}><Trash2 size={16} /></button>
                                                        </div>
                                                    )}
                                                </td>
                                            ))}
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
                        <div key={invoice.id} className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all group flex flex-col cursor-pointer" onClick={() => { setSelectedInvoiceForAnalysis(invoice); setSearchParams({ invoiceId: invoice.id || '' }, { replace: true }); }}>
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
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 px-6 py-3 rounded-full shadow-2xl flex items-center gap-5 animate-in slide-in-from-bottom-10 fade-in duration-300" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', backdropFilter: 'blur(20px)' }}>
                    <span className="text-[12px] font-medium flex items-center gap-2" style={{ color: 'var(--t1)', fontFamily: "'Outfit', sans-serif" }}>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: 'var(--blue)' }}>
                            {selectedInvoices.length}
                        </div>
                        selecionados
                    </span>
                    <div className="h-4 w-px" style={{ backgroundColor: 'var(--border)' }} />
                    <button onClick={handleBulkDelete} className="flex items-center gap-2 text-[12px] font-medium transition-colors group" style={{ color: 'var(--red)', fontFamily: "'Outfit', sans-serif" }}>
                        <Trash2 size={14} className="group-hover:scale-110 transition-transform" /> Excluir
                    </button>
                    <button onClick={() => setSelectedInvoices([])} className="p-1 rounded-full transition-colors ml-2" title="Limpar seleção">
                        <X size={13} style={{ color: 'var(--t3)' }} />
                    </button>
                </div>
            )}

            <style>{`
                .label-text { font-size: 11px; font-weight: 600; color: var(--t2); text-transform: uppercase; letter-spacing: 0.8px; font-family: 'Outfit', sans-serif; }
                .input-field { padding: 10px 16px; background: var(--input-bg); border: 1px solid var(--border); border-radius: 12px; color: var(--t1); font-family: 'Outfit', sans-serif; font-size: 13px; transition: all 0.2s; }
                .input-field:focus { outline: none; border-color: var(--blue); box-shadow: 0 0 0 3px var(--blue-a); }
            `}</style>
        </div>
    );
};

export default Billing;
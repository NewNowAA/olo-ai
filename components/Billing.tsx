import React, { useState, useMemo, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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
    Edit3,
    X,
    Upload,
    Bot,
    User,
    ImageIcon,
    Save,
    Wand2,
    Calendar,
    DollarSign,
    Minus,
    LayoutGrid,
    LayoutList,
    Trash2,
    Eye,
    FileUp,
    Keyboard,
    ScanLine,
    RefreshCw,
    Filter,
    ArrowUpDown,
    CheckSquare,
    BrainCircuit,
    Banknote,
    ShoppingCart,
    Briefcase,
    TrendingUp
} from 'lucide-react';
import { Invoice, InvoiceStatus, InvoiceItem, InvoiceType, ExpenseType, ReviewStatus } from '../src/types';
import { invoiceService, analyticsService } from '../src/services';
import { useInvoiceFilters, useInvoiceProcessing } from '../src/hooks';
import FilterControls from './Shared/FilterControls';
import { geminiService, supabase } from '../src/services';
import { Loader2 } from 'lucide-react';
import { ConfirmationModal } from '../src/components/common';

interface BillingProps {
    onNavigate?: (page: 'dashboard' | 'billing' | 'ai' | 'goals' | 'builder' | 'settings' | 'help') => void;
}

const Billing: React.FC<BillingProps> = ({ onNavigate }) => {
    // --- State ---
    // Data States
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    useEffect(() => {
        console.log("Billing Component Mounted - " + new Date().toISOString());
    }, []);

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
    const [modalStep, setModalStep] = useState<'choice' | 'manual' | 'ai'>('choice');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
    const [processingInvoiceId, setProcessingInvoiceId] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

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

    const showConfirm = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'info' | 'success' = 'danger') => {
        setConfirmation({ isOpen: true, title, message, onConfirm, type, singleButton: false });
    };

    const closeConfirmation = () => {
        setConfirmation(prev => ({ ...prev, isOpen: false }));
    };

    // AI Analysis Hook
    const { invoice: aiInvoice, status: processingStatus, isPolling } = useInvoiceProcessing(processingInvoiceId);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
    }, []);

    // Effect: Populate form when AI finishes
    // Effect: Populate form when AI finishes
    useEffect(() => {
        // Prevent running if we are already in manual mode
        if (modalStep === 'manual') return;

        if (aiInvoice && (processingStatus === 'needs_review' || processingStatus === 'completed')) {
            // No more 'any' casting needed! The hook returns a clean Invoice object.
            const cleanItems = aiInvoice.items || [];

            setFormData(prev => ({
                ...prev,
                id: aiInvoice.id,
                client: aiInvoice.client, // Already mapped from vendor_name by service
                date: aiInvoice.date,     // Already mapped from issue_date
                amount: aiInvoice.amount, // Already mapped from total_amount
                items: cleanItems,
                type: aiInvoice.type,
                category: aiInvoice.category,
                subcategory: aiInvoice.subcategory,
                // processing_status: aiInvoice.processing_status // If needed
            }));

            setFormItems(cleanItems);

            if (aiInvoice.fileUrl) {
                setUploadedImage(aiInvoice.fileUrl);
            } else if (uploadedImage) {
                // Keep the locally uploaded image if not returned by backend yet
            }

            setProcessingInvoiceId(null); // Stop listening
            setIsUploading(false); // Make sure to stop loading
            setModalStep('manual'); // Switch to edit form
        }
    }, [aiInvoice, processingStatus, modalStep, uploadedImage]);

    const handleAiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !userId) return;

        const imageUrl = URL.createObjectURL(file);
        setUploadedImage(imageUrl);
        setSelectedFile(file);
        setIsUploading(true);

        try {
            const result = await geminiService.processInvoice(file, userId);

            if (result.success && result.invoiceId) {
                setProcessingInvoiceId(result.invoiceId);
                // CRITICAL FIX: Do NOT set isUploading(false) here. 
                // We wait for the useEffect to detect 'completed' status.
            } else {
                showAlert('Erro', 'Falha ao iniciar processamento: ' + result.message, 'danger');
                setUploadedImage(null);
                setIsUploading(false); // Only stop if it failed to start
            }
        } catch (error) {
            console.error(error);
            showAlert('Erro', 'Erro ao enviar arquivo.', 'danger');
            setUploadedImage(null);
            setIsUploading(false);
        }
        // finally block removed to prevent race condition
    };

    const handleCancelAiUpload = async () => {
        if (processingInvoiceId) {
            try {
                // Optimistic UI update
                setProcessingInvoiceId(null);
                setUploadedImage(null);
                // Attempt to delete the temp invoice from DB
                await invoiceService.deleteInvoice(processingInvoiceId);
            } catch (e) {
                console.warn("Failed to delete temp invoice", e);
            }
        }
        setProcessingInvoiceId(null);
        setUploadedImage(null);
        setModalStep('choice');
    };

    // Form State (New/Edit)
    const [formData, setFormData] = useState<Partial<Invoice>>({
        client: '', amount: 0, date: new Date().toISOString().split('T')[0], category: '', subcategory: '', items: [], type: 'Receita', status: 'Pendente', expense_type: 'Flexivel', review_status: 'Não Revisado'
    });
    const [formItems, setFormItems] = useState<InvoiceItem[]>([]);

    // Category Options (Dynamic)
    const defaultCategories = ['Software', 'Consultoria', 'Infraestrutura', 'Marketing', 'Escritório', 'Salários', 'Impostos'];
    const [customCategory, setCustomCategory] = useState('');
    const [availableCategories, setAvailableCategories] = useState(defaultCategories);

    const [isUploading, setIsUploading] = useState(false);

    // Load Data
    useEffect(() => {
        loadInvoices();
        loadAnalysis();

        // Realtime Subscription
        const channel = supabase
            .channel('billing-all-invoices')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'invoices',
                },
                async (payload) => {
                    console.log('Realtime change received:', payload);
                    if (payload.eventType === 'INSERT') {
                        // Fetch the full mapped object to ensure consistency
                        const { data } = await supabase.from('invoices').select('*').eq('id', payload.new.id).single();
                        if (data) {
                            // Apply same mapping as getInvoices if needed, or just append if shape is compatible
                            // For safety, let's reload to ensure all relations/mapping are correct
                            // or verify if we can push directly. 
                            // Given we might need relations (items), reloading or specific fetch is safer.
                            // But for "instant" feel, we can push raw if it matches.
                            loadInvoices();
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        loadInvoices();
                    } else if (payload.eventType === 'DELETE') {
                        setInvoices((prev) => prev.filter((inv) => inv.id !== payload.old.id));
                    }
                }
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
        } catch (error) {
            console.error('Error loading invoices:', error);
        } finally {
            setIsLoading(false);
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

    // Countdown timer to next 07:00
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
    const handleSort = (field: keyof Invoice) => {
        if (filters.sortField === field) {
            setFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setFilter('sortField', field);
            setFilter('sortOrder', 'desc');
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedInvoices.includes(id)) {
            setSelectedInvoices(selectedInvoices.filter(item => item !== id));
        } else {
            setSelectedInvoices([...selectedInvoices, id]);
        }
    };

    const toggleSelectAll = () => {
        if (selectedInvoices.length === filteredInvoices.length) {
            setSelectedInvoices([]);
        } else {
            setSelectedInvoices(filteredInvoices.map(inv => inv.id));
        }
    };

    // Modal Handlers
    const openNewInvoiceModal = () => {
        setFormData({
            type: 'Receita', status: 'Pendente', items: [], date: new Date().toISOString().split('T')[0], expense_type: 'Flexivel', review_status: 'Não Revisado'
        });
        setFormItems([]);
        setUploadedImage(null);
        setSelectedFile(undefined);
        setCustomCategory('');
        setModalStep('choice');
        setProcessingInvoiceId(null);
        setIsModalOpen(true);
    };

    const openAnalysisModal = (invoice: Invoice) => {
        setSelectedInvoiceForAnalysis(invoice);
    };

    const closeAnalysisModal = () => {
        setSelectedInvoiceForAnalysis(null);
    };

    const openEditModal = (invoice: Invoice) => {
        setFormData(invoice);
        setFormItems(invoice.items || []);
        setUploadedImage(invoice.fileUrl || null);
        setSelectedFile(undefined);
        setCustomCategory('');
        setModalStep('manual');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setUploadedImage(imageUrl);
            setSelectedFile(file);
        }
    };

    const handleAddItem = () => {
        setFormItems([...formItems, { name: '', description: '', quantity: 1, price: 0, vat: 23 }]);
    };

    const handleRemoveItem = (idx: number) => {
        setFormItems(formItems.filter((_, i) => i !== idx));
    };

    const handleItemChange = (idx: number, field: keyof InvoiceItem, value: any) => {
        const newItems = [...formItems];
        newItems[idx] = { ...newItems[idx], [field]: value };
        setFormItems(newItems);
    };

    const handleAddCustomCategory = () => {
        if (customCategory && !availableCategories.includes(customCategory)) {
            setAvailableCategories([...availableCategories, customCategory]);
            setFormData({ ...formData, category: customCategory });
            setCustomCategory('');
        }
    };

    const handleSaveInvoice = async () => {
        setIsSaving(true);
        try {
            const totalAmount = formItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
            const invoiceToSave: Partial<Invoice> = {
                ...formData,
                amount: totalAmount || formData.amount || 0,
                category: customCategory || formData.category,
                items: formItems
            };

            if (formData.id) {
                // If user selected a new file during edit, upload it and update fileUrl
                if (selectedFile) {
                    const fileExt = selectedFile.name.split('.').pop();
                    const fileName = `${Date.now()}.${fileExt}`;
                    const { error: uploadError } = await supabase.storage
                        .from('faturas')
                        .upload(fileName, selectedFile);

                    if (!uploadError) {
                        const { data: { publicUrl } } = supabase.storage
                            .from('faturas')
                            .getPublicUrl(fileName);
                        invoiceToSave.fileUrl = publicUrl;
                    }
                }
                await invoiceService.updateInvoice(formData.id, invoiceToSave);
            } else {
                await invoiceService.createInvoice(invoiceToSave, selectedFile);
            }

            await loadInvoices();
            closeModal();
        } catch (error) {
            console.error('Error saving invoice:', error);
            showAlert('Erro', 'Erro ao salvar fatura. Verifique os dados.', 'danger');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteInvoice = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();

        showConfirm('Excluir Fatura', 'Tem certeza que deseja excluir esta fatura? Esta ação não pode ser desfeita.', async () => {
            try {
                await invoiceService.deleteInvoice(id);
                setInvoices(prev => prev.filter(inv => inv.id !== id));
                showAlert('Sucesso', 'Fatura excluída com sucesso.', 'success');
            } catch (error) {
                console.error('Error deleting invoice:', error);
                showAlert('Erro', 'Erro ao excluir fatura.', 'danger');
            }
        }, 'danger');
    };

    const handleBulkDelete = () => {
        showConfirm(
            'Excluir Faturas',
            `Tem certeza que deseja excluir ${selectedInvoices.length} faturas selecionadas? Esta ação não pode ser desfeita.`,
            async () => {
                setIsLoading(true);
                try {
                    await Promise.all(selectedInvoices.map(id => invoiceService.deleteInvoice(id)));
                    setInvoices(prev => prev.filter(inv => !selectedInvoices.includes(inv.id)));
                    setSelectedInvoices([]);
                    showAlert('Sucesso', `${selectedInvoices.length} faturas excluídas com sucesso.`, 'success');
                } catch (error) {
                    console.error('Error deleting invoices:', error);
                    showAlert('Erro', 'Erro ao excluir faturas.', 'danger');
                } finally {
                    setIsLoading(false);
                }
            },
            'danger'
        );
    };

    // --- Components Matching Dashboard ---

    const InfoCard = ({ title, value, count, icon: Icon, type }: any) => {
        const isExpense = type === 'Despesa';
        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                {/* Side Accent Line */}
                <div className={`absolute left-0 top-0 bottom-0 w-2 ${isExpense ? 'bg-rose-500' : 'bg-[#2edd4bf]'}`}></div>

                <div className="flex justify-between items-start mb-4 pl-4">
                    <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                        <h3 className="text-3xl font-black text-slate-800 dark:text-white">{value}</h3>
                    </div>
                    <div className={`p-3 rounded-2xl ${isExpense ? 'bg-rose-50 text-rose-500' : 'bg-[#f0fdf4] text-[#0d9488]'} dark:bg-slate-700`}>
                        <Icon size={24} />
                    </div>
                </div>

                <div className="pl-4 mt-auto">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${isExpense ? 'bg-rose-100 text-rose-500' : 'bg-[#ccfbf1] text-[#0f766e]'}`}>
                        {count} documentos
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 pb-20 relative">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Gestão de Faturamento</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Controle centralizado com Inteligência Artificial.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => { loadInvoices(); loadAnalysis(); }} className="px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2">
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} /> Atualizar
                    </button>
                    <button onClick={openNewInvoiceModal} className="px-5 py-2.5 rounded-xl bg-[#2e8ba6] text-white font-bold text-sm hover:bg-[#257a91] transition-all shadow-lg shadow-[#73c6df]/20 flex items-center gap-2">
                        <Plus size={18} /> Nova Fatura
                    </button>
                </div>
            </div>

            {/* AI Analysis Section - Matched to Dashboard AICard */}
            <div className="custom-gradient p-8 rounded-[2.5rem] shadow-lg shadow-[#73c6df]/20 flex flex-col lg:flex-row items-center gap-8 relative overflow-hidden text-white">
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/20 blur-[80px] rounded-full pointer-events-none"></div>
                <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-white/10 blur-[60px] rounded-full pointer-events-none"></div>

                <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md shadow-inner border border-white/30 flex-shrink-0 flex items-center justify-center text-white">
                    <BrainCircuit size={40} className={isAnalyzing ? "animate-pulse" : ""} />
                </div>

                <div className="flex-1 space-y-3 text-center lg:text-left relative z-10">
                    <h3 className="text-xl font-bold flex items-center justify-center lg:justify-start gap-3">
                        Análise Financeira Diária
                        {isAnalyzing && <span className="text-xs text-white/80 animate-pulse">(Gerando...)</span>}
                    </h3>
                    <div className="text-white/90 leading-relaxed text-sm max-w-4xl font-medium prose-p:my-1 prose-headings:text-white prose-headings:text-sm prose-strong:text-white">
                        {aiAnalysis ? (
                            <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                        ) : (
                            <p className="italic opacity-80">Nenhuma análise disponível. Adicione faturas para gerar insights.</p>
                        )}
                    </div>
                    <p className="text-[10px] text-white/60 uppercase tracking-widest">Atualizado Diariamente</p>
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-xl">
                            <Clock size={14} className="text-white/80" />
                            <span className="text-xs font-bold text-white/90">Próxima: {countdown}</span>
                        </div>
                        {analysisTimestamp && (
                            <span className="text-[10px] text-white/50">Última: {analysisTimestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                        <button
                            onClick={loadAnalysis}
                            disabled={isAnalyzing}
                            className="text-xs font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-all disabled:opacity-40"
                        >
                            {isAnalyzing ? 'Gerando...' : 'Gerar Agora'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoCard
                    title="Receita Total"
                    value={`$${stats.revenue.toLocaleString()}`}
                    count={filteredInvoices.filter(i => i.type === 'Receita').length}
                    icon={Banknote}
                    type="Receita"
                />
                <InfoCard
                    title="Despesa Total"
                    value={`$${stats.expenses.toLocaleString()}`}
                    count={filteredInvoices.filter(i => i.type === 'Despesa').length}
                    icon={ShoppingCart}
                    type="Despesa"
                />
            </div>

            {/* Advanced Filters Toolbar */}
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/60 dark:border-slate-700 p-4 rounded-[1.5rem] flex flex-col xl:flex-row gap-4 items-start xl:items-center shadow-sm relative z-20">

                {/* Type Tabs */}
                <div className="flex p-1 bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 shrink-0">
                    {['Todos', 'Receita', 'Despesa'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilter('filterType', type as any)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filters.filterType === type ? 'bg-[#73c6df] text-white shadow-sm' : 'text-slate-500 dark:text-slate-300 hover:text-[#73c6df]'}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 hidden xl:block"></div>

                {/* Filter Inputs Group */}
                <div className="flex flex-wrap gap-3 items-center flex-1 w-full relative">
                    {/* Search */}
                    <div className="relative group shrink-0 w-40">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            value={filters.searchText}
                            onChange={(e) => setFilter('searchText', e.target.value)}
                            type="text"
                            placeholder="Buscar..."
                            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#73c6df]/30 dark:text-white"
                        />
                    </div>

                    {/* Subcategory */}
                    <div className="relative group shrink-0 w-40">
                        <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            value={filters.subcategoryFilter}
                            onChange={(e) => setFilter('subcategoryFilter', e.target.value)}
                            type="text"
                            placeholder="Subcategoria..."
                            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#73c6df]/30 dark:text-white"
                        />
                    </div>

                    {/* Date Range Picker Integration */}
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

                {/* View Toggle */}
                <div className="flex items-center bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 p-1 shrink-0">
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-[#73c6df] text-white' : 'text-slate-400'}`}><LayoutList size={16} /></button>
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-[#73c6df] text-white' : 'text-slate-400'}`}><LayoutGrid size={16} /></button>
                </div>
            </div>

            {/* Main Content */}
            <div className={`
                ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[2.5rem] p-8 shadow-sm min-h-[500px]' : ''}
            `}>
                {viewMode === 'list' && (
                    <div className="overflow-visible">
                        <table className="w-full border-separate border-spacing-y-2">
                            <thead>
                                <tr className="text-left text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                                    <th className="pb-4 pl-4 w-10">
                                        <input type="checkbox" checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded border-slate-300 text-[#73c6df] focus:ring-[#73c6df]" />
                                    </th>
                                    <th className="pb-4 cursor-pointer hover:text-[#73c6df]" onClick={() => handleSort('date')}>
                                        <div className="flex items-center gap-1">Data <ArrowUpDown size={12} /></div>
                                    </th>
                                    <th className="pb-4">Fatura / Cliente</th>
                                    <th className="pb-4">Categoria</th>
                                    <th className="pb-4 cursor-pointer hover:text-[#73c6df]" onClick={() => handleSort('amount')}>
                                        <div className="flex items-center gap-1">Valor <ArrowUpDown size={12} /></div>
                                    </th>
                                    <th className="pb-4 pl-2">Status</th>
                                    <th className="pb-4 pl-2">Revisão</th>
                                    <th className="pb-4 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filteredInvoices.map((inv) => (
                                    <tr key={inv.id} onClick={() => openAnalysisModal(inv)} className={`group transition-all hover:scale-[1.002] ${selectedInvoices.includes(inv.id) ? 'bg-[#f0f9ff]' : 'bg-slate-50 dark:bg-slate-700/30 hover:bg-white dark:hover:bg-slate-700'} border border-transparent cursor-pointer`}>
                                        <td className="py-4 pl-4 rounded-l-2xl border-y border-l border-slate-100 dark:border-slate-700 bg-inherit" onClick={(e) => e.stopPropagation()}>
                                            <input type="checkbox" checked={selectedInvoices.includes(inv.id)} onChange={() => toggleSelect(inv.id)} className="w-4 h-4 rounded border-slate-300 text-[#73c6df] focus:ring-[#73c6df]" />
                                        </td>
                                        <td className="py-4 border-y border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium bg-inherit">
                                            {inv.date}
                                        </td>
                                        <td className="py-4 border-y border-slate-100 dark:border-slate-700 bg-inherit">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${inv.type === 'Receita' ? 'bg-[#f0fdf4] text-[#15803d]' : 'bg-rose-50 text-rose-500'}`}>
                                                    <FileText size={16} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-white">{inv.client}</p>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">#{inv.displayId || inv.invoiceNumber || inv.id.slice(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 border-y border-slate-100 dark:border-slate-700 bg-inherit">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-700 dark:text-slate-300">{inv.category}</span>
                                                {inv.subcategory && <span className="text-[10px] text-slate-500">{inv.subcategory}</span>}
                                                {inv.expense_type && <span className="text-[9px] uppercase font-bold text-indigo-400">{inv.expense_type}</span>}
                                            </div>
                                        </td>
                                        <td className="py-4 border-y border-slate-100 dark:border-slate-700 bg-inherit">
                                            <span className={`font-bold ${inv.type === 'Receita' ? 'text-slate-800 dark:text-white' : 'text-rose-500'}`}>
                                                {inv.type === 'Despesa' ? '-' : ''}${inv.amount.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="py-4 border-y border-slate-100 dark:border-slate-700 bg-inherit relative">
                                            <span className={`
                                                px-3 py-1 rounded-full text-[10px] font-bold uppercase
                                                ${inv.status === 'Pago' ? 'bg-[#f0fdf4] text-[#15803d]' : ''}
                                                ${inv.status === 'Pendente' ? 'bg-amber-50 text-amber-600' : ''}
                                                ${inv.status === 'Atrasado' ? 'bg-rose-50 text-rose-500' : ''}
                                            `}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="py-4 border-y border-slate-100 dark:border-slate-700 bg-inherit text-center">
                                            {inv.review_status === 'Revisado' ? (
                                                <CheckCircle2 size={16} className="text-[#2dd4bf]" />
                                            ) : (
                                                <div className="w-2 h-2 rounded-full bg-slate-200 mx-auto" />
                                            )}
                                        </td>
                                        <td className="py-4 pr-4 rounded-r-2xl border-y border-r border-slate-100 dark:border-slate-700 bg-inherit text-center">
                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEditModal(inv)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-[#2e8ba6] transition-colors" title="Editar">
                                                    <Edit3 size={16} />
                                                </button>
                                                <button onClick={(e) => handleDeleteInvoice(inv.id, e)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-500 hover:text-rose-500 transition-colors" title="Excluir">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {viewMode === 'grid' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredInvoices.map((inv) => (
                            <div key={inv.id} onClick={() => openAnalysisModal(inv)} className="bg-white dark:bg-slate-800 p-5 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 flex flex-col gap-4 group hover:shadow-lg transition-all relative overflow-hidden cursor-pointer">
                                {/* Image Preview Background if available */}
                                {inv.fileUrl && (
                                    <div className="absolute inset-x-0 top-0 h-32 opacity-10 pointer-events-none">
                                        <img src={inv.fileUrl} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white dark:to-slate-800"></div>
                                    </div>
                                )}

                                <div className="flex justify-between items-start z-10">
                                    <div className={`p-2 rounded-xl ${inv.type === 'Receita' ? 'bg-[#f0fdf4] text-[#15803d]' : 'bg-rose-50 text-rose-500'}`}>
                                        <FileText size={20} />
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${inv.status === 'Pago' ? 'bg-[#f0fdf4] text-[#15803d]' : 'bg-slate-50 text-slate-500'}`}>{inv.status}</span>
                                </div>
                                <div className="z-10">
                                    <h4 className="font-bold text-lg dark:text-white line-clamp-1">{inv.client}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{inv.category}</p>
                                </div>
                                <div className="mt-auto pt-4 border-t border-slate-50 dark:border-slate-700 flex justify-between items-center z-10">
                                    <span className="font-extrabold text-lg text-slate-800 dark:text-white">${inv.amount.toLocaleString()}</span>
                                    <div className="flex gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteInvoice(inv.id, e); }} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-full shadow-sm hover:scale-105 transition-transform text-slate-400 hover:text-rose-500"><Trash2 size={16} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); openEditModal(inv); }} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-full shadow-sm hover:scale-105 transition-transform text-[#2e8ba6]"><Edit3 size={16} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- INVOICE MODAL --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={closeModal}></div>
                    <div className="relative bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

                        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">
                                {modalStep === 'choice' ? 'Adicionar Novo Documento' : (formData.id ? 'Editar Fatura' : 'Nova Fatura Manual')}
                            </h2>
                            <button onClick={closeModal} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><X size={20} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/20">
                            {modalStep === 'choice' && (
                                <div className="p-10 flex flex-col md:flex-row gap-8 items-center justify-center h-full">
                                    <button onClick={() => setModalStep('ai')} className="flex-1 w-full max-w-sm p-8 rounded-[2rem] bg-gradient-to-br from-[#73c6df]/10 to-[#8bd7bf]/10 border-2 border-[#73c6df]/30 hover:border-[#73c6df] transition-all group text-center">
                                        <div className="w-20 h-20 mx-auto bg-white dark:bg-slate-700 rounded-full flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform"><ScanLine size={32} className="text-[#73c6df]" /></div>
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Automático (IA)</h3>
                                        <p className="text-sm text-slate-500">Extração automática de dados.</p>
                                    </button>
                                    <button onClick={() => setModalStep('manual')} className="flex-1 w-full max-w-sm p-8 rounded-[2rem] bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-slate-400 transition-all group text-center">
                                        <div className="w-20 h-20 mx-auto bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform"><Keyboard size={32} className="text-slate-500" /></div>
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Manual</h3>
                                        <p className="text-sm text-slate-500">Preencher campos manualmente.</p>
                                    </button>
                                </div>
                            )}

                            {modalStep === 'ai' && (
                                <div className="p-10 flex flex-col items-center justify-center h-full text-center">
                                    <div className="w-full max-w-md">
                                        {isPolling || processingStatus === 'processing' || isUploading ? (
                                            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300 relative w-full max-w-lg aspect-[3/4] bg-slate-100 dark:bg-slate-700/50 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-600 shadow-xl">
                                                {/* Image Background */}
                                                {uploadedImage ? (
                                                    <>
                                                        <img src={uploadedImage} className="w-full h-full object-contain opacity-50 blur-sm scale-105 transition-all duration-[20s] ease-linear transform translate-y-0" />
                                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-slate-900/10"></div>
                                                    </>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-800">
                                                        <FileText size={48} className="text-slate-300 animate-pulse" />
                                                    </div>
                                                )}

                                                {/* Scanner Line Animation */}
                                                <div className="absolute inset-x-0 h-1 bg-cyan-400/80 shadow-[0_0_20px_rgba(34,211,238,0.6)] z-10 animate-[scan_2s_ease-in-out_infinite]"></div>

                                                {/* Overlay Info */}
                                                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 backdrop-blur-[1px]">
                                                    <div className="bg-white/90 dark:bg-slate-900/90 p-6 rounded-3xl shadow-2xl flex flex-col items-center max-w-[80%] border border-slate-200 dark:border-slate-700">
                                                        <div className="relative mb-4">
                                                            <div className="absolute inset-0 animate-ping opacity-20 bg-cyan-500 rounded-full"></div>
                                                            <Loader2 size={32} className="text-[#2e8ba6] animate-spin relative z-10" />
                                                        </div>
                                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Processando Fatura...</h3>
                                                        <p className="text-xs text-slate-500 text-center">A IA está a ler os detalhes do fornecedor e itens.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="mb-8">
                                                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#73c6df] to-[#2e8ba6] rounded-3xl flex items-center justify-center shadow-lg shadow-[#73c6df]/30 mb-6 rotate-3">
                                                        <ScanLine size={32} className="text-white" />
                                                    </div>
                                                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Importação Inteligente</h3>
                                                    <p className="text-slate-500">Carregue sua fatura (PDF ou Imagem) e deixe a IA preencher tudo para você.</p>
                                                </div>

                                                <label className="block w-full cursor-pointer group">
                                                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-[2rem] p-10 bg-slate-50 dark:bg-slate-800/50 hover:bg-[#f0f9ff] dark:hover:bg-slate-800 transition-colors flex flex-col items-center">
                                                        <Upload size={40} className="text-slate-400 group-hover:text-[#2e8ba6] transition-colors mb-4" />
                                                        <span className="font-bold text-slate-700 dark:text-slate-300 text-lg group-hover:text-[#2e8ba6]">Clique para carregar</span>
                                                        <span className="text-sm text-slate-400 mt-2">ou arraste o arquivo aqui</span>
                                                    </div>
                                                    <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleAiUpload} />
                                                </label>

                                                <button onClick={handleCancelAiUpload} className="mt-8 text-slate-400 hover:text-red-500 text-sm font-bold flex items-center justify-center gap-2 mx-auto transition-colors">
                                                    <X size={16} /> Cancelar Processo
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {modalStep === 'manual' && (
                                <div className="p-8 flex flex-col lg:flex-row gap-8">
                                    {/* Left: Image Upload */}
                                    <div className="w-full lg:w-1/3 space-y-4">
                                        <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 h-80 flex flex-col items-center justify-center relative overflow-hidden group">
                                            {uploadedImage ? (
                                                <>
                                                    {(uploadedImage.toLowerCase().endsWith('.pdf') || (uploadedImage.startsWith('blob:') && selectedFile?.type === 'application/pdf')) ? (
                                                        <iframe src={uploadedImage} className="w-full h-full" title="Preview"></iframe>
                                                    ) : (
                                                        <img src={uploadedImage} alt="Preview" className="w-full h-full object-contain" />
                                                    )}
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <label className="cursor-pointer px-4 py-2 bg-white rounded-lg font-bold text-sm shadow-lg hover:scale-105 transition-transform">
                                                            Trocar Imagem
                                                            <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleImageUpload} />
                                                        </label>
                                                    </div>
                                                </>
                                            ) : (
                                                <label className="cursor-pointer flex flex-col items-center p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors w-full h-full justify-center">
                                                    <FileUp size={32} className="text-slate-400 mb-2" />
                                                    <span className="font-bold text-slate-600 dark:text-slate-300">Carregar Documento</span>
                                                    <span className="text-xs text-slate-400 mt-1">Clique para selecionar</span>
                                                    <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleImageUpload} />
                                                </label>
                                            )}
                                        </div>

                                        {/* Status Review Checkbox */}
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Status de Revisão</span>
                                            <button
                                                onClick={() => setFormData({ ...formData, review_status: formData.review_status === 'Revisado' ? 'Não Revisado' : 'Revisado' })}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${formData.review_status === 'Revisado' ? 'bg-[#f0fdf4] text-[#15803d]' : 'bg-slate-100 text-slate-400'}`}
                                            >
                                                <CheckSquare size={14} />
                                                {formData.review_status}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Right: Form */}
                                    <div className="flex-1 space-y-6">
                                        {/* Basic Info */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="label-text mb-2 block">Tipo</label>
                                                <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
                                                    <button onClick={() => setFormData({ ...formData, type: 'Receita' })} className={`flex-1 py-2 rounded-lg text-sm font-bold ${formData.type === 'Receita' ? 'bg-white shadow text-[#15803d]' : 'text-slate-500'}`}>Receita</button>
                                                    <button onClick={() => setFormData({ ...formData, type: 'Despesa' })} className={`flex-1 py-2 rounded-lg text-sm font-bold ${formData.type === 'Despesa' ? 'bg-white shadow text-rose-500' : 'text-slate-500'}`}>Despesa</button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="label-text mb-2 block">Classificação</label>
                                                <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
                                                    <button onClick={() => setFormData({ ...formData, expense_type: 'Fixo' })} className={`flex-1 py-2 rounded-lg text-sm font-bold ${formData.expense_type === 'Fixo' ? 'bg-white shadow text-indigo-500' : 'text-slate-500'}`}>Fixo</button>
                                                    <button onClick={() => setFormData({ ...formData, expense_type: 'Flexivel' })} className={`flex-1 py-2 rounded-lg text-sm font-bold ${formData.expense_type === 'Flexivel' ? 'bg-white shadow text-indigo-500' : 'text-slate-500'}`}>Flexível</button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="label-text mb-2 block">Data</label>
                                                <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="input-field w-full" />
                                            </div>
                                            <div>
                                                <label className="label-text mb-2 block">Status Pagamento</label>
                                                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="input-field w-full">
                                                    <option value="Pendente">Pendente</option>
                                                    <option value="Pago">Pago</option>
                                                    <option value="Atrasado">Atrasado</option>
                                                </select>
                                            </div>
                                        </div>

                                        <input type="text" value={formData.client} onChange={(e) => setFormData({ ...formData, client: e.target.value })} className="input-field w-full" placeholder="Cliente / Fornecedor" />

                                        {/* Dynamic Category */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="label-text mb-2 block">Categoria</label>
                                                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="input-field w-full mb-2">
                                                    <option value="">Selecione...</option>
                                                    {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={customCategory}
                                                        onChange={e => setCustomCategory(e.target.value)}
                                                        placeholder="Nova categoria..."
                                                        className="input-field flex-1 py-1 text-xs"
                                                    />
                                                    <button onClick={handleAddCustomCategory} className="px-3 bg-slate-200 dark:bg-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300">+</button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="label-text mb-2 block">Subcategoria</label>
                                                <input
                                                    type="text"
                                                    value={formData.subcategory || ''}
                                                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                                                    className="input-field w-full"
                                                    placeholder="Ex: Licenças, Servidores..."
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="label-text mb-2 block">Valor Total</label>
                                            <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })} className="input-field w-full font-bold text-lg" />
                                        </div>

                                        {/* Items */}
                                        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-bold text-slate-700 dark:text-slate-200">Itens</h4>
                                                <button onClick={handleAddItem} className="text-[#2e8ba6] text-xs font-bold flex items-center gap-1 hover:underline"><Plus size={14} /> Adicionar Item</button>
                                            </div>
                                            <div className="space-y-3">
                                                {formItems.map((item, idx) => (
                                                    <div key={idx} className="flex gap-2 items-start">
                                                        <input value={item.name} onChange={(e) => handleItemChange(idx, 'name', e.target.value)} className="input-field flex-1 text-sm py-2" placeholder="Item" />
                                                        <input type="number" value={item.quantity} onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value))} className="input-field w-20 text-sm py-2" placeholder="Qtd" />
                                                        <input type="number" value={item.price} onChange={(e) => handleItemChange(idx, 'price', parseFloat(e.target.value))} className="input-field w-24 text-sm py-2" placeholder="Preço" />
                                                        <button onClick={() => handleRemoveItem(idx)} className="p-2 text-rose-400 hover:text-rose-600"><Trash2 size={16} /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {modalStep !== 'choice' && (
                            <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end gap-3">
                                <button onClick={() => setModalStep('choice')} className="px-6 py-3 text-slate-500 font-bold hover:text-slate-800">Voltar</button>
                                {modalStep === 'manual' && (
                                    isSaving ? (
                                        <button disabled className="px-8 py-3 bg-slate-100 text-slate-400 rounded-xl font-bold flex items-center gap-2 cursor-not-allowed">
                                            <Loader2 size={18} className="animate-spin" /> Salvando...
                                        </button>
                                    ) : (
                                        <button onClick={handleSaveInvoice} className="px-8 py-3 bg-[#2e8ba6] text-white rounded-xl font-bold shadow-lg hover:bg-[#257a91] flex items-center gap-2">
                                            <Save size={18} /> Salvar Fatura
                                        </button>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- ANALYSIS MODAL --- */}
            {selectedInvoiceForAnalysis && (() => {
                // Compute chart data for this invoice
                const itemsByValue = (selectedInvoiceForAnalysis.items || []).map(item => ({
                    name: (item.name || 'Sem nome').length > 12 ? (item.name || 'Sem nome').slice(0, 12) + '…' : (item.name || 'Sem nome'),
                    total: item.price * item.quantity
                })).sort((a, b) => b.total - a.total).slice(0, 6);

                // Frequency: count how many times each item name appears across ALL invoices
                const freqMap: Record<string, number> = {};
                invoices.forEach(inv => {
                    (inv.items || []).forEach(item => {
                        const key = (item.name || 'Sem nome').trim().toLowerCase();
                        if (key) freqMap[key] = (freqMap[key] || 0) + 1;
                    });
                });
                const itemsByFrequency = Object.entries(freqMap)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 6)
                    .map(([name, count]) => ({
                        name: name.length > 12 ? name.slice(0, 12) + '…' : name,
                        count
                    }));

                const CHART_COLORS = ['#73c6df', '#2e8ba6', '#8bd7bf', '#0d9488', '#5eead4', '#a78bfa'];

                return (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={closeAnalysisModal}></div>
                    <div className="relative bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="p-8 relative">
                            <button onClick={closeAnalysisModal} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 z-20"><X size={20} /></button>

                            <div className="mb-6">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${selectedInvoiceForAnalysis.type === 'Receita' ? 'bg-[#f0fdf4] text-[#15803d]' : 'bg-rose-50 text-rose-500'}`}>{selectedInvoiceForAnalysis.type}</span>
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white mt-3 line-clamp-1" title={selectedInvoiceForAnalysis.client}>{selectedInvoiceForAnalysis.client}</h2>
                                <p className="text-slate-500 text-sm font-medium">{new Date(selectedInvoiceForAnalysis.date).toLocaleDateString('pt-BR', { dateStyle: 'full' })}</p>
                            </div>

                            <div className="space-y-6">
                                {/* KPI Row */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-5 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-600 text-center">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Valor Total</p>
                                        <p className="text-2xl font-black text-slate-800 dark:text-white">${selectedInvoiceForAnalysis.amount.toLocaleString()}</p>
                                    </div>
                                    <div className="p-5 bg-[#73c6df]/10 rounded-2xl border border-[#73c6df]/20 text-center">
                                        <p className="text-[10px] font-bold text-[#2e8ba6] uppercase mb-1">Items</p>
                                        <p className="text-2xl font-bold text-slate-800 dark:text-white">{selectedInvoiceForAnalysis.items?.length || 0}</p>
                                    </div>
                                    <div className="p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 text-center">
                                        <p className="text-[10px] font-bold text-indigo-500 uppercase mb-1">Categoria</p>
                                        <p className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1">{selectedInvoiceForAnalysis.category}</p>
                                    </div>
                                </div>

                                {/* Chart: Items by Value */}
                                {itemsByValue.length > 0 && (
                                    <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-600 p-5">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Top Items por Valor</h4>
                                        <ResponsiveContainer width="100%" height={180}>
                                            <BarChart data={itemsByValue} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                                                <XAxis type="number" hide />
                                                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} />
                                                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Valor']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                                                <Bar dataKey="total" radius={[0, 8, 8, 0]} barSize={16}>
                                                    {itemsByValue.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}

                                {/* Chart: Most Frequent Items (across all invoices) */}
                                {itemsByFrequency.length > 0 && (
                                    <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-600 p-5">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Items Mais Frequentes (Todas Faturas)</h4>
                                        <ResponsiveContainer width="100%" height={180}>
                                            <BarChart data={itemsByFrequency} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} />
                                                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                                <Tooltip formatter={(v: number) => [`${v}x`, 'Ocorrências']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                                                <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={28}>
                                                    {itemsByFrequency.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}

                                {/* No items fallback */}
                                {itemsByValue.length === 0 && (
                                    <div className="text-center py-8 text-slate-400">
                                        <FileText size={32} className="mx-auto mb-2 opacity-40" />
                                        <p className="text-sm font-medium">Sem itens detalhados nesta fatura.</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 flex gap-3">
                                <button onClick={() => { closeAnalysisModal(); openEditModal(selectedInvoiceForAnalysis); }} className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700 shadow-lg flex items-center justify-center gap-2">
                                    <Edit3 size={16} /> Editar Completo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                );
            })()}


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
import React, { useState, useMemo } from 'react';
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
  Image as ImageIcon,
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
  ScanLine
} from 'lucide-react';
import { Invoice, InvoiceStatus, InvoiceItem, InvoiceType } from '../types';

// --- Mock Data ---
const initialInvoices: Invoice[] = [
  { 
    id: 'INV-001', client: 'Acme Corp', type: 'Receita', amount: 12500, status: 'Pago', date: '2023-10-24', category: 'Software', subcategory: 'Licenciamento',
    items: [{ name: 'Licença Enterprise', description: 'Assinatura Anual', quantity: 1, price: 12500, vat: 23 }]
  },
  { id: 'INV-002', client: 'Global Services', type: 'Receita', amount: 4300, status: 'Pendente', date: '2023-10-22', category: 'Consultoria', subcategory: 'Hora Técnica' },
  { id: 'EXP-045', client: 'Amazon Web Services', type: 'Despesa', amount: 2100, status: 'Pago', date: '2023-10-20', category: 'Infra', subcategory: 'Servidores' },
  { id: 'INV-003', client: 'TechFlow', type: 'Receita', amount: 8900, status: 'Atrasado', date: '2023-10-15', category: 'Software', subcategory: 'Manutenção' },
];

const Billing: React.FC = () => {
  // --- State ---
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // Filters
  const [filterType, setFilterType] = useState<'Todos' | 'Receita' | 'Despesa'>('Todos');
  const [searchText, setSearchText] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  // Status Interaction
  const [openStatusDropdown, setOpenStatusDropdown] = useState<string | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<'choice' | 'manual' | 'ai'>('choice');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  // Form State (New/Edit)
  const [formData, setFormData] = useState<Partial<Invoice>>({
    client: '', amount: 0, date: '', category: '', subcategory: '', items: [], type: 'Receita', status: 'Pendente'
  });
  const [formItems, setFormItems] = useState<InvoiceItem[]>([]);

  // --- Derived Data & Filter Logic ---

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (filterType !== 'Todos' && inv.type !== filterType) return false;
      if (searchText && !inv.client.toLowerCase().includes(searchText.toLowerCase()) && !inv.id.toLowerCase().includes(searchText.toLowerCase())) return false;
      if (supplierFilter && !inv.client.toLowerCase().includes(supplierFilter.toLowerCase())) return false;
      if (dateStart && inv.date < dateStart) return false;
      if (dateEnd && inv.date > dateEnd) return false;
      return true;
    });
  }, [invoices, filterType, searchText, supplierFilter, dateStart, dateEnd]);

  const stats = useMemo(() => {
    const rev = filteredInvoices.filter(i => i.type === 'Receita');
    const exp = filteredInvoices.filter(i => i.type === 'Despesa');
    return {
      revenueVolume: rev.reduce((acc, curr) => acc + curr.amount, 0),
      expenseVolume: exp.reduce((acc, curr) => acc + curr.amount, 0),
      revCount: rev.length,
      expCount: exp.length
    };
  }, [filteredInvoices]);

  // --- Handlers ---

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
    setFormData({ type: 'Receita', status: 'Pendente', items: [] });
    setFormItems([]);
    setUploadedImage(null);
    setModalStep('choice');
    setIsModalOpen(true);
  };

  const openEditModal = (invoice: Invoice) => {
    setFormData(invoice);
    setFormItems(invoice.items || []);
    setUploadedImage(null); // Or load existing image if available
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

  const handleSaveInvoice = () => {
      // In a real app, validate and save to backend
      const totalAmount = formItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const newInvoice: Invoice = {
          id: formData.id || `INV-${Math.floor(Math.random() * 1000)}`,
          client: formData.client || 'Cliente Desconhecido',
          type: formData.type || 'Receita',
          amount: totalAmount || formData.amount || 0,
          status: formData.status || 'Pendente',
          date: formData.date || new Date().toISOString().split('T')[0],
          category: formData.category || 'Geral',
          subcategory: formData.subcategory,
          items: formItems
      };

      if (formData.id) {
          setInvoices(invoices.map(i => i.id === formData.id ? newInvoice : i));
      } else {
          setInvoices([newInvoice, ...invoices]);
      }
      closeModal();
  };

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 pb-20 relative">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Gestão de Faturamento</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Controle centralizado de receitas e despesas.</p>
        </div>
        <div className="flex items-center gap-3">
            <button className="px-5 py-2.5 rounded-xl bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center gap-2">
                <Download size={18} /> Exportar
            </button>
            <button onClick={openNewInvoiceModal} className="px-5 py-2.5 rounded-xl bg-[#2e8ba6] text-white font-bold text-sm hover:bg-[#257a91] transition-all shadow-lg shadow-[#73c6df]/20 flex items-center gap-2">
                <Plus size={18} /> Nova Fatura
            </button>
        </div>
      </div>

      {/* AI Analysis & Volume Section (Simplified for brevity) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Revenue Card */}
         <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700 p-6 rounded-[2rem] relative overflow-hidden group hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <ArrowUpRight size={120} className="text-[#2e8ba6]" />
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-[#73c6df]/20 rounded-xl text-[#2e8ba6]"><Bot size={20} /></div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Análise de Receita</span>
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                    <h3 className="text-4xl font-extrabold text-slate-800 dark:text-white">${stats.revenueVolume.toLocaleString()}</h3>
                    <span className="text-sm font-bold text-[#4ca68a] bg-[#8bd7bf]/20 px-2 py-1 rounded-lg">+{stats.revCount} docs</span>
                </div>
            </div>
         </div>

         {/* Expense Card */}
         <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700 p-6 rounded-[2rem] relative overflow-hidden group hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <ArrowDownRight size={120} className="text-rose-500" />
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-xl text-rose-500"><Bot size={20} /></div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Análise de Despesas</span>
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                    <h3 className="text-4xl font-extrabold text-slate-800 dark:text-white">${stats.expenseVolume.toLocaleString()}</h3>
                    <span className="text-sm font-bold text-rose-500 bg-rose-100 dark:bg-rose-900/30 px-2 py-1 rounded-lg">{stats.expCount} docs</span>
                </div>
            </div>
         </div>
      </div>

      {/* Advanced Filter Toolbar & View Toggle */}
      <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700 p-4 rounded-[1.5rem] flex flex-col lg:flex-row gap-4 items-center shadow-sm">
         <div className="flex-1 w-full lg:w-auto flex gap-4 overflow-x-auto pb-2 lg:pb-0 no-scrollbar items-center">
            
            {/* Filter Type Tabs */}
            <div className="flex p-1 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-white/60 dark:border-slate-700 shrink-0">
                {['Todos', 'Receita', 'Despesa'].map((type) => (
                    <button 
                        key={type}
                        onClick={() => setFilterType(type as any)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === type ? 'bg-[#73c6df] text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-[#73c6df]'}`}
                    >
                        {type}
                    </button>
                ))}
            </div>
            
            {/* Inputs */}
            <div className="relative group shrink-0 w-48">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    value={supplierFilter}
                    onChange={(e) => setSupplierFilter(e.target.value)}
                    type="text" 
                    placeholder="Fornecedor..." 
                    className="w-full pl-9 pr-3 py-2 bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#73c6df]/30 dark:text-slate-200"
                />
            </div>
         </div>

         {/* View Toggle */}
         <div className="flex items-center bg-white/60 dark:bg-slate-800/60 rounded-xl border border-white/60 dark:border-slate-700 p-1">
            <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#73c6df] text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-[#73c6df]'}`}
                title="Lista"
            >
                <LayoutList size={16} />
            </button>
            <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#73c6df] text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-[#73c6df]'}`}
                title="Grade"
            >
                <LayoutGrid size={16} />
            </button>
         </div>
      </div>

      {/* Main Content (Table) */}
      <div className={`
        ${viewMode === 'list' ? 'bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700 rounded-[2.5rem] p-8 shadow-sm min-h-[500px]' : ''}
      `}>
           {viewMode === 'list' && (
               <div className="overflow-visible">
                  <table className="w-full border-separate border-spacing-y-2">
                      <thead>
                          <tr className="text-left text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                              <th className="pb-4 pl-4 w-10">
                                  <input 
                                    type="checkbox" 
                                    checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                                    onChange={toggleSelectAll}
                                    className="w-4 h-4 rounded border-slate-300 text-[#73c6df] focus:ring-[#73c6df]" 
                                  />
                              </th>
                              <th className="pb-4">Fatura</th>
                              <th className="pb-4">Fornecedor / Cliente</th>
                              <th className="pb-4">Data</th>
                              <th className="pb-4">Valor</th>
                              <th className="pb-4 pl-2">Status</th>
                              <th className="pb-4 text-center">Ações</th>
                          </tr>
                      </thead>
                      <tbody className="text-sm">
                          {filteredInvoices.map((inv) => (
                              <tr 
                                key={inv.id} 
                                className={`group transition-all hover:scale-[1.002] ${selectedInvoices.includes(inv.id) ? 'bg-[#73c6df]/10' : 'bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800'}`}
                              >
                                  <td className="py-4 pl-4 rounded-l-2xl border-y border-l border-white/40 dark:border-slate-700">
                                      <input 
                                        type="checkbox" 
                                        checked={selectedInvoices.includes(inv.id)}
                                        onChange={() => toggleSelect(inv.id)}
                                        className="w-4 h-4 rounded border-slate-300 text-[#73c6df] focus:ring-[#73c6df]" 
                                      />
                                  </td>
                                  <td className="py-4 border-y border-white/40 dark:border-slate-700">
                                      <div className="flex items-center gap-3">
                                          <div className={`p-2 rounded-lg ${inv.type === 'Receita' ? 'bg-[#8bd7bf]/20 text-[#4ca68a]' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-500'}`}>
                                              <FileText size={16} />
                                          </div>
                                          <div>
                                              <p className="font-bold text-slate-800 dark:text-slate-200">{inv.id}</p>
                                              <p className="text-[10px] text-slate-500 dark:text-slate-400">{inv.category} • {inv.subcategory || 'Geral'}</p>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="py-4 border-y border-white/40 dark:border-slate-700">
                                      <div className="flex items-center gap-2">
                                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400 shadow-sm">
                                              {inv.client.substring(0,2).toUpperCase()}
                                          </div>
                                          <span className="font-medium text-slate-700 dark:text-slate-300">{inv.client}</span>
                                      </div>
                                  </td>
                                  <td className="py-4 border-y border-white/40 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium">
                                      {inv.date}
                                  </td>
                                  <td className="py-4 border-y border-white/40 dark:border-slate-700">
                                      <span className={`font-bold ${inv.type === 'Receita' ? 'text-slate-800 dark:text-white' : 'text-rose-500'}`}>
                                          {inv.type === 'Despesa' ? '-' : ''}${inv.amount.toLocaleString()}
                                      </span>
                                  </td>
                                  <td className="py-4 border-y border-white/40 dark:border-slate-700 relative">
                                      <button 
                                        onClick={() => setOpenStatusDropdown(openStatusDropdown === inv.id ? null : inv.id)}
                                        className={`
                                          px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase flex items-center gap-2 w-32 justify-between transition-all border
                                          ${inv.status === 'Pago' ? 'bg-[#8bd7bf]/10 text-[#4ca68a] border-[#8bd7bf]/20 hover:bg-[#8bd7bf]/20' : ''}
                                          ${inv.status === 'Pendente' ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:border-amber-700/50' : ''}
                                          ${inv.status === 'Atrasado' ? 'bg-rose-50 text-rose-500 border-rose-200 hover:bg-rose-100 dark:bg-rose-900/20 dark:border-rose-700/50' : ''}
                                        `}
                                      >
                                          <span className="flex items-center gap-1.5">
                                            {inv.status === 'Pago' && <CheckCircle2 size={12} />}
                                            {inv.status === 'Pendente' && <Clock size={12} />}
                                            {inv.status === 'Atrasado' && <AlertCircle size={12} />}
                                            {inv.status}
                                          </span>
                                          <ChevronDown size={12} />
                                      </button>
                                  </td>
                                  <td className="py-4 pr-4 rounded-r-2xl border-y border-r border-white/40 dark:border-slate-700 text-center">
                                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button onClick={() => openEditModal(inv)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-[#73c6df] transition-colors" title="Editar">
                                              <Edit3 size={16} />
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
                {/* Simplified grid view to save space in code block */}
                {filteredInvoices.map((inv) => (
                    <div key={inv.id} className="bg-white/40 dark:bg-slate-800/40 p-6 rounded-[2rem] border border-white/50 dark:border-slate-700">
                        <h4 className="font-bold dark:text-white">{inv.client}</h4>
                        <p className="text-sm text-slate-500">{inv.amount}</p>
                        <button onClick={() => openEditModal(inv)} className="mt-2 text-[#73c6df] text-xs font-bold">Editar</button>
                    </div>
                ))}
             </div>
           )}
      </div>

      {/* --- INVOICE MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={closeModal}></div>
          <div className="relative bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
             
             {/* Modal Header */}
             <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
               <div>
                 <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">
                    {modalStep === 'choice' ? 'Adicionar Novo Documento' : (formData.id ? 'Editar Fatura' : 'Nova Fatura Manual')}
                 </h2>
                 {modalStep !== 'choice' && <p className="text-xs text-slate-500">Preencha os detalhes abaixo.</p>}
               </div>
               <button onClick={closeModal} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/20">
                
                {/* STEP: CHOICE */}
                {modalStep === 'choice' && (
                    <div className="p-10 flex flex-col md:flex-row gap-8 items-center justify-center h-full">
                        <button 
                            onClick={() => setModalStep('ai')}
                            className="flex-1 w-full max-w-sm p-8 rounded-[2rem] bg-gradient-to-br from-[#73c6df]/10 to-[#8bd7bf]/10 border-2 border-[#73c6df]/30 hover:border-[#73c6df] transition-all group text-center"
                        >
                            <div className="w-20 h-20 mx-auto bg-white dark:bg-slate-700 rounded-full flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform">
                                <ScanLine size={32} className="text-[#73c6df]" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Automático (IA)</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Carregue o PDF ou imagem e deixe nossa IA extrair todos os dados para você.</p>
                        </button>

                        <button 
                            onClick={() => setModalStep('manual')}
                            className="flex-1 w-full max-w-sm p-8 rounded-[2rem] bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 transition-all group text-center"
                        >
                             <div className="w-20 h-20 mx-auto bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform">
                                <Keyboard size={32} className="text-slate-500 dark:text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Manual</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Preencha os campos manualmente e anexe o comprovativo.</p>
                        </button>
                    </div>
                )}

                {/* STEP: MANUAL FORM */}
                {modalStep === 'manual' && (
                    <div className="p-8 flex flex-col lg:flex-row gap-8">
                        {/* Left: Image Upload & Preview */}
                        <div className="w-full lg:w-1/3">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 h-96 flex flex-col items-center justify-center relative overflow-hidden group">
                                {uploadedImage ? (
                                    <>
                                        <img src={uploadedImage} alt="Preview" className="w-full h-full object-contain" />
                                        <button 
                                            onClick={() => setUploadedImage(null)}
                                            className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                ) : (
                                    <label className="cursor-pointer flex flex-col items-center p-8 w-full h-full justify-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 mb-4 group-hover:scale-110 transition-transform">
                                            <FileUp size={24} />
                                        </div>
                                        <span className="font-bold text-slate-600 dark:text-slate-300">Carregar Fatura</span>
                                        <span className="text-xs text-slate-400 mt-2">JPG, PNG ou PDF</span>
                                        <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleImageUpload} />
                                    </label>
                                )}
                            </div>
                            <p className="text-xs text-center text-slate-400 mt-4">A imagem da fatura ajuda na auditoria futura.</p>
                        </div>

                        {/* Right: Form Fields */}
                        <div className="flex-1 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Tipo</label>
                                    <div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-xl">
                                        <button 
                                            onClick={() => setFormData({...formData, type: 'Receita'})} 
                                            className={`flex-1 py-2 rounded-lg text-sm font-bold ${formData.type === 'Receita' ? 'bg-white dark:bg-slate-600 shadow-sm text-[#4ca68a]' : 'text-slate-500'}`}
                                        >Receita</button>
                                        <button 
                                            onClick={() => setFormData({...formData, type: 'Despesa'})}
                                            className={`flex-1 py-2 rounded-lg text-sm font-bold ${formData.type === 'Despesa' ? 'bg-white dark:bg-slate-600 shadow-sm text-rose-500' : 'text-slate-500'}`}
                                        >Despesa</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Status</label>
                                    <select 
                                        value={formData.status}
                                        onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#73c6df]/30 dark:text-white"
                                    >
                                        <option value="Pendente">Pendente</option>
                                        <option value="Pago">Pago</option>
                                        <option value="Atrasado">Atrasado</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Cliente / Fornecedor</label>
                                <input 
                                    type="text" 
                                    value={formData.client} 
                                    onChange={(e) => setFormData({...formData, client: e.target.value})}
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#73c6df]/30 dark:text-white"
                                    placeholder="Nome da empresa..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Data</label>
                                    <input 
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#73c6df]/30 dark:text-white" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Valor Total</label>
                                    <div className="relative">
                                        <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="number" 
                                            value={formData.amount}
                                            onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
                                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#73c6df]/30 dark:text-white font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Categoria</label>
                                    <select 
                                        value={formData.category}
                                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#73c6df]/30 dark:text-white"
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="Software">Software</option>
                                        <option value="Consultoria">Consultoria</option>
                                        <option value="Infra">Infraestrutura</option>
                                        <option value="Marketing">Marketing</option>
                                        <option value="Escritório">Escritório</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Subcategoria</label>
                                    <input 
                                        type="text" 
                                        value={formData.subcategory || ''}
                                        onChange={(e) => setFormData({...formData, subcategory: e.target.value})}
                                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#73c6df]/30 dark:text-white"
                                        placeholder="Ex: Licenças, Servidores..."
                                    />
                                </div>
                            </div>

                            {/* Line Items */}
                            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold text-slate-700 dark:text-slate-200">Itens da Fatura</h4>
                                    <button onClick={handleAddItem} className="text-[#73c6df] text-xs font-bold flex items-center gap-1 hover:underline">
                                        <Plus size={14} /> Adicionar Item
                                    </button>
                                </div>
                                
                                <div className="space-y-3">
                                    {formItems.map((item, idx) => (
                                        <div key={idx} className="flex gap-2 items-start">
                                            <div className="flex-1">
                                                <input 
                                                    placeholder="Descrição do item"
                                                    value={item.name}
                                                    onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:text-white"
                                                />
                                            </div>
                                            <div className="w-20">
                                                 <input 
                                                    type="number"
                                                    placeholder="Qtd"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value))}
                                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:text-white"
                                                />
                                            </div>
                                            <div className="w-24">
                                                 <input 
                                                    type="number"
                                                    placeholder="Preço"
                                                    value={item.price}
                                                    onChange={(e) => handleItemChange(idx, 'price', parseFloat(e.target.value))}
                                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:text-white"
                                                />
                                            </div>
                                            <button onClick={() => handleRemoveItem(idx)} className="p-2 text-rose-400 hover:text-rose-600">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {formItems.length === 0 && (
                                        <p className="text-center text-sm text-slate-400 py-4 italic">Nenhum item adicionado.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Buttons */}
            {modalStep !== 'choice' && (
                <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end gap-3">
                    <button onClick={() => setModalStep('choice')} className="px-6 py-3 text-slate-500 font-bold hover:text-slate-800">Voltar</button>
                    <button 
                        onClick={handleSaveInvoice}
                        className="px-8 py-3 bg-[#2e8ba6] text-white rounded-xl font-bold shadow-lg hover:bg-[#257a91] flex items-center gap-2"
                    >
                        <Save size={18} /> Salvar Fatura
                    </button>
                </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Billing;
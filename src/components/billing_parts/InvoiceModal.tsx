import React, { useState, useEffect } from 'react';
import {
    Plus,
    X,
    Upload,
    FileText,
    Save,
    Trash2,
    Loader2,
    ScanLine,
    Keyboard,
    FileUp,
    CheckSquare
} from 'lucide-react';
import { Modal } from '../common/Modal/Modal';
import { Invoice, InvoiceItem } from '../../types';
import { geminiService, invoiceService, supabase } from '../../services';
import { invoiceSchema } from '../../validation/schemas';
import { validateNIF } from '../../utils/compliance';

interface InvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoiceToEdit?: Invoice | null; // If provided, edit mode. Else, new mode.
    onSuccess: () => void;
    availableCategories: string[];
    onAddCategory: (category: string) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
    isOpen,
    onClose,
    invoiceToEdit,
    onSuccess,
    availableCategories,
    onAddCategory
}) => {
    // --- State ---
    const [step, setStep] = useState<'choice' | 'manual' | 'ai'>('choice');
    const [formData, setFormData] = useState<Partial<Invoice>>({
        client: '', amount: 0, date: new Date().toISOString().split('T')[0], category: '', subcategory: '', items: [], type: 'Receita', status: 'Pendente', expense_type: 'Flexivel', review_status: 'Não Revisado', nif: ''
    });
    const [formItems, setFormItems] = useState<InvoiceItem[]>([]);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
    const [processingInvoiceId, setProcessingInvoiceId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [customCategory, setCustomCategory] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    const [processingStatus, setProcessingStatus] = useState<string | null>(null);

    // AI Polling
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (processingInvoiceId) {
            setProcessingStatus('processing');
            interval = setInterval(async () => {
                const fetched = await invoiceService.getInvoiceById(processingInvoiceId);
                if (fetched) {
                    if (fetched.processing_status === 'completed' || fetched.processing_status === 'needs_review') {
                        // AI Finished
                        setProcessingStatus(fetched.processing_status);
                        setFormData(prev => ({
                            ...prev,
                            id: fetched.id,
                            client: fetched.client,
                            date: fetched.date,
                            amount: fetched.amount,
                            items: fetched.items || [],
                            type: fetched.type,
                            category: fetched.category,
                            subcategory: fetched.subcategory,
                        }));
                        setFormItems(fetched.items || []);
                        if (fetched.fileUrl) setUploadedImage(fetched.fileUrl);
                        
                        setProcessingInvoiceId(null);
                        setIsUploading(false);
                        setStep('manual');
                        clearInterval(interval);
                    }
                }
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [processingInvoiceId]);

    // Initialize
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
        
        if (isOpen) {
            if (invoiceToEdit) {
                setStep('manual');
                setFormData(invoiceToEdit);
                setFormItems(invoiceToEdit.items || []);
                setUploadedImage(invoiceToEdit.fileUrl || null);
            } else {
                setStep('choice');
                resetForm();
            }
        }
    }, [isOpen, invoiceToEdit]);

    const resetForm = () => {
        setFormData({
            type: 'Receita', status: 'Pendente', items: [], date: new Date().toISOString().split('T')[0], expense_type: 'Flexivel', review_status: 'Não Revisado'
        });
        setFormItems([]);
        setUploadedImage(null);
        setSelectedFile(undefined);
        setCustomCategory('');
        setProcessingInvoiceId(null);
    };

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
            } else {
                alert('Falha ao iniciar processamento: ' + result.message);
                setIsUploading(false);
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao enviar arquivo.');
            setIsUploading(false);
        }
    };

    const handleCancelAiUpload = async () => {
        if (processingInvoiceId) {
            try {
                await invoiceService.deleteInvoice(processingInvoiceId);
            } catch (e) { console.warn(e); }
        }
        setProcessingInvoiceId(null);
        setUploadedImage(null);
        setStep('choice');
        setIsUploading(false);
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
        if (customCategory) {
            onAddCategory(customCategory);
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
                // Ensure category is set
                category: formData.category || customCategory || 'Outros',
                items: formItems
            };

            // VALIDATION
            const validationResult = invoiceSchema.safeParse(invoiceToSave);
            if (!validationResult.success) {
                const fieldErrors = validationResult.error.flatten().fieldErrors;
                const errorMessages = Object.entries(fieldErrors)
                    .map(([field, errs]) => `${field}: ${errs?.join(', ')}`)
                    .join('\n');
                alert(`Por favor, corrija os seguintes erros:\n${errorMessages}`);
                setIsSaving(false);
                return;
            }

            // Compliance Validation (NIF)
            if (formData.nif && !validateNIF(formData.nif)) {
                alert('NIF inválido. Verifique o número inserido.');
                setIsSaving(false);
                return;
            }

            if (formData.id) {
                // Edit / AI Result Update
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
                // New Manual Invoice
                await invoiceService.createInvoice(invoiceToSave, selectedFile);
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving invoice:', error);
            alert('Erro ao salvar fatura. Verifique os dados.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={step === 'choice' ? 'Adicionar Novo Documento' : (formData.id ? 'Editar Fatura' : 'Nova Fatura Manual')}
            size="xl"
            noPadding={true}
            bodyClassName="bg-slate-50 dark:bg-slate-900/20"
            footer={step !== 'choice' && (
                <div className="flex justify-end gap-3 w-full">
                    <button onClick={() => setStep('choice')} className="px-6 py-3 text-slate-500 font-bold hover:text-slate-800 transition-colors">Voltar</button>
                    {step === 'manual' && (
                        isSaving ? (
                            <button disabled className="px-8 py-3 bg-slate-100 text-slate-400 rounded-xl font-bold flex items-center gap-2 cursor-not-allowed">
                                <Loader2 size={18} className="animate-spin" /> Salvando...
                            </button>
                        ) : (
                            <button onClick={handleSaveInvoice} className="px-8 py-3 bg-[#2e8ba6] text-white rounded-xl font-bold shadow-lg hover:bg-[#257a91] flex items-center gap-2 transition-transform active:scale-95">
                                <Save size={18} /> Salvar Fatura
                            </button>
                        )
                    )}
                </div>
            )}
        >
             {step === 'choice' && (
                <div className="p-10 flex flex-col md:flex-row gap-8 items-center justify-center h-full min-h-[400px]">
                    <button onClick={() => setStep('ai')} className="flex-1 w-full max-w-sm p-8 rounded-[2rem] bg-gradient-to-br from-[#73c6df]/10 to-[#8bd7bf]/10 border-2 border-[#73c6df]/30 hover:border-[#73c6df] transition-all group text-center cursor-pointer">
                        <div className="w-20 h-20 mx-auto bg-white dark:bg-slate-700 rounded-full flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform"><ScanLine size={32} className="text-[#73c6df]" /></div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Automático (IA)</h3>
                        <p className="text-sm text-slate-500">Extração automática de dados.</p>
                    </button>
                    <button onClick={() => setStep('manual')} className="flex-1 w-full max-w-sm p-8 rounded-[2rem] bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-slate-400 transition-all group text-center cursor-pointer">
                        <div className="w-20 h-20 mx-auto bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform"><Keyboard size={32} className="text-slate-500" /></div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Manual</h3>
                        <p className="text-sm text-slate-500">Preencher campos manualmente.</p>
                    </button>
                </div>
            )}

            {step === 'ai' && (
                <div className="p-10 flex flex-col items-center justify-center h-full text-center min-h-[400px]">
                    <div className="w-full max-w-md">
                        {processingInvoiceId || isUploading ? (
                            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300 relative w-full max-w-lg aspect-[3/4] bg-slate-100 dark:bg-slate-700/50 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-600 shadow-xl mx-auto">
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

            {step === 'manual' && (
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
                                <label className="label-text mb-2 block font-bold text-xs text-slate-500 uppercase">Tipo</label>
                                <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
                                    <button onClick={() => setFormData({ ...formData, type: 'Receita' })} className={`flex-1 py-2 rounded-lg text-sm font-bold ${formData.type === 'Receita' ? 'bg-white shadow text-[#15803d]' : 'text-slate-500'}`}>Receita</button>
                                    <button onClick={() => setFormData({ ...formData, type: 'Despesa' })} className={`flex-1 py-2 rounded-lg text-sm font-bold ${formData.type === 'Despesa' ? 'bg-white shadow text-rose-500' : 'text-slate-500'}`}>Despesa</button>
                                </div>
                            </div>
                            <div>
                                <label className="label-text mb-2 block font-bold text-xs text-slate-500 uppercase">Classificação</label>
                                <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
                                    <button onClick={() => setFormData({ ...formData, expense_type: 'Fixo' })} className={`flex-1 py-2 rounded-lg text-sm font-bold ${formData.expense_type === 'Fixo' ? 'bg-white shadow text-indigo-500' : 'text-slate-500'}`}>Fixo</button>
                                    <button onClick={() => setFormData({ ...formData, expense_type: 'Flexivel' })} className={`flex-1 py-2 rounded-lg text-sm font-bold ${formData.expense_type === 'Flexivel' ? 'bg-white shadow text-indigo-500' : 'text-slate-500'}`}>Flexível</button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label-text mb-2 block font-bold text-xs text-slate-500 uppercase">Data</label>
                                <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="input-field w-full px-4 py-3 bg-slate-100 rounded-xl" />
                            </div>
                            <div>
                                <label className="label-text mb-2 block font-bold text-xs text-slate-500 uppercase">Status Pagamento</label>
                                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="input-field w-full px-4 py-3 bg-slate-100 rounded-xl">
                                    <option value="Pendente">Pendente</option>
                                    <option value="Pago">Pago</option>
                                    <option value="Atrasado">Atrasado</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <label className="label-text mb-2 block font-bold text-xs text-slate-500 uppercase">Cliente / Fornecedor</label>
                                <input type="text" value={formData.client} onChange={(e) => setFormData({ ...formData, client: e.target.value })} className="input-field w-full px-4 py-3 bg-slate-100 rounded-xl" placeholder="Nome da Empresa" />
                            </div>
                            <div>
                                <label className="label-text mb-2 block font-bold text-xs text-slate-500 uppercase">NIF</label>
                                <input type="text" value={formData.nif || ''} onChange={(e) => setFormData({ ...formData, nif: e.target.value })} className="input-field w-full px-4 py-3 bg-slate-100 rounded-xl" placeholder="000000000" />
                            </div>
                        </div>

                        {/* Dynamic Category */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label-text mb-2 block font-bold text-xs text-slate-500 uppercase">Categoria</label>
                                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="input-field w-full mb-2 px-4 py-3 bg-slate-100 rounded-xl">
                                    <option value="">Selecione...</option>
                                    {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={customCategory}
                                        onChange={e => setCustomCategory(e.target.value)}
                                        placeholder="Nova categoria..."
                                        className="input-field flex-1 py-1 text-xs px-2 bg-slate-100 rounded-lg"
                                    />
                                    <button onClick={handleAddCustomCategory} className="px-3 bg-slate-200 dark:bg-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300">+</button>
                                </div>
                            </div>
                            <div>
                                <label className="label-text mb-2 block font-bold text-xs text-slate-500 uppercase">Subcategoria</label>
                                <input
                                    type="text"
                                    value={formData.subcategory || ''}
                                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                                    className="input-field w-full px-4 py-3 bg-slate-100 rounded-xl"
                                    placeholder="Ex: Licenças, Servidores..."
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label-text mb-2 block font-bold text-xs text-slate-500 uppercase">Valor Total</label>
                            <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })} className="input-field w-full font-bold text-lg px-4 py-3 bg-slate-100 rounded-xl" />
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
                                        <input value={item.name} onChange={(e) => handleItemChange(idx, 'name', e.target.value)} className="input-field flex-1 text-sm py-2 px-3 bg-slate-100 rounded-lg" placeholder="Item" />
                                        <input type="number" value={item.quantity} onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value))} className="input-field w-20 text-sm py-2 px-3 bg-slate-100 rounded-lg" placeholder="Qtd" />
                                        <input type="number" value={item.price} onChange={(e) => handleItemChange(idx, 'price', parseFloat(e.target.value))} className="input-field w-24 text-sm py-2 px-3 bg-slate-100 rounded-lg" placeholder="Preço" />
                                        <button onClick={() => handleRemoveItem(idx)} className="p-2 text-rose-400 hover:text-rose-600"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
};

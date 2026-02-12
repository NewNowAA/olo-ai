import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Save,
  X,
  Plus,
  Trash2
} from 'lucide-react';
import { geminiService, supabase } from '@/src/services';
import { useInvoiceProcessing } from '@/src/hooks/useInvoiceProcessing';
import { Invoice, InvoiceItem } from '@/src/types/invoice.types';

const InvoiceBuilder: React.FC = () => {
  // State
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Invoice>>({
    client: '',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    items: []
  });

  // Custom hook for polling
  const { invoice: aiInvoice, status, isPolling } = useInvoiceProcessing(invoiceId);

  // Get User ID on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  // Effect: Update form when AI finishes
  useEffect(() => {
    if (aiInvoice && (status === 'needs_review' || status === 'completed')) {
      console.log("AI Invoice Data:", aiInvoice);
      setFormData(prev => ({
        ...prev,
        client: aiInvoice.client || prev.client,
        date: aiInvoice.date || prev.date,
        amount: aiInvoice.amount || prev.amount,
        items: aiInvoice.items || [],
        // Add validation/flagging logic here if needed
      }));
    }
  }, [aiInvoice, status]);

  // Handlers
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));

      // Auto-upload if user is logged in
      if (userId) {
        try {
          const result = await geminiService.processInvoice(selectedFile, userId);
          if (result.success && result.invoiceId) {
            setInvoiceId(result.invoiceId);
          } else {
            alert("Falha ao iniciar processamento: " + result.message);
          }
        } catch (error) {
          console.error(error);
          alert("Erro ao enviar arquivo.");
        }
      } else {
        alert("Por favor faça login para usar a IA.");
      }
    }
  };

  const isFlagged = (field: string) => {
    return aiInvoice?.ai_metadata?.flagged_fields?.includes(field);
  };

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto min-h-screen flex flex-col md:flex-row gap-8">

      {/* Left Panel: Upload & Preview */}
      <div className="w-full md:w-1/2 flex flex-col gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex-1 min-h-[500px] flex flex-col">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <FileText className="text-[#73c6df]" />
            Documento Original
          </h2>

          {previewUrl ? (
            <div className="relative flex-1 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 group">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
              <button
                onClick={() => { setFile(null); setPreviewUrl(null); setInvoiceId(null); }}
                className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={20} />
              </button>

              {/* Status Overlay */}
              {(isPolling || status === 'processing') && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                  <Loader2 className="w-12 h-12 animate-spin mb-4 text-[#73c6df]" />
                  <p className="font-bold text-lg">A Inteligência Artificial está a ler...</p>
                  <p className="text-sm opacity-80">Extraindo dados do documento</p>
                </div>
              )}
            </div>
          ) : (
            <label className="flex-1 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer flex flex-col items-center justify-center gap-4 text-slate-500 hover:text-slate-700">
              <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center">
                <Upload size={32} className="text-[#73c6df]" />
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">Arraste sua fatura aqui</p>
                <p className="text-sm">ou clique para fazer upload (PDF, JPG, PNG)</p>
              </div>
              <input type="file" onChange={handleFileChange} accept="image/*,application/pdf" className="hidden" />
            </label>
          )}
        </div>
      </div>

      {/* Right Panel: Extraction Form */}
      <div className="w-full md:w-1/2 flex flex-col gap-6">
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100 h-full overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Dados Extraídos</h2>
              <p className="text-slate-500 text-sm">Verifique os dados antes de salvar.</p>
            </div>
            <div className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${status === 'needs_review' ? 'bg-amber-100 text-amber-600' :
                status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                  status === 'processing' ? 'bg-blue-100 text-blue-600 animate-pulse' :
                    'bg-slate-100 text-slate-500'
              }`}>
              {status === 'idle' ? 'Aguardando Arquivo' :
                status === 'processing' ? 'Processando...' :
                  status === 'needs_review' ? 'Revisão Necessária' :
                    status === 'completed' ? 'Sucesso' : status}
            </div>
          </div>

          <div className="space-y-6">
            {/* Vendor Name */}
            <div className={`p-4 rounded-xl border transition-all ${isFlagged('vendor_name') ? 'border-amber-300 bg-amber-50' : 'border-slate-200 hover:border-[#73c6df]'
              }`}>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex justify-between">
                Fornecedor / Cliente
                {isFlagged('vendor_name') && <span className="text-amber-600 flex items-center gap-1"><AlertTriangle size={12} /> Confiança Baixa</span>}
              </label>
              <input
                type="text"
                value={formData.client}
                onChange={e => setFormData({ ...formData, client: e.target.value })}
                className="w-full bg-transparent font-semibold text-lg text-slate-800 focus:outline-none"
                placeholder="Nome da empresa"
              />
            </div>

            {/* Date & Amount Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl border transition-all ${isFlagged('date') ? 'border-amber-300 bg-amber-50' : 'border-slate-200 hover:border-[#73c6df]'
                }`}>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data</label>
                <input
                  type="date"
                  value={formData.date?.toString()}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-transparent font-semibold text-lg text-slate-800 focus:outline-none"
                />
              </div>

              <div className={`p-4 rounded-xl border transition-all ${isFlagged('total_amount') ? 'border-amber-300 bg-amber-50' : 'border-slate-200 hover:border-[#73c6df]'
                }`}>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Total (Kz)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  className="w-full bg-transparent font-semibold text-lg text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            {/* Items List */}
            <div className="border-t border-slate-100 pt-6">
              <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                Itens da Fatura
                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">{formData.items?.length || 0}</span>
              </h3>

              <div className="space-y-3 mb-4">
                {formData.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 group">
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 text-sm">{item.description}</p>
                      <p className="text-xs text-slate-400">{item.quantity} x {item.price?.toLocaleString()} Kz</p>
                    </div>
                    <div className="font-bold text-slate-700 text-sm">
                      {(item.quantity * item.price).toLocaleString()} Kz
                    </div>
                    <button className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {(!formData.items || formData.items.length === 0) && (
                  <div className="text-center py-6 text-slate-400 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    Nenhum item detectado automaticamente.
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 flex gap-4">
              <button className="flex-1 py-4 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button
                disabled={isPolling || status === 'processing'}
                className="flex-[2] py-4 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPolling ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                {status === 'needs_review' ? 'Aprovar & Salvar' : 'Salvar Fatura'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceBuilder;
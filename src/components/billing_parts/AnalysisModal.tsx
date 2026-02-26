import React, { useState } from 'react';
import {
    X,
    Edit3,
    FileText,
    Download,
    Eye,
    Maximize2,
    ZoomIn,
    ZoomOut
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Modal } from '../common/Modal/Modal';
import { Invoice } from '../../types';
import { pdfService } from '../../services/pdfService';

interface AnalysisModalProps {
    invoice: Invoice | null;
    onClose: () => void;
    onEdit: (invoice: Invoice) => void;
    allInvoices: Invoice[];
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({
    invoice,
    onClose,
    onEdit,
    allInvoices
}) => {
    const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);

    if (!invoice) return null;

    // Compute chart data for this invoice
    const itemsByValue = (invoice.items || []).map(item => ({
        name: (item.name || 'Sem nome').length > 12 ? (item.name || 'Sem nome').slice(0, 12) + '…' : (item.name || 'Sem nome'),
        total: item.price * item.quantity
    })).sort((a, b) => b.total - a.total).slice(0, 6);

    // Frequency: count how many times each item name appears across ALL invoices
    const freqMap: Record<string, number> = {};
    allInvoices.forEach(inv => {
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

    const hasFile = !!invoice.fileUrl;

    const isPdf = hasFile && invoice.fileUrl!.toLowerCase().includes('.pdf');

    return (
        <>
        <Modal
            isOpen={!!invoice && !isFullscreenPreview}
            onClose={onClose}
            title="" 
            showCloseButton={false}
            size={hasFile ? "5xl" : "lg"}
            noPadding={true}
            bodyClassName=""
        >
            <div className={`p-8 relative flex flex-col ${hasFile ? 'lg:flex-row' : ''} gap-8`} style={{ backgroundColor: 'var(--card)' }}>
                {/* Left/Main Column - Data & Charts */}
                <div className="flex-1 min-w-0">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full transition-colors z-20 lg:hidden" style={{ color: 'var(--t2)' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--input-bg)')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    ><X size={20} /></button>

                    <div className="mb-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${invoice.type === 'Receita' ? 'bg-[#f0fdf4] text-[#15803d]' : 'bg-rose-50 text-rose-500'}`}>{invoice.type}</span>
                        <h2 className="text-2xl font-black mt-3 line-clamp-1" style={{ color: 'var(--t1)' }} title={invoice.client}>{invoice.client}</h2>
                        <p className="text-sm font-medium" style={{ color: 'var(--t3)' }}>{new Date(invoice.date).toLocaleDateString('pt-BR', { dateStyle: 'full' })}</p>
                    </div>

                    <div className="space-y-6">
                        {/* KPI Row */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-5 rounded-2xl border text-center" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border)' }}>
                                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--t3)' }}>Valor</p>
                                <p className="text-xl md:text-2xl font-black truncate" style={{ color: 'var(--t1)' }}>Kz {invoice.amount.toLocaleString()}</p>
                            </div>
                            <div className="p-5 bg-[#73c6df]/10 rounded-2xl border border-[#73c6df]/20 text-center">
                                <p className="text-[10px] font-bold text-[#2e8ba6] uppercase mb-1">Items</p>
                                <p className="text-2xl font-bold" style={{ color: 'var(--t1)' }}>{invoice.items?.length || 0}</p>
                            </div>
                            <div className="p-5 rounded-2xl border text-center" style={{ backgroundColor: 'color-mix(in srgb, var(--blue) 8%, transparent)', borderColor: 'color-mix(in srgb, var(--blue) 15%, transparent)' }}>
                                <p className="text-[10px] font-bold uppercase mb-1" style={{ color: 'var(--blue)' }}>Categoria</p>
                                <p className="text-sm font-bold truncate" style={{ color: 'var(--t1)' }} title={invoice.category}>{invoice.category}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Chart: Items by Value */}
                            {itemsByValue.length > 0 && (
                                <div className="rounded-2xl border p-5 min-h-[220px]" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border)' }}>
                                    <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--t3)' }}>Top Items / Valor</h4>
                                    <div className="h-[180px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={itemsByValue} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                                                <XAxis type="number" hide />
                                                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10, fill: 'var(--t3)', fontWeight: 600 }} />
                                                <Tooltip formatter={(v: number) => [`Kz ${v.toLocaleString()}`, 'Valor']} contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--card)', fontSize: '11px' }} />
                                                <Bar dataKey="total" radius={[0, 8, 8, 0]} barSize={12}>
                                                    {itemsByValue.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {/* Chart: Items by Frequency (across all invoices) */}
                            {itemsByFrequency.length > 0 && (
                                <div className="rounded-2xl border p-5 min-h-[220px]" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border)' }}>
                                    <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--t3)' }}>Frequência Global</h4>
                                    <div className="h-[180px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={itemsByFrequency} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--t3)', fontWeight: 600 }} />
                                                <YAxis allowDecimals={false} hide />
                                                <Tooltip formatter={(v: number) => [`${v}x`, 'Ocorrências']} contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--card)', fontSize: '11px' }} />
                                                <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={20}>
                                                    {itemsByFrequency.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* No items fallback */}
                        {itemsByValue.length === 0 && (
                            <div className="text-center py-8" style={{ color: 'var(--t3)' }}>
                                <FileText size={32} className="mx-auto mb-2 opacity-40" />
                                <p className="text-sm font-medium">Sem itens detalhados nesta fatura.</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex gap-3">
                        <button onClick={() => { onClose(); onEdit(invoice); }}
                            className="flex-1 py-3 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 text-white transition-all hover:opacity-90"
                            style={{ backgroundImage: 'linear-gradient(135deg, #2e8ba6, #73c6df)' }}>
                            <Edit3 size={16} /> Editar
                        </button>
                        <button onClick={() => pdfService.generateInvoicePDF(invoice)}
                            className="py-3 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-80"
                            style={{ backgroundColor: 'color-mix(in srgb, var(--blue) 12%, transparent)', color: 'var(--blue)' }}>
                             <Download size={16} /> PDF
                        </button>
                    </div>
                </div>

                {/* Right Column - Document Preview */}
                {hasFile && (
                    <div className="w-full lg:w-[400px] xl:w-[500px] flex flex-col">
                        <div className="flex items-center justify-between mb-4 lg:hidden">
                            <h3 className="font-bold border-b-2 border-[#73c6df] pb-1">Anexo da Fatura</h3>
                        </div>
                        <div className="relative flex-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden group min-h-[400px] flex flex-col items-center justify-center">
                            {isPdf ? (
                                <iframe src={invoice.fileUrl!} className="w-full h-full border-none" title="Documento da Fatura"></iframe>
                            ) : (
                                <img src={invoice.fileUrl!} alt="Preview da Fatura" className="w-full h-full object-contain" />
                            )}
                            
                            {/* Hover Overlay for Zoom */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                <button
                                    onClick={() => { setIsFullscreenPreview(true); setZoomLevel(1); }}
                                    className="px-6 py-3 bg-white text-slate-800 font-bold rounded-xl shadow-2xl hover:scale-105 transition-transform flex items-center gap-2"
                                >
                                    <Maximize2 size={18} /> Ampliar Fatura
                                </button>
                            </div>

                            {/* Desktop Close Button */}
                            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full shadow-lg transition-transform hover:scale-110 hidden lg:flex text-slate-600 dark:text-slate-300">
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>

        {/* FULLSCREEN PREVIEW MODAL */}
        {isFullscreenPreview && (
            <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-900/95 backdrop-blur-md animate-in fade-in duration-200">
                <div className="flex items-center justify-between p-4 bg-slate-900/50 border-b border-slate-700">
                    <div className="flex items-center gap-4">
                        <span className="font-bold text-white uppercase text-sm">{isPdf ? 'Visualizador PDF' : 'Visualizador de Imagem'}</span>
                        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
                            <button 
                                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
                                className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
                            >
                                <ZoomOut size={18} />
                            </button>
                            <span className="text-xs font-bold text-slate-300 w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                            <button 
                                onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.25))}
                                className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
                            >
                                <ZoomIn size={18} />
                            </button>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsFullscreenPreview(false)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-rose-500 rounded-full transition-colors flex items-center gap-2 font-bold text-sm pr-4"
                    >
                        <X size={20} /> Fechar
                    </button>
                </div>
                
                <div className="flex-1 overflow-auto flex items-center justify-center p-8 custom-scrollbar">
                    {isPdf ? (
                        <iframe 
                            src={invoice.fileUrl!} 
                            className="bg-white shadow-2xl transition-transform duration-200 origin-center" 
                            style={{ width: '80vw', height: '90vh', transform: `scale(${zoomLevel})` }}
                            title="Documento da Fatura Fullscreen"
                        ></iframe>
                    ) : (
                        <img 
                            src={invoice.fileUrl!} 
                            alt="Fatura Ampliada" 
                            className="max-w-none shadow-2xl transition-transform duration-200 origin-center rounded-lg"
                            style={{ transform: `scale(${zoomLevel})` }}
                            draggable={false}
                        />
                    )}
                </div>
            </div>
        )}
        </>
    );
};


import React from 'react';
import {
    X,
    Edit3,
    FileText,
    Download
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

    return (
        <Modal
            isOpen={!!invoice}
            onClose={onClose}
            title="" 
            showCloseButton={false}
            size="lg"
            noPadding={true}
            bodyClassName="bg-white dark:bg-slate-800"
        >
            <div className="p-8 relative">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 z-20"><X size={20} /></button>

                <div className="mb-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${invoice.type === 'Receita' ? 'bg-[#f0fdf4] text-[#15803d]' : 'bg-rose-50 text-rose-500'}`}>{invoice.type}</span>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white mt-3 line-clamp-1" title={invoice.client}>{invoice.client}</h2>
                    <p className="text-slate-500 text-sm font-medium">{new Date(invoice.date).toLocaleDateString('pt-BR', { dateStyle: 'full' })}</p>
                </div>

                <div className="space-y-6">
                    {/* KPI Row */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-5 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-600 text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Valor Total</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">${invoice.amount.toLocaleString()}</p>
                        </div>
                        <div className="p-5 bg-[#73c6df]/10 rounded-2xl border border-[#73c6df]/20 text-center">
                            <p className="text-[10px] font-bold text-[#2e8ba6] uppercase mb-1">Items</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{invoice.items?.length || 0}</p>
                        </div>
                        <div className="p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 text-center">
                            <p className="text-[10px] font-bold text-indigo-500 uppercase mb-1">Categoria</p>
                            <p className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1">{invoice.category}</p>
                        </div>
                    </div>

                    {/* Chart: Items by Value */}
                    {itemsByValue.length > 0 && (
                        <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-600 p-5 min-h-[220px]">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Top Items por Valor</h4>
                            <div className="h-[180px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
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
                        </div>
                    )}

                    {/* Chart: Items by Frequency (across all invoices) */}
                    {itemsByFrequency.length > 0 && (
                        <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-600 p-5 min-h-[220px]">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Items Mais Frequentes (Todas Faturas)</h4>
                            <div className="h-[180px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
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
                    <button onClick={() => { onClose(); onEdit(invoice); }} className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700 shadow-lg flex items-center justify-center gap-2">
                        <Edit3 size={16} /> Editar Completo
                    </button>
                    <button onClick={() => pdfService.generateInvoicePDF(invoice)} className="py-3 px-6 bg-[#2e8ba6]/10 text-[#2e8ba6] rounded-xl font-bold text-sm hover:bg-[#2e8ba6]/20 flex items-center justify-center gap-2">
                         <Download size={16} /> PDF
                    </button>
                </div>
            </div>
        </Modal>
    );
};

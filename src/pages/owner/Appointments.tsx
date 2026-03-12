import React, { useState, useEffect } from 'react';
import { CalendarDays, Check, X, CheckCircle } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import * as api from '../../services/api';
import type { Appointment, AppointmentStatus } from '../../types';

const STATUS_MAP: Record<AppointmentStatus, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmada', color: 'bg-blue-100 text-blue-700' },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-700' },
  completed: { label: 'Concluída', color: 'bg-green-100 text-green-700' },
  no_show: { label: 'Não compareceu', color: 'bg-gray-100 text-gray-500' },
};

export default function Appointments() {
  const { orgId } = useAuth();
  const [items, setItems] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | AppointmentStatus>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    api.getAppointments(orgId).then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false));
  }, [orgId]);

  const handleAction = async (id: string, status: AppointmentStatus) => {
    if (!orgId) return;
    try {
      await api.updateAppointment(orgId, id, { status });
      setItems(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch (err) { console.error(err); }
  };

  const today = new Date().toISOString().split('T')[0];
  const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const filtered = items.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'today') return a.date === today;
    if (filter === 'week') return a.date >= today && a.date <= weekEnd;
    return a.status === filter;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Agenda</h1>
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { key: 'all', label: 'Todas' }, { key: 'today', label: 'Hoje' }, { key: 'week', label: 'Esta semana' },
          { key: 'pending', label: 'Pendentes' }, { key: 'confirmed', label: 'Confirmadas' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key as any)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === f.key ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 border border-gray-200'}`}>{f.label}</button>
        ))}
      </div>
      {loading ? <p className="text-gray-500 text-sm">A carregar...</p> : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400"><CalendarDays size={48} className="mx-auto mb-3 opacity-40" /><p>Sem marcações</p></div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Cliente</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700 hidden md:table-cell">Serviço</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Data/Hora</th>
                <th className="text-center px-4 py-3 font-medium text-gray-700">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{a.olo_customers?.name || 'Anónimo'}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{a.notes || '—'}</td>
                  <td className="px-4 py-3 text-gray-900">{a.date} {a.time_start}</td>
                  <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_MAP[a.status]?.color}`}>{STATUS_MAP[a.status]?.label}</span></td>
                  <td className="px-4 py-3">
                    {a.status === 'pending' && (
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => handleAction(a.id, 'confirmed')} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Confirmar"><Check size={16} /></button>
                        <button onClick={() => handleAction(a.id, 'cancelled')} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Cancelar"><X size={16} /></button>
                      </div>
                    )}
                    {a.status === 'confirmed' && (
                      <button onClick={() => handleAction(a.id, 'completed')} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Concluir"><CheckCircle size={16} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

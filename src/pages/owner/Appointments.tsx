import React, { useState, useEffect } from 'react';
import { CalendarDays, Check, X, CheckCircle, Plus, Pencil, Trash2 } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import * as api from '../../services/api';
import type { Appointment, AppointmentStatus } from '../../types';
import { SkeletonTable } from '../../components/ui/Skeleton';

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
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editAppt, setEditAppt] = useState<Appointment | null>(null);
  const [editForm, setEditForm] = useState({ date: '', time_start: '', service_name: '', notes: '' });
  const [catalogItems, setCatalogItems] = useState<any[]>([]);
  const [newAppointment, setNewAppointment] = useState({
    customer_name: '',
    customer_phone: '',
    service_id: '',
    service_name: '',
    date: new Date().toISOString().split('T')[0],
    time_start: '09:00',
    notes: '',
  });

  useEffect(() => {
    if (!orgId) return;
    Promise.all([
      api.getAppointments(orgId),
      api.getCatalog(orgId)
    ])
    .then(([apptsData, catalogData]) => {
      setItems(apptsData);
      setCatalogItems(catalogData.filter((i: any) => i.active !== false));
      setLoading(false);
    })
    .catch(() => setLoading(false));
  }, [orgId]);

  const handleAction = async (id: string, status: AppointmentStatus) => {
    if (!orgId) return;
    try {
      await api.updateAppointment(orgId, id, { status });
      setItems(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!orgId) return;
    try {
      await api.deleteAppointment(orgId, id);
      setItems(prev => prev.filter(a => a.id !== id));
    } catch (err) { console.error(err); }
    setDeletingId(null);
  };

  const openEdit = (appt: Appointment) => {
    setEditForm({
      date: appt.date,
      time_start: appt.time_start,
      service_name: (appt as any).service_name || '',
      notes: appt.notes || '',
    });
    setEditAppt(appt);
  };

  const handleSaveEdit = async () => {
    if (!orgId || !editAppt) return;
    try {
      await api.updateAppointment(orgId, editAppt.id, editForm);
      const refreshed = await api.getAppointments(orgId);
      setItems(refreshed);
      setEditAppt(null);
    } catch (err) { console.error(err); }
  };

  const handleCreateAppointment = async () => {
    if (!orgId) return;
    try {
      // 1. First find or create customer
      // Doing this simply via a generic API call, or just passing it to be created if backend doesn't support yet
      // For now, we will just use the notes field as a fallback if the backend doesn't handle nested inserts automatically
      const datetime = `${newAppointment.date}T${newAppointment.time_start}:00`;
      const payload = {
        datetime,
        service_name: newAppointment.service_name || 'Geral',
        notes: [
          `Cliente: ${newAppointment.customer_name}`,
          newAppointment.customer_phone ? `Tel: ${newAppointment.customer_phone}` : '',
          newAppointment.notes ? `Nota: ${newAppointment.notes}` : '',
        ].filter(Boolean).join(' | '),
        status: 'confirmed',
        source: 'dashboard'
      };
      
      await api.createAppointment(orgId, payload);
      // Refresh list to get all joins correctly
      const refreshed = await api.getAppointments(orgId);
      setItems(refreshed);
      setShowModal(false);
      setNewAppointment({ ...newAppointment, customer_name: '', customer_phone: '', service_id: '', service_name: '', notes: '' });
    } catch (err) {
      console.error(err);
      alert('Erro ao criar marcação. Tente novamente.');
    }
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
        <button 
          onClick={() => setShowModal(true)} 
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} /> Nova Marcação
        </button>
      </div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { key: 'all', label: 'Todas' }, { key: 'today', label: 'Hoje' }, { key: 'week', label: 'Esta semana' },
          { key: 'pending', label: 'Pendentes' }, { key: 'confirmed', label: 'Confirmadas' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key as any)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === f.key ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 border border-gray-200'}`}>{f.label}</button>
        ))}
      </div>
      {loading ? <SkeletonTable rows={6} cols={5} /> : filtered.length === 0 ? (
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
                  <td className="px-4 py-3 font-medium text-gray-900">{a.customers?.name || 'Anónimo'}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{(a as any).service_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-900">{a.date} {a.time_start}</td>
                  <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_MAP[a.status]?.color}`}>{STATUS_MAP[a.status]?.label}</span></td>
                  <td className="px-4 py-3">
                    {deletingId === a.id ? (
                      <div className="flex gap-1 items-center justify-end text-xs">
                        <span className="text-gray-500">Eliminar?</span>
                        <button onClick={() => handleDelete(a.id)} className="px-2 py-0.5 bg-red-600 text-white rounded text-xs">Sim</button>
                        <button onClick={() => setDeletingId(null)} className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs">Não</button>
                      </div>
                    ) : (
                      <div className="flex gap-1 justify-end">
                        {a.status === 'pending' && (
                          <>
                            <button onClick={() => handleAction(a.id, 'confirmed')} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Confirmar"><Check size={15} /></button>
                            <button onClick={() => handleAction(a.id, 'cancelled')} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Cancelar"><X size={15} /></button>
                          </>
                        )}
                        {a.status === 'confirmed' && (
                          <button onClick={() => handleAction(a.id, 'completed')} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Concluir"><CheckCircle size={15} /></button>
                        )}
                        <button onClick={() => openEdit(a)} className="p-1 text-gray-500 hover:bg-gray-100 rounded" title="Editar"><Pencil size={15} /></button>
                        <button onClick={() => setDeletingId(a.id)} className="p-1 text-red-400 hover:bg-red-50 rounded" title="Eliminar"><Trash2 size={15} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editAppt && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setEditAppt(null)}>
          <div className="bg-white rounded-lg border border-gray-200 p-6 w-full max-w-sm space-y-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900">Editar Marcação</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                <input type="time" value={editForm.time_start} onChange={e => setEditForm(f => ({ ...f, time_start: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Serviço</label>
              <input type="text" value={editForm.service_name} onChange={e => setEditForm(f => ({ ...f, service_name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Ex: Consulta, Corte de cabelo..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" placeholder="Notas adicionais..." />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button onClick={() => setEditAppt(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button onClick={handleSaveEdit} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg border border-gray-200 p-6 w-full max-w-md space-y-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900">Nova Marcação Manual</h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente</label>
                <input type="text" value={newAppointment.customer_name} onChange={e => setNewAppointment(m => ({ ...m, customer_name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Nome" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telemóvel</label>
                <input type="text" value={newAppointment.customer_phone} onChange={e => setNewAppointment(m => ({ ...m, customer_phone: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Opcional" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Serviço/Produto</label>
              <select
                value={newAppointment.service_id}
                onChange={e => {
                  const selected = catalogItems.find(i => i.id === e.target.value);
                  setNewAppointment(m => ({ ...m, service_id: e.target.value, service_name: selected?.name || '' }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="">Selecionar...</option>
                {catalogItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <input type="date" value={newAppointment.date} onChange={e => setNewAppointment(m => ({ ...m, date: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                <input type="time" value={newAppointment.time_start} onChange={e => setNewAppointment(m => ({ ...m, time_start: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas adicionais (opcional)</label>
              <input type="text" value={newAppointment.notes} onChange={e => setNewAppointment(m => ({ ...m, notes: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Ex: Preferência por profissional X..." />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button 
                onClick={handleCreateAppointment} 
                disabled={!newAppointment.customer_name || !newAppointment.date || !newAppointment.time_start} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Criar Marcação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

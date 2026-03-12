import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Plus } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import * as api from '../../services/api';
import type { Customer } from '../../types';

export default function Customers() {
  const { orgId } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' });

  useEffect(() => {
    if (!orgId) return;
    api.getCustomers(orgId).then(data => { setCustomers(data); setLoading(false); }).catch(() => setLoading(false));
  }, [orgId]);

  const handleCreate = async () => {
    if (!orgId || !form.name.trim()) return;
    try {
      await api.createCustomer(orgId, form);
      const refreshed = await api.getCustomers(orgId);
      setCustomers(refreshed);
      setShowModal(false);
      setForm({ name: '', phone: '', email: '', notes: '' });
    } catch (err) {
      console.error(err);
      alert('Erro ao criar cliente.');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={16} /> Adicionar Cliente
        </button>
      </div>

      {loading ? <p className="text-gray-500 text-sm">A carregar...</p> : customers.length === 0 ? (
        <div className="text-center py-12 text-gray-400"><UsersIcon size={48} className="mx-auto mb-3 opacity-40" /><p>Nenhum cliente registado</p></div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700 hidden md:table-cell">Canal</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700 hidden sm:table-cell">Telefone</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700 hidden sm:table-cell">Conversas</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Última interação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name || 'Anónimo'}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{c.telegram_id ? '📱 Telegram' : c.whatsapp_id ? '📞 WhatsApp' : 'Manual'}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-900 hidden sm:table-cell">{c.total_conversations}</td>
                  <td className="px-4 py-3 text-gray-500">{c.last_contact_at ? new Date(c.last_contact_at).toLocaleDateString('pt-PT') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg border border-gray-200 p-6 w-full max-w-md space-y-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900">Novo Cliente</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Nome do cliente" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telemóvel</label>
                <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Opcional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Opcional" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Opcional" />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button onClick={handleCreate} disabled={!form.name.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">Criar Cliente</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Users as UsersIcon } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import * as api from '../../services/api';
import type { Customer } from '../../types';

export default function Customers() {
  const { orgId } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    api.getCustomers(orgId).then(data => { setCustomers(data); setLoading(false); }).catch(() => setLoading(false));
  }, [orgId]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Clientes</h1>
      {loading ? <p className="text-gray-500 text-sm">A carregar...</p> : customers.length === 0 ? (
        <div className="text-center py-12 text-gray-400"><UsersIcon size={48} className="mx-auto mb-3 opacity-40" /><p>Nenhum cliente registado</p></div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700 hidden md:table-cell">Canal</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700 hidden sm:table-cell">Conversas</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Última interação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name || 'Anónimo'}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{c.telegram_id ? '📱 Telegram' : c.whatsapp_id ? '📞 WhatsApp' : '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-900 hidden sm:table-cell">{c.total_conversations}</td>
                  <td className="px-4 py-3 text-gray-500">{c.last_contact_at ? new Date(c.last_contact_at).toLocaleDateString('pt-PT') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

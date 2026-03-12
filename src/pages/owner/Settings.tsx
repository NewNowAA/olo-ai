import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import * as api from '../../services/api';

export default function Settings() {
  const { orgId } = useAuth();
  const [form, setForm] = useState({ business_name: '', address: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    api.getOrg(orgId).then(org => {
      setForm({ business_name: org.business_name || org.name || '', address: org.address || '', phone: org.phone || '' });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [orgId]);

  const handleSave = async () => {
    if (!orgId) return;
    setSaving(true); setSaved(false);
    try { await api.updateOrg(orgId, form); setSaved(true); setTimeout(() => setSaved(false), 3000); }
    catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="text-gray-500">A carregar...</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Definições</h1>

      {/* Channels */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Canais</h2>
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📱</span>
            <div><p className="font-medium text-gray-900 text-sm">Telegram</p><p className="text-xs text-gray-400">Bot conectado</p></div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Ativo</span>
        </div>
        <div className="flex items-center justify-between py-2 border-t border-gray-100 mt-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📞</span>
            <div><p className="font-medium text-gray-900 text-sm">WhatsApp</p><p className="text-xs text-gray-400">Em breve</p></div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Brevemente</span>
        </div>
      </section>

      {/* Business info */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Negócio</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input type="text" value={form.business_name} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Morada</label>
            <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"><Save size={16} /> Guardar</button>
          {saved && <span className="text-green-600 text-sm font-medium">✓ Guardado</span>}
        </div>
      </section>

      {/* Plan */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Plano</h2>
        <div className="flex items-center justify-between">
          <div><p className="font-medium text-gray-900 text-sm">Plano Free</p><p className="text-xs text-gray-400">Funcionalidades básicas incluídas</p></div>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Ativo</span>
        </div>
      </section>
    </div>
  );
}

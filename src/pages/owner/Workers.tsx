import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import * as api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

const DEFAULT_PERMISSIONS = {
  see_catalog: true,
  see_stock: false,
  see_appointments: false,
  see_customers: false,
};

const PERMISSION_LABELS: Record<string, string> = {
  see_catalog: 'Ver catálogo e preços',
  see_stock: 'Ver stock',
  see_appointments: 'Ver marcações',
  see_customers: 'Ver clientes',
};

export default function Workers() {
  const { orgId } = useAuth();
  const toast = useToast();
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', telegram_id: '', permissions: { ...DEFAULT_PERMISSIONS } });
  const [editForm, setEditForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    api.getWorkers(orgId).then(data => { setWorkers(data || []); setLoading(false); }).catch(() => setLoading(false));
  }, [orgId]);

  const handleAdd = async () => {
    if (!orgId || !form.name.trim()) return;
    setSaving(true);
    try {
      const worker = await api.createWorker(orgId, {
        name: form.name.trim(),
        telegram_id: form.telegram_id.trim() || null,
        permissions: form.permissions,
      });
      setWorkers(prev => [...prev, worker]);
      setForm({ name: '', telegram_id: '', permissions: { ...DEFAULT_PERMISSIONS } });
      setShowAdd(false);
      toast.success(`Colaborador "${form.name.trim()}" adicionado`);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao adicionar colaborador');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (workerId: string) => {
    if (!orgId) return;
    setSaving(true);
    try {
      await api.updateWorker(orgId, workerId, {
        name: editForm.name,
        telegram_id: editForm.telegram_id || null,
        permissions: editForm.permissions,
      });
      setWorkers(prev => prev.map(w => w.id === workerId ? { ...w, ...editForm } : w));
      setEditingId(null);
      toast.success('Colaborador atualizado');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao atualizar colaborador');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (workerId: string) => {
    if (!orgId || !confirm('Remover este colaborador?')) return;
    try {
      await api.deleteWorker(orgId, workerId);
      setWorkers(prev => prev.filter(w => w.id !== workerId));
      toast.success('Colaborador removido');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao remover colaborador');
    }
  };

  const startEdit = (worker: any) => {
    setEditingId(worker.id);
    setEditForm({
      name: worker.name,
      telegram_id: worker.telegram_id || '',
      permissions: { ...DEFAULT_PERMISSIONS, ...(worker.permissions || {}) },
    });
  };

  if (loading) return <div className="text-gray-500">A carregar...</div>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Colaboradores</h1>
          <p className="text-sm text-gray-500 mt-1">Regista colaboradores para que possam usar o bot para fazer ponto e aceder a informações do negócio.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus size={16} /> Adicionar
        </button>
      </div>

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm font-semibold text-blue-800 mb-1">Como funciona</p>
        <ol className="text-xs text-blue-700 space-y-1 list-decimal pl-4">
          <li>Adiciona o colaborador com o nome e o seu ID do Telegram (obtido via @userinfobot)</li>
          <li>O colaborador envia "entrada" ao bot no início do turno</li>
          <li>No final envia "saída" — o bot regista o turno automaticamente</li>
          <li>Configura o que cada colaborador pode ver no negócio</li>
        </ol>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-4">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">Novo Colaborador</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nome *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Ex: João Silva"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">ID Telegram (numérico)</label>
              <input
                type="text"
                value={form.telegram_id}
                onChange={e => setForm(f => ({ ...f, telegram_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Ex: 123456789"
              />
              <p className="text-xs text-gray-400 mt-1">Obtido via @userinfobot no Telegram</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Permissões</label>
              <div className="space-y-2">
                {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(form.permissions as any)[key]}
                      onChange={e => setForm(f => ({ ...f, permissions: { ...f.permissions, [key]: e.target.checked } }))}
                      className="rounded"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleAdd} disabled={saving || !form.name.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'A guardar...' : 'Guardar'}
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Workers list */}
      {workers.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Users size={48} className="mx-auto mb-3 opacity-40" />
          <p>Nenhum colaborador registado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workers.map(worker => (
            <div key={worker.id} className="bg-white border border-gray-200 rounded-lg p-4">
              {editingId === worker.id && editForm ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm((f: any) => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    value={editForm.telegram_id}
                    onChange={e => setEditForm((f: any) => ({ ...f, telegram_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="ID Telegram"
                  />
                  <div className="space-y-1.5">
                    {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(editForm.permissions as any)[key]}
                          onChange={e => setEditForm((f: any) => ({ ...f, permissions: { ...f.permissions, [key]: e.target.checked } }))}
                          className="rounded"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveEdit(worker.id)} disabled={saving} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                      <Check size={14} /> Guardar
                    </button>
                    <button onClick={() => setEditingId(null)} className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                      <X size={14} /> Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 text-sm">{worker.name}</p>
                      {!worker.telegram_id && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">Sem Telegram</span>
                      )}
                    </div>
                    {worker.telegram_id && (
                      <p className="text-xs text-gray-400 mt-0.5">ID: {worker.telegram_id}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {Object.entries(PERMISSION_LABELS).map(([key, label]) => {
                        const has = worker.permissions?.[key];
                        if (!has) return null;
                        return (
                          <span key={key} className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full">
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(worker)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(worker.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

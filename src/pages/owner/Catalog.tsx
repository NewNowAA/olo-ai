import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import * as api from '../../services/api';
import type { CatalogItem } from '../../types';

export default function Catalog() {
  const { orgId } = useAuth();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [filter, setFilter] = useState('');
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', description: '', price: 0, category_id: '', stock_quantity: 0, is_available: true });
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    if (!orgId) return;
    api.getCatalog(orgId).then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false));
    api.getCategories(orgId).then(setDbCategories).catch(console.error);
  }, [orgId]);

  const categories = Array.from(new Set(items.map(i => i.catalog_categories?.name).filter(Boolean)));
  const filtered = filter ? items.filter(i => i.catalog_categories?.name === filter) : items;

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '', price: 0, category_id: '', stock_quantity: 0, is_available: true });
    setShowModal(true);
  };

  const openEdit = (item: CatalogItem) => {
    setEditing(item);
    setForm({
      name: item.name, description: item.description || '', price: item.price,
      category_id: item.category_id || '', stock_quantity: item.stock_quantity || 0, is_available: item.is_available,
    });
    setShowModal(true);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !orgId) return;
    try {
      const newCat = await api.createCategory(orgId, newCategoryName.trim());
      setDbCategories(prev => [...prev, newCat]);
      setForm(f => ({ ...f, category_id: newCat.id }));
      setShowNewCategory(false);
      setNewCategoryName('');
    } catch (err) {
      alert('Erro ao criar categoria.');
    }
  };

  const handleSave = async () => {
    if (!orgId) return;
    try {
      if (editing) {
        await api.updateCatalogItem(orgId, editing.id, form);
      } else {
        await api.createCatalogItem(orgId, form);
      }
      const data = await api.getCatalog(orgId);
      setItems(data);
      setShowModal(false);
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!orgId || !confirm('Eliminar este produto?')) return;
    try {
      await api.deleteCatalogItem(orgId, id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Catálogo</h1>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={16} /> Adicionar Produto
        </button>
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <button onClick={() => setFilter('')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${!filter ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 border border-gray-200'}`}>Todos</button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat!)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === cat ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 border border-gray-200'}`}>{cat}</button>
          ))}
        </div>
      )}

      {loading ? <p className="text-gray-500 text-sm">A carregar...</p> : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Package size={48} className="mx-auto mb-3 opacity-40" />
          <p>Nenhum produto no catálogo</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700 hidden md:table-cell">Categoria</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Preço</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700 hidden sm:table-cell">Stock</th>
                <th className="text-center px-4 py-3 font-medium text-gray-700">Ativo</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{item.catalog_categories?.name || '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-900">{item.price.toLocaleString()} {item.currency}</td>
                  <td className="px-4 py-3 text-right text-gray-500 hidden sm:table-cell">{item.stock_quantity ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`w-2 h-2 inline-block rounded-full ${item.is_available ? 'bg-green-500' : 'bg-gray-300'}`} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-blue-600"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg border border-gray-200 p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900">{editing ? 'Editar Produto' : 'Novo Produto'}</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              {!showNewCategory ? (
                <div className="flex gap-2">
                  <select 
                    value={form.category_id || ''} 
                    onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value="">Sem categoria...</option>
                    {dbCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <button 
                    type="button" 
                    onClick={() => setShowNewCategory(true)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors border border-gray-200 whitespace-nowrap"
                  >
                    Nova
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    placeholder="Nome da categoria..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    autoFocus
                  />
                  <button 
                    type="button" 
                    onClick={handleAddCategory}
                    disabled={!newCategoryName.trim()}
                    className="px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Criar
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setShowNewCategory(false); setNewCategoryName(''); }}
                    className="px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors border border-gray-200"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço (AOA)</label>
                <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: +e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                <input type="number" value={form.stock_quantity} onChange={e => setForm(f => ({ ...f, stock_quantity: +e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="available" checked={form.is_available} onChange={e => setForm(f => ({ ...f, is_available: e.target.checked }))} />
              <label htmlFor="available" className="text-sm text-gray-700">Disponível</label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

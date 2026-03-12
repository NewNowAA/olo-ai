import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, ArrowUpDown } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import * as api from '../../services/api';

interface StockItem {
  id: string; name: string; stock_quantity: number; stock_min_alert: number; is_available: boolean;
}

export default function Stock() {
  const { orgId } = useAuth();
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [movement, setMovement] = useState({ item_id: '', type: 'in' as 'in' | 'out', quantity: 1, reason: '' });

  useEffect(() => {
    if (!orgId) return;
    api.getCatalog(orgId).then(data => {
      setItems(data.filter((i: any) => i.stock_quantity !== null));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [orgId]);

  const getStatus = (qty: number, min: number) => {
    if (qty <= 0) return { label: 'Esgotado', color: 'bg-red-100 text-red-700', emoji: '🔴' };
    if (qty <= min) return { label: 'Baixo', color: 'bg-yellow-100 text-yellow-700', emoji: '🟡' };
    return { label: 'OK', color: 'bg-green-100 text-green-700', emoji: '🟢' };
  };

  const alertCount = items.filter(i => i.stock_quantity <= i.stock_min_alert).length;

  const handleMovement = async () => {
    if (!orgId) return;
    try {
      await api.registerStockMovement(orgId, movement);
      const data = await api.getCatalog(orgId);
      setItems(data.filter((i: any) => i.stock_quantity !== null));
      setShowModal(false);
    } catch (err) {
      console.error('Movement error:', err);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Stock</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <ArrowUpDown size={16} /> Registar Movimento
        </button>
      </div>

      {alertCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center gap-2 text-red-700 text-sm">
          <AlertTriangle size={16} /> {alertCount} produto(s) com stock baixo ou esgotado
        </div>
      )}

      {loading ? <p className="text-gray-500 text-sm">A carregar...</p> : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400"><Package size={48} className="mx-auto mb-3 opacity-40" /><p>Sem produtos com stock</p></div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Produto</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Quantidade</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Mínimo</th>
                <th className="text-center px-4 py-3 font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(item => {
                const status = getStatus(item.stock_quantity, item.stock_min_alert);
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                    <td className="px-4 py-3 text-right text-gray-900">{item.stock_quantity}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{item.stock_min_alert}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>{status.emoji} {status.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg border border-gray-200 p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900">Registar Movimento</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Produto</label>
              <select value={movement.item_id} onChange={e => setMovement(m => ({ ...m, item_id: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                <option value="">Selecionar...</option>
                {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select value={movement.type} onChange={e => setMovement(m => ({ ...m, type: e.target.value as any }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                  <option value="in">Entrada</option>
                  <option value="out">Saída</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                <input type="number" min={1} value={movement.quantity} onChange={e => setMovement(m => ({ ...m, quantity: +e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (opcional)</label>
              <input type="text" value={movement.reason} onChange={e => setMovement(m => ({ ...m, reason: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Ex: Reposição semanal" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button onClick={handleMovement} disabled={!movement.item_id} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">Registar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

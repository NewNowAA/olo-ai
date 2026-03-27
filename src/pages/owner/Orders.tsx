import React, { useState, useEffect } from 'react';
import { ShoppingBag, Check, X, Truck, Trash2, Pencil } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import * as api from '../../services/api';
import type { Order, OrderStatus } from '../../types';
import { SkeletonTable } from '../../components/ui/Skeleton';

const STATUS_MAP: Record<OrderStatus, { label: string; color: string }> = {
  pending:   { label: 'Pendente',   color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-700' },
  preparing: { label: 'Em preparo', color: 'bg-orange-100 text-orange-700' },
  ready:     { label: 'Pronto',     color: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Entregue',   color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelado',  color: 'bg-red-100 text-red-700' },
};

const DELIVERY_MAP: Record<string, string> = {
  takeaway: 'Levantar',
  delivery: 'Entrega',
  dine_in:  'Mesa',
};

type FilterKey = 'all' | OrderStatus;

export default function Orders() {
  const { orgId } = useAuth();
  const [items, setItems] = useState<Order[]>([]);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState({ status: '' as OrderStatus, notes: '', delivery_type: '' });

  useEffect(() => {
    if (!orgId) return;
    api.getOrders(orgId)
      .then(data => { setItems(data as Order[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [orgId]);

  const handleStatus = async (id: string, status: OrderStatus) => {
    if (!orgId) return;
    try {
      await api.updateOrder(orgId, id, { status });
      setItems(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!orgId) return;
    try {
      await api.deleteOrder(orgId, id);
      setItems(prev => prev.filter(o => o.id !== id));
    } catch (err) { console.error(err); }
    setDeletingId(null);
  };

  const openEdit = (order: Order) => {
    setEditForm({ status: order.status, notes: order.notes || '', delivery_type: order.delivery_type });
    setEditOrder(order);
  };

  const handleSaveEdit = async () => {
    if (!orgId || !editOrder) return;
    try {
      await api.updateOrder(orgId, editOrder.id, {
        status: editForm.status,
        notes: editForm.notes,
        delivery_type: editForm.delivery_type,
      });
      setItems(prev => prev.map(o => o.id === editOrder.id
        ? { ...o, status: editForm.status, notes: editForm.notes, delivery_type: editForm.delivery_type as any }
        : o
      ));
      setEditOrder(null);
    } catch (err) { console.error(err); }
  };

  const filtered = items.filter(o => filter === 'all' || o.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pedidos & Reservas</h1>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {([
          { key: 'all',       label: 'Todos' },
          { key: 'pending',   label: 'Pendentes' },
          { key: 'confirmed', label: 'Confirmados' },
          { key: 'preparing', label: 'Em preparo' },
          { key: 'ready',     label: 'Prontos' },
          { key: 'delivered', label: 'Entregues' },
          { key: 'cancelled', label: 'Cancelados' },
        ] as { key: FilterKey; label: string }[]).map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === f.key ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 border border-gray-200'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? <SkeletonTable rows={6} cols={6} /> : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <ShoppingBag size={48} className="mx-auto mb-3 opacity-40" />
          <p>Sem pedidos</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Cliente</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700 hidden md:table-cell">Itens</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Total</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700 hidden sm:table-cell">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700 hidden lg:table-cell">Data</th>
                <th className="text-center px-4 py-3 font-medium text-gray-700">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(o => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {o.customers?.name || 'Anónimo'}
                    {o.customers?.phone && <div className="text-xs text-gray-400">{o.customers.phone}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    {o.olo_order_items?.length
                      ? o.olo_order_items.map(i => `${i.quantity}× ${i.name}`).join(', ')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {o.total?.toLocaleString()} {o.currency || 'AOA'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    {DELIVERY_MAP[o.delivery_type] || o.delivery_type || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                    {new Date(o.created_at).toLocaleDateString('pt-PT')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_MAP[o.status]?.color}`}>
                      {STATUS_MAP[o.status]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {deletingId === o.id ? (
                      <div className="flex gap-1 items-center justify-end text-xs">
                        <span className="text-gray-500">Eliminar?</span>
                        <button onClick={() => handleDelete(o.id)} className="px-2 py-0.5 bg-red-600 text-white rounded text-xs">Sim</button>
                        <button onClick={() => setDeletingId(null)} className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs">Não</button>
                      </div>
                    ) : (
                      <div className="flex gap-1 justify-end">
                        {o.status === 'pending' && (
                          <>
                            <button onClick={() => handleStatus(o.id, 'confirmed')} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Confirmar"><Check size={15} /></button>
                            <button onClick={() => handleStatus(o.id, 'cancelled')} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Cancelar"><X size={15} /></button>
                          </>
                        )}
                        {o.status === 'confirmed' && (
                          <button onClick={() => handleStatus(o.id, 'delivered')} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Marcar como entregue"><Truck size={15} /></button>
                        )}
                        <button onClick={() => openEdit(o)} className="p-1 text-gray-500 hover:bg-gray-100 rounded" title="Editar"><Pencil size={15} /></button>
                        <button onClick={() => setDeletingId(o.id)} className="p-1 text-red-400 hover:bg-red-50 rounded" title="Eliminar"><Trash2 size={15} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editOrder && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setEditOrder(null)}>
          <div className="bg-white rounded-lg border border-gray-200 p-6 w-full max-w-sm space-y-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900">Editar Pedido</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={editForm.status}
                onChange={e => setEditForm(f => ({ ...f, status: e.target.value as OrderStatus }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de entrega</label>
              <select
                value={editForm.delivery_type}
                onChange={e => setEditForm(f => ({ ...f, delivery_type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="takeaway">Levantar (takeaway)</option>
                <option value="delivery">Entrega ao domicílio</option>
                <option value="dine_in">Mesa (dine in)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea
                value={editForm.notes}
                onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                placeholder="Notas adicionais..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button onClick={() => setEditOrder(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button onClick={handleSaveEdit} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

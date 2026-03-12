import React, { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { supabase } from '../../services/supabase/client';
import useAuth from '../../hooks/useAuth';

export default function ClientOrders() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const load = async () => {
      try {
        const { data } = await supabase.from('olo_orders')
          .select('*').eq('customer_id', user.id)
          .order('created_at', { ascending: false }).limit(50);
        setItems(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    load();
  }, [user]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Os Meus Pedidos</h1>
      {loading ? <p className="text-gray-500 text-sm">A carregar...</p> : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400"><ShoppingBag size={48} className="mx-auto mb-3 opacity-40" /><p>Sem pedidos</p></div>
      ) : (
        <div className="space-y-3">
          {items.map(o => (
            <div key={o.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900 text-sm">Pedido #{o.id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-500">{new Date(o.created_at).toLocaleDateString('pt-PT')} — {o.total_amount?.toLocaleString()} {o.currency || 'AOA'}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  o.status === 'delivered' ? 'bg-green-100 text-green-700' :
                  o.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-500'
                }`}>{o.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

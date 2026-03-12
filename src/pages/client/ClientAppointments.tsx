import React, { useState, useEffect } from 'react';
import { CalendarDays } from 'lucide-react';
import { supabase } from '../../services/supabase/client';
import useAuth from '../../hooks/useAuth';

export default function ClientAppointments() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const load = async () => {
      try {
        const { data } = await supabase.from('appointments')
          .select('*').eq('customer_id', user.id)
          .order('date', { ascending: false }).limit(50);
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">As Minhas Marcações</h1>
      {loading ? <p className="text-gray-500 text-sm">A carregar...</p> : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400"><CalendarDays size={48} className="mx-auto mb-3 opacity-40" /><p>Sem marcações</p></div>
      ) : (
        <div className="space-y-3">
          {items.map(a => (
            <div key={a.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{a.date} às {a.time_start}</p>
                  <p className="text-xs text-gray-500">{a.notes || 'Marcação'}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  a.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                  a.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  a.status === 'completed' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-500'
                }`}>{a.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

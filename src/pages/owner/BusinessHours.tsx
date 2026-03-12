import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import * as api from '../../services/api';
import type { BusinessHour } from '../../types';

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function BusinessHours() {
  const { orgId } = useAuth();
  const [hours, setHours] = useState<BusinessHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    api.getBusinessHours(orgId).then(data => {
      if (data.length > 0) {
        setHours(data.sort((a: BusinessHour, b: BusinessHour) => a.day_of_week - b.day_of_week));
      } else {
        // Create defaults
        setHours(Array.from({ length: 7 }, (_, i) => ({
          id: '', org_id: orgId!, day_of_week: i,
          open_time: '09:00', close_time: '18:00', is_closed: i === 0,
        })));
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [orgId]);

  const update = (idx: number, field: string, value: any) => {
    setHours(prev => prev.map((h, i) => i === idx ? { ...h, [field]: value } : h));
  };

  const handleSave = async () => {
    if (!orgId) return;
    setSaving(true);
    setSaved(false);
    try {
      await api.updateBusinessHours(orgId, hours);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="text-gray-500">A carregar...</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Horário de Funcionamento</h1>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Dia</th>
              <th className="text-center px-4 py-3 font-medium text-gray-700">Aberto</th>
              <th className="text-center px-4 py-3 font-medium text-gray-700">Abre</th>
              <th className="text-center px-4 py-3 font-medium text-gray-700">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {hours.map((h, i) => (
              <tr key={i} className={h.is_closed ? 'bg-gray-50' : ''}>
                <td className="px-4 py-3 font-medium text-gray-900">{DAYS[h.day_of_week]}</td>
                <td className="px-4 py-3 text-center">
                  <input type="checkbox" checked={!h.is_closed} onChange={e => update(i, 'is_closed', !e.target.checked)} />
                </td>
                <td className="px-4 py-3 text-center">
                  <input type="time" value={h.open_time} onChange={e => update(i, 'open_time', e.target.value)} disabled={h.is_closed} className="px-2 py-1 border border-gray-300 rounded text-sm disabled:opacity-40" />
                </td>
                <td className="px-4 py-3 text-center">
                  <input type="time" value={h.close_time} onChange={e => update(i, 'close_time', e.target.value)} disabled={h.is_closed} className="px-2 py-1 border border-gray-300 rounded text-sm disabled:opacity-40" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3 mt-4">
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          <Save size={16} /> {saving ? 'A guardar...' : 'Guardar'}
        </button>
        {saved && <span className="text-green-600 text-sm font-medium">✓ Guardado</span>}
      </div>
    </div>
  );
}

// OwnerDashboard.tsx — placeholder for Batch B implementation
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MessageSquare, Radio, CalendarDays, AlertTriangle } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import * as api from '../../services/api';

export default function OwnerDashboard() {
  const { orgId } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    const load = async () => {
      try {
        const data = await api.getStats(orgId);
        setStats(data);
      } catch (err) {
        console.error('Error loading stats:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orgId]);

  if (loading) {
    return <div className="text-gray-500">A carregar dashboard...</div>;
  }

  const kpis = [
    { label: 'Conversas hoje', value: stats?.conversations_today ?? 0, icon: MessageSquare, color: 'text-blue-600 bg-blue-50' },
    { label: 'Ativas agora', value: stats?.active_conversations ?? 0, icon: Radio, color: 'text-green-600 bg-green-50' },
    { label: 'Marcações pendentes', value: stats?.pending_appointments ?? 0, icon: CalendarDays, color: 'text-purple-600 bg-purple-50' },
    { label: 'Alertas de stock', value: stats?.stock_alerts ?? 0, icon: AlertTriangle, color: stats?.stock_alerts > 0 ? 'text-red-600 bg-red-50' : 'text-gray-600 bg-gray-50' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map(kpi => (
          <div key={kpi.label} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${kpi.color}`}>
                <kpi.icon size={20} />
              </div>
              <span className="text-sm text-gray-500">{kpi.label}</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {stats?.messages_by_day && stats.messages_by_day.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Mensagens (últimos 7 dias)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={stats.messages_by_day}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#2563eb" fill="#dbeafe" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Building2, MessageSquare, Mail, AlertTriangle } from 'lucide-react';
import * as api from '../../services/api';

export default function DevDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminStats().then(data => { setStats(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">A carregar...</div>;

  const kpis = [
    { label: 'Organizações', value: stats?.total_orgs ?? 0, icon: Building2, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total de conversas', value: stats?.total_conversations ?? 0, icon: MessageSquare, color: 'text-green-600 bg-green-50' },
    { label: 'Mensagens processadas', value: stats?.total_messages ?? 0, icon: Mail, color: 'text-purple-600 bg-purple-50' },
    { label: 'Handoffs ativos', value: stats?.active_handoffs ?? 0, icon: AlertTriangle, color: 'text-yellow-600 bg-yellow-50' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dev Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${kpi.color}`}><kpi.icon size={20} /></div>
              <span className="text-sm text-gray-500">{kpi.label}</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

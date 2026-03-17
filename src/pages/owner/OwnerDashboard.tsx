import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MessageSquare, Radio, CalendarDays, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import * as api from '../../services/api';

const SETUP_STEPS = [
  { key: 'business_name', label: 'Nome do negócio' },
  { key: 'sector', label: 'Setor configurado' },
  { key: 'telegram_bot_token', label: 'Bot do Telegram ligado' },
  { key: 'telegram_chat_id', label: 'ID Telegram pessoal' },
  { key: 'agent_name', label: 'Nome do agente' },
  { key: 'first_contact_message', label: 'Mensagem de boas-vindas' },
];

export default function OwnerDashboard() {
  const { orgId } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [stockAlerts, setStockAlerts] = useState<any[]>([]);
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    Promise.all([
      api.getStats(orgId),
      api.getConversations(orgId),
      api.getStockAlerts(orgId),
      api.getOrg(orgId),
    ]).then(([statsData, convsData, alertsData, orgData]) => {
      setStats(statsData);
      setConversations((convsData || []).slice(0, 5));
      setStockAlerts(alertsData?.items || []);
      setOrg(orgData);
    }).catch(err => {
      console.error('Dashboard load error:', err);
    }).finally(() => setLoading(false));
  }, [orgId]);

  if (loading) return <div className="text-gray-500">A carregar dashboard...</div>;

  const kpis = [
    { label: 'Conversas hoje', value: stats?.conversations_today ?? 0, icon: MessageSquare, color: 'text-blue-600 bg-blue-50' },
    { label: 'Ativas agora', value: stats?.active_conversations ?? 0, icon: Radio, color: 'text-green-600 bg-green-50' },
    { label: 'Marcações pendentes', value: stats?.pending_appointments ?? 0, icon: CalendarDays, color: 'text-purple-600 bg-purple-50' },
    { label: 'Alertas de stock', value: stats?.stock_alerts ?? 0, icon: AlertTriangle, color: stats?.stock_alerts > 0 ? 'text-red-600 bg-red-50' : 'text-gray-600 bg-gray-50' },
  ];

  const setupDone = org ? SETUP_STEPS.filter(s => !!org[s.key]).length : 0;
  const setupPct = Math.round((setupDone / SETUP_STEPS.length) * 100);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Setup Progress */}
      {org && setupPct < 100 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-blue-800">Configuração do negócio</p>
            <span className="text-xs font-medium text-blue-700">{setupDone}/{SETUP_STEPS.length} passos</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2 mb-3">
            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${setupPct}%` }} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {SETUP_STEPS.map(step => {
              const done = !!org[step.key];
              return (
                <div key={step.key} className="flex items-center gap-1.5 text-xs">
                  <CheckCircle2 size={12} className={done ? 'text-blue-600' : 'text-blue-300'} />
                  <span className={done ? 'text-blue-800 font-medium' : 'text-blue-400'}>{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stock Alerts Banner */}
      {stockAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-600" />
              <p className="text-sm font-semibold text-red-800">{stockAlerts.length} produto(s) com stock baixo</p>
            </div>
            <Link to="/app/stock" className="text-xs text-red-700 hover:underline font-medium flex items-center gap-1">
              Ver stock <ArrowRight size={12} />
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {stockAlerts.map((item: any) => (
              <span key={item.name} className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                {item.name}: {item.stock_quantity} un.
              </span>
            ))}
          </div>
        </div>
      )}

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        {stats?.messages_by_day && stats.messages_by_day.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Mensagens (últimos 7 dias)</h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={stats.messages_by_day}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d: string) => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#2563eb" fill="#dbeafe" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent Conversations */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Conversas recentes</h2>
            <Link to="/app/conversations" className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1">
              Ver todas <ArrowRight size={12} />
            </Link>
          </div>
          {conversations.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Sem conversas ainda</p>
          ) : (
            <div className="space-y-1">
              {conversations.map(conv => {
                const statusColor = conv.status === 'handoff'
                  ? 'bg-yellow-100 text-yellow-700'
                  : conv.status === 'open' || conv.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500';
                const customerName = conv.customers?.name || 'Cliente';
                return (
                  <Link
                    key={conv.id}
                    to={`/app/conversations/${conv.id}`}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <MessageSquare size={12} className="text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{customerName}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(conv.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColor} flex-shrink-0 ml-2`}>
                      {conv.status === 'handoff' ? 'Handoff' : conv.status === 'open' ? 'Ativa' : conv.status}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

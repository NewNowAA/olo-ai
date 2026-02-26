import React, { useState, useEffect } from 'react';
import {
  Users,
  TicketCheck,
  MessageSquare,
  Zap,
  ShieldBan,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Eye,
  Lock,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '../services';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// ---- Types ----
interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status?: string | null;
  created_at?: string;
}

interface SupportTicket {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  status?: string;
}

interface FeedbackEntry {
  id: string;
  user_id: string | null;
  content: string;
  rating?: number | null;
  created_at: string;
}

interface ApiUsageRow {
  action: string;
  tokens_used: number;
  created_at: string;
  user_id: string | null;
}

// ---- Reusable Stat Card ----
const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color: string }> = ({ icon, label, value, color }) => (
  <div className="p-6 rounded-2xl border flex items-center gap-4" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
    <div className={`p-3 rounded-xl flex-shrink-0 ${color}`}>{icon}</div>
    <div>
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--t3)' }}>{label}</p>
      <p className="text-2xl font-black" style={{ color: 'var(--t1)' }}>{value}</p>
    </div>
  </div>
);

// ---- Main Component ----
const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'tickets' | 'feedbacks' | 'usage'>('overview');

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>([]);
  const [apiUsage, setApiUsage] = useState<ApiUsageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [blockingUser, setBlockingUser] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [usersRes, ticketsRes, feedbacksRes, usageRes] = await Promise.all([
        supabase.from('users').select('id, email, full_name, role, status, created_at').order('created_at', { ascending: false }),
        supabase.from('support_tickets').select('*').order('created_at', { ascending: false }),
        supabase.from('feedbacks').select('*').order('created_at', { ascending: false }),
        supabase.from('api_usage').select('*').order('created_at', { ascending: false }).limit(200),
      ]);

      setUsers(usersRes.data || []);
      setTickets(ticketsRes.data || []);
      setFeedbacks(feedbacksRes.data || []);
      setApiUsage(usageRes.data || []);
    } catch (err) {
      console.error('AdminDashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleBlockUser = async (userId: string, currentStatus: string | null | undefined) => {
    setBlockingUser(userId);
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    await supabase.from('users').update({ status: newStatus }).eq('id', userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    setBlockingUser(null);
  };

  // --- Derived stats ---
  const totalUsers = users.length;
  const blockedUsers = users.filter(u => u.status === 'blocked').length;
  const openTickets = tickets.filter(t => !t.status || t.status === 'open').length;
  const totalFeedbacks = feedbacks.length;
  const totalTokens = apiUsage.reduce((acc, a) => acc + (a.tokens_used || 0), 0);

  // Usage chart: group by action
  const usageByAction: Record<string, number> = {};
  apiUsage.forEach(row => {
    usageByAction[row.action] = (usageByAction[row.action] || 0) + (row.tokens_used || 0);
  });
  const usageChartData = Object.entries(usageByAction).map(([action, tokens]) => ({ action, tokens })).sort((a, b) => b.tokens - a.tokens);
  const COLORS = ['#73c6df', '#2e8ba6', '#8bd7bf', '#a78bfa', '#f59e0b'];

  const filteredUsers = users.filter(u =>
    (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const TABS = [
    { id: 'overview', label: 'Visão Geral', icon: <BarChart2 size={15} /> },
    { id: 'users', label: 'Utilizadores', icon: <Users size={15} /> },
    { id: 'tickets', label: 'Suporte', icon: <TicketCheck size={15} /> },
    { id: 'feedbacks', label: 'Feedbacks', icon: <MessageSquare size={15} /> },
    { id: 'usage', label: 'IA Usage', icon: <Zap size={15} /> },
  ] as const;

  return (
    <div className="p-6 md:p-10 max-w-[1400px] mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
              <Lock size={18} className="text-rose-500" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-rose-500">Acesso Restrito — Admin</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--t1)' }}>Painel de Controlo</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>Gestão interna do sistema Lumea AI</p>
        </div>
        <button onClick={fetchAll} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-80 disabled:opacity-50" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', color: 'var(--t2)' }}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Atualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : ''}`}
            style={activeTab !== tab.id ? { backgroundColor: 'var(--card)', border: '1px solid var(--border)', color: 'var(--t2)' } : {}}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* ---- OVERVIEW ---- */}
      {!loading && activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<Users size={20} className="text-blue-500" />} label="Utilizadores" value={totalUsers} color="bg-blue-500/10" />
            <StatCard icon={<TicketCheck size={20} className="text-amber-500" />} label="Tickets Abertos" value={openTickets} color="bg-amber-500/10" />
            <StatCard icon={<MessageSquare size={20} className="text-[#73c6df]" />} label="Feedbacks" value={totalFeedbacks} color="bg-[#73c6df]/10" />
            <StatCard icon={<Zap size={20} className="text-purple-500" />} label="Tokens IA (Total)" value={totalTokens.toLocaleString()} color="bg-purple-500/10" />
          </div>

          {blockedUsers > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10">
              <AlertTriangle size={18} className="text-rose-500 flex-shrink-0" />
              <p className="text-sm font-medium text-rose-500">{blockedUsers} utilizador(es) bloqueado(s) no sistema.</p>
            </div>
          )}

          {/* Last 5 tickets */}
          <div>
            <h3 className="font-bold mb-4" style={{ color: 'var(--t1)' }}>Tickets Recentes</h3>
            <div className="space-y-3">
              {tickets.slice(0, 5).map(t => (
                <div key={t.id} className="p-4 rounded-2xl border flex justify-between items-center gap-4" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate" style={{ color: 'var(--t1)' }}>{t.subject}</p>
                    <p className="text-xs" style={{ color: 'var(--t3)' }}>{t.name} — {t.email}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-500/10 text-amber-500 flex-shrink-0">Aberto</span>
                </div>
              ))}
              {tickets.length === 0 && <p className="text-sm" style={{ color: 'var(--t3)' }}>Nenhum ticket ainda.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ---- USERS ---- */}
      {!loading && activeTab === 'users' && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--t3)' }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm"
              style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--t1)' }}
              placeholder="Pesquisar por nome ou email..."
            />
          </div>

          <div className="space-y-3">
            {filteredUsers.map(user => (
              <div key={user.id} className="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #2e8ba6, #73c6df)' }}>
                    {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--t1)' }}>{user.full_name || '—'}</p>
                    <p className="text-xs" style={{ color: 'var(--t3)' }}>{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${user.role === 'system_admin' ? 'bg-rose-500/10 text-rose-500' : user.role === 'org_admin' ? 'bg-amber-500/10 text-amber-600' : 'bg-[#73c6df]/10 text-[#2e8ba6]'}`}>
                    {user.role || 'user'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${user.status === 'blocked' ? 'bg-rose-500/20 text-rose-600' : 'bg-green-500/10 text-green-600'}`}>
                    {user.status === 'blocked' ? 'Bloqueado' : 'Ativo'}
                  </span>
                  {user.role !== 'system_admin' && (
                    <button
                      onClick={() => handleBlockUser(user.id, user.status)}
                      disabled={blockingUser === user.id}
                      className={`flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${user.status === 'blocked' ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' : 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'}`}
                    >
                      <ShieldBan size={12} />
                      {blockingUser === user.id ? '...' : user.status === 'blocked' ? 'Desbloquear' : 'Bloquear'}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && <p className="text-sm text-center py-8" style={{ color: 'var(--t3)' }}>Nenhum utilizador encontrado.</p>}
          </div>
        </div>
      )}

      {/* ---- TICKETS ---- */}
      {!loading && activeTab === 'tickets' && (
        <div className="space-y-3">
          {tickets.length === 0 && <p className="text-sm text-center py-8" style={{ color: 'var(--t3)' }}>Nenhum ticket de suporte ainda.</p>}
          {tickets.map(ticket => (
            <div key={ticket.id} className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
              <button onClick={() => setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)} className="w-full p-5 flex justify-between items-center text-left hover:opacity-90 transition-opacity">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm" style={{ color: 'var(--t1)' }}>{ticket.subject}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">Aberto</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--t3)' }}>De: {ticket.name} ({ticket.email}) — {new Date(ticket.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                {expandedTicket === ticket.id ? <ChevronUp size={16} style={{ color: 'var(--t3)' }} /> : <ChevronDown size={16} style={{ color: 'var(--t3)' }} />}
              </button>
              {expandedTicket === ticket.id && (
                <div className="px-5 pb-5 border-t" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-sm mt-4 leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--t2)' }}>{ticket.message}</p>
                  <a href={`mailto:${ticket.email}?subject=Re: ${encodeURIComponent(ticket.subject)}`} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#2e8ba6] hover:underline">
                    <Eye size={14} /> Responder por Email
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ---- FEEDBACKS ---- */}
      {!loading && activeTab === 'feedbacks' && (
        <div className="space-y-3">
          {feedbacks.length === 0 && <p className="text-sm text-center py-8" style={{ color: 'var(--t3)' }}>Nenhum feedback recebido ainda.</p>}
          {feedbacks.map(fb => (
            <div key={fb.id} className="p-5 rounded-2xl border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="flex justify-between items-start gap-3">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--t1)' }}>{fb.content}</p>
                {fb.rating && (
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-[#73c6df]/10 text-[#2e8ba6] flex-shrink-0">{fb.rating}★</span>
                )}
              </div>
              <p className="text-[10px] mt-3 font-medium" style={{ color: 'var(--t3)' }}>
                <Clock size={10} className="inline mr-1" />
                {new Date(fb.created_at).toLocaleString('pt-BR')}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ---- API USAGE ---- */}
      {!loading && activeTab === 'usage' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard icon={<Zap size={20} className="text-purple-500" />} label="Tokens Totais" value={totalTokens.toLocaleString()} color="bg-purple-500/10" />
            <StatCard icon={<TrendingUp size={20} className="text-[#73c6df]" />} label="Total de Pedidos" value={apiUsage.length} color="bg-[#73c6df]/10" />
            <StatCard icon={<CheckCircle size={20} className="text-green-500" />} label="Ações Distintas" value={Object.keys(usageByAction).length} color="bg-green-500/10" />
          </div>

          {usageChartData.length > 0 && (
            <div className="p-6 rounded-2xl border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
              <h3 className="font-bold mb-4 text-sm uppercase tracking-widest" style={{ color: 'var(--t3)' }}>Tokens por Tipo de Ação</h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usageChartData}>
                    <XAxis dataKey="action" tick={{ fontSize: 11, fill: 'var(--t3)' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--t3)' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--card)', fontSize: '12px' }} />
                    <Bar dataKey="tokens" radius={[8, 8, 0, 0]} barSize={32}>
                      {usageChartData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-bold text-sm uppercase tracking-widest" style={{ color: 'var(--t3)' }}>Histórico Recente</h3>
            {apiUsage.slice(0, 20).map((row, idx) => (
              <div key={idx} className="p-3 rounded-xl border flex justify-between items-center text-sm" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border)' }}>
                <span className="font-medium" style={{ color: 'var(--t1)' }}>{row.action}</span>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-purple-500">{row.tokens_used?.toLocaleString() || 0} tokens</span>
                  <span className="text-xs" style={{ color: 'var(--t3)' }}>{new Date(row.created_at).toLocaleString('pt-BR')}</span>
                </div>
              </div>
            ))}
            {apiUsage.length === 0 && (
              <p className="text-sm text-center py-8" style={{ color: 'var(--t3)' }}>
                Nenhum consumo de IA registado ainda. O `ai-consultant` registará aqui quando for chamado.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

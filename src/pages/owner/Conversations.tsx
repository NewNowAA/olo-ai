import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Clock } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import * as api from '../../services/api';
import type { Conversation, ConversationStatus } from '../../types';

const STATUS_BADGES: Record<ConversationStatus, string> = {
  active: 'bg-green-100 text-green-700',
  handoff: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-gray-100 text-gray-500',
};

export default function Conversations() {
  const { orgId } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filter, setFilter] = useState<'all' | ConversationStatus>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    api.getConversations(orgId).then(data => {
      setConversations(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [orgId]);

  const filtered = filter === 'all' ? conversations : conversations.filter(c => c.status === filter);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Conversas</h1>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(['all', 'active', 'handoff', 'closed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f === 'all' ? 'Todas' : f === 'active' ? 'Ativas' : f === 'handoff' ? 'Handoff' : 'Fechadas'}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">A carregar...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <MessageSquare size={48} className="mx-auto mb-3 opacity-40" />
          <p>Nenhuma conversa encontrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(conv => (
            <Link
              key={conv.id}
              to={`/app/conversations/${conv.id}`}
              className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-200 hover:bg-blue-50/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                    <MessageSquare size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {conv.olo_customers?.name || 'Cliente anónimo'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{conv.summary || 'Conversa'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[conv.status]}`}>
                    {conv.status}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(conv.updated_at).toLocaleDateString('pt-PT')}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Bot, User, Wrench, X } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import * as api from '../../services/api';
import type { Message } from '../../types';

export default function ConversationDetail() {
  const { id } = useParams<{ id: string }>();
  const { orgId } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || !orgId) return;
    Promise.all([
      api.getConversationMessages(id),
      api.getConversations(orgId).then((convs: any[]) => convs.find(c => c.id === id)),
    ]).then(([msgs, conv]) => {
      setMessages(msgs);
      setConversation(conv || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id, orgId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleClose = async () => {
    if (!orgId || !id) return;
    setClosing(true);
    try {
      await api.closeConversation(orgId, id);
      setConversation((prev: any) => prev ? { ...prev, status: 'closed' } : prev);
      navigate('/app/conversations');
    } catch (err) {
      console.error('Close error:', err);
    } finally {
      setClosing(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !orgId || !id) return;
    setSending(true);
    try {
      await api.sendOwnerMessage(orgId, id, newMsg);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        conversation_id: id,
        role: 'assistant',
        content: newMsg,
        created_at: new Date().toISOString(),
      }]);
      setNewMsg('');
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-900">Conversa</h1>
        {conversation?.status !== 'closed' && (
          <button
            onClick={handleClose}
            disabled={closing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <X size={14} /> Fechar Conversa
          </button>
        )}
      </div>

      {/* Handoff Banner */}
      {conversation?.status === 'handoff' && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-3 mb-4 flex items-center gap-2">
          <span className="text-yellow-600 text-lg">🙋</span>
          <div>
            <p className="text-sm font-semibold text-yellow-800">Pedido de atendimento humano</p>
            <p className="text-xs text-yellow-700">O cliente pediu para falar com um humano. Responde abaixo diretamente.</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {loading ? (
          <p className="text-gray-500 text-sm">A carregar mensagens...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Sem mensagens</p>
        ) : (
          messages.map(msg => {
            const isUser = msg.role === 'user';
            const isSystem = msg.role === 'system' || msg.role === 'tool';
            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[75%] rounded-xl px-4 py-2.5 ${
                  isSystem
                    ? 'bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs mx-auto'
                    : isUser
                      ? 'bg-white border border-gray-200 text-gray-900'
                      : 'bg-blue-600 text-white'
                }`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    {isUser ? <User size={12} /> : isSystem ? <Wrench size={12} /> : <Bot size={12} />}
                    <span className="text-[10px] opacity-70 font-medium uppercase">{msg.role}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {msg.tool_calls && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(Array.isArray(msg.tool_calls) ? msg.tool_calls : []).map((tc: any, i: number) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-medium">
                          <Wrench size={10} /> {tc.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className={`text-[10px] mt-1 ${isUser ? 'text-gray-400' : isSystem ? 'text-yellow-600' : 'text-blue-200'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Owner message input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-gray-200 pt-3">
        <input
          type="text"
          value={newMsg}
          onChange={e => setNewMsg(e.target.value)}
          placeholder="Enviar mensagem como owner..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !newMsg.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import * as api from '../../services/api';
import useAuth from '../../hooks/useAuth';

export function FeedbackButton() {
  const { orgId, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // If no user is logged in, perhaps we shouldn't show the button, or we can send feedback anonymously.
  // But since it's an internal platform tool for the dev, let's keep it mostly for logged-in users.
  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    
    try {
      await api.sendFeedback({
        message,
        url: window.location.href,
        org_id: orgId || null
      });
      setSent(true);
      setTimeout(() => {
        setIsOpen(false);
        setSent(false);
        setMessage('');
      }, 3000);
    } catch (err) {
      console.error('Feedback error:', err);
      alert('Erro ao enviar feedback. Tente mais tarde.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-800 transition-transform hover:scale-105"
      >
        <MessageCircle size={20} />
        <span className="text-sm font-medium">Feedback</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40" onClick={() => setIsOpen(false)}>
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <MessageCircle size={18} className="text-blue-600" />
                Enviar Feedback
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5">
              {sent ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageCircle size={24} />
                  </div>
                  <p className="text-green-700 font-medium">Obrigado pelo seu feedback!</p>
                  <p className="text-sm text-gray-500 mt-1">A nossa equipa vai analisar com atenção.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <p className="text-sm text-gray-600 mb-4">
                    Encontrou um erro ou tem uma sugestão de melhoria? Diga-nos tudo.
                  </p>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Descreva aqui o que encontrou ou a sua ideia..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    autoFocus
                    required
                  />
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={sending || !message.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {sending ? 'A enviar...' : 'Enviar Feedback'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

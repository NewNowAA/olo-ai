import React, { useState } from 'react';
import { MessageSquarePlus, X, Send, Smile, Frown, Meh, Loader2 } from 'lucide-react';
import { supabase } from '../services';

const StickyFeedback: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'bug' | 'suggestion' | 'other' | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackType || !message.trim()) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('user_feedback')
        .insert([{
          user_id: user?.id || null,
          feedback_type: feedbackType,
          message: message,
          page_url: window.location.pathname
        }]);

      if (error) throw error;

      setSubmitStatus('success');
      setMessage('');
      setFeedbackType(null);
      
      setTimeout(() => {
        setIsOpen(false);
        setSubmitStatus('idle');
      }, 3000);

    } catch (err) {
      console.error('Error submitting feedback:', err);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Sticky Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 p-3 md:p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center ${isOpen ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100 translate-y-0'}`}
        style={{ background: 'linear-gradient(135deg, var(--blue), var(--cyan))', color: 'white' }}
        title="Enviar Feedback"
      >
        <MessageSquarePlus size={24} />
      </button>

      {/* Feedback Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[60] w-[calc(100vw-3rem)] max-w-[360px] bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200">
          
          {/* Header */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <MessageSquarePlus size={18} className="text-[#2e8ba6]" />
              Enviar Feedback
            </h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-5">
            {submitStatus === 'success' ? (
              <div className="text-center py-6 animate-in zoom-in-95 fade-in">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Smile size={32} />
                </div>
                <h4 className="font-bold text-slate-800 dark:text-white mb-2">Muito Obrigado!</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">Seu feedback é essencial para melhorarmos a Lumea.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Type Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">O que você deseja relatar?</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFeedbackType('suggestion')}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all ${feedbackType === 'suggestion' ? 'bg-[#73c6df]/10 border-[#73c6df] text-[#2e8ba6]' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                    >
                      <Smile size={18} />
                      Sugestão
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedbackType('bug')}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all ${feedbackType === 'bug' ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800 text-red-600' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                    >
                      <Frown size={18} />
                      Erro/Bug
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedbackType('other')}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all ${feedbackType === 'other' ? 'bg-slate-100 dark:bg-slate-700 border-slate-400 dark:border-slate-500 text-slate-700 dark:text-white' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                    >
                      <Meh size={18} />
                      Outro
                    </button>
                  </div>
                </div>

                {/* Message Input */}
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Sua mensagem</label>
                   <textarea
                    rows={3}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Nos conte detalhadamente..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#73c6df]/30 text-sm resize-none dark:text-white"
                   ></textarea>
                </div>

                {submitStatus === 'error' && (
                  <p className="text-xs text-red-500 font-medium">Ocorreu um erro. Tente novamente.</p>
                )}

                <button
                  type="submit"
                  disabled={!feedbackType || !message.trim() || isSubmitting}
                  className="w-full py-2.5 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, var(--blue), var(--cyan))' }}
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
                </button>

              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default StickyFeedback;

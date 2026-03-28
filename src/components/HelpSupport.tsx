import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Mail, MessageCircle, Phone, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../services';
import useAuth from '../hooks/useAuth';

const HelpSupport: React.FC = () => {
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Dúvida sobre Faturamento',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert([{
           user_id: user?.id || null,
           name: formData.name,
           email: formData.email,
           subject: formData.subject,
           message: formData.message
        }]);

      if (error) throw error;

      // Invoca a função de email (Resend)
      const { error: fnError } = await supabase.functions.invoke('send-email', {
        body: {
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message
        }
      });

      if (fnError) {
        console.error('Falha ao enviar email pelo Resend:', fnError);
        // Mesmo falhando o email, o ticket foi guardado, então não falhamos o UI.
      }

      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: 'Dúvida sobre Faturamento', message: '' });
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } catch (error) {
      console.error('Error submitting support ticket:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqs = [
    {
      q: "Como a 'Inteligência IA' analisa meus dados?",
      a: "Nossa IA processa seus registros de faturas (entradas e saídas) para identificar padrões de gastos, sazonalidade de receita e anomalias. Os dados são processados de forma segura e não são usados para treinar modelos públicos."
    },
    {
      q: "Posso adicionar membros da minha equipe?",
      a: "Sim! No plano Pro, você pode adicionar membros ilimitados. Vá em Configurações > Time e Membros para convidar seus colegas."
    },
    {
      q: "Como funciona a previsão de receita?",
      a: "Utilizamos um algoritmo preditivo baseado no histórico dos últimos 12 meses, considerando contratos recorrentes e taxa de churn média do setor."
    },
    {
      q: "O 'Construtor de Faturas' terá custo adicional?",
      a: "O módulo básico será gratuito para todos os usuários. Modelos premium e automação de envio estarão disponíveis no plano Enterprise."
    }
  ];

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 pb-20">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Ajuda e Suporte</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Tire suas dúvidas ou fale com nosso time.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* FAQ Section */}
          <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  Perguntas Frequentes
              </h2>
              
              <div className="space-y-3">
                  {faqs.map((faq, idx) => (
                      <div key={idx} className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/50 dark:border-slate-700 rounded-2xl overflow-hidden">
                          <button 
                            onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                            className="w-full p-5 text-left flex justify-between items-center hover:bg-white/40 dark:hover:bg-slate-700/40 transition-colors"
                          >
                              <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{faq.q}</span>
                              {openFaq === idx ? <ChevronUp size={18} className="text-[#73c6df]" /> : <ChevronDown size={18} className="text-slate-400" />}
                          </button>
                          {openFaq === idx && (
                              <div className="p-5 pt-0 text-sm text-slate-500 dark:text-slate-400 leading-relaxed animate-in fade-in slide-in-from-top-2">
                                  {faq.a}
                              </div>
                          )}
                      </div>
                  ))}
              </div>

              {/* Contact Channels */}
              <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="p-4 bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-white/60 dark:border-slate-700 text-center hover:shadow-md transition-all cursor-pointer group">
                      <Mail size={24} className="mx-auto text-[#73c6df] mb-2 group-hover:scale-110 transition-transform" />
                      <h4 className="font-bold text-slate-700 dark:text-white text-sm">Email</h4>
                      <p className="text-xs text-slate-400">suporte@lumea.ai</p>
                  </div>
                  <div className="p-4 bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-white/60 dark:border-slate-700 text-center hover:shadow-md transition-all cursor-pointer group">
                      <MessageCircle size={24} className="mx-auto text-[#8bd7bf] mb-2 group-hover:scale-110 transition-transform" />
                      <h4 className="font-bold text-slate-700 dark:text-white text-sm">Chat Ao Vivo</h4>
                      <p className="text-xs text-slate-400">09:00 - 18:00</p>
                  </div>
              </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700 rounded-[2.5rem] p-8 h-fit">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Envie uma mensagem</h2>
              
              {submitStatus === 'success' && (
                <div className="mb-6 p-4 rounded-xl flex border items-start gap-4 animate-in slide-in-from-top-2"
                  style={{ backgroundColor: 'var(--green-a)', borderColor: 'var(--green)' }}>
                  <CheckCircle2 className="mt-0.5" style={{ color: 'var(--green)' }} size={20} />
                  <div>
                    <h4 className="font-bold text-[14px]" style={{ color: 'var(--green)', fontFamily: "'Outfit', sans-serif" }}>Mensagem Enviada!</h4>
                    <p className="text-sm font-medium opacity-90" style={{ color: 'var(--green)', fontFamily: "'Outfit', sans-serif" }}>Nossa equipe responderá em breve. Agradecemos o contato.</p>
                  </div>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="mb-6 p-4 rounded-xl flex border items-start gap-4 animate-in slide-in-from-top-2"
                  style={{ backgroundColor: 'var(--danger-a)', borderColor: 'var(--danger)' }}>
                  <AlertCircle className="mt-0.5" style={{ color: 'var(--danger)' }} size={20} />
                  <div>
                    <h4 className="font-bold text-[14px]" style={{ color: 'var(--danger)', fontFamily: "'Outfit', sans-serif" }}>Ocorreu um erro</h4>
                    <p className="text-sm font-medium opacity-90" style={{ color: 'var(--danger)', fontFamily: "'Outfit', sans-serif" }}>Tente novamente mais tarde ou use os canais alternativos.</p>
                  </div>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Nome</label>
                          <input type="text" 
                                 required
                                 value={formData.name}
                                 onChange={e => setFormData({...formData, name: e.target.value})}
                                 className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#73c6df]/30 font-medium text-sm dark:text-white" 
                                 placeholder="Seu nome" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Email</label>
                          <input type="email" 
                                 required
                                 value={formData.email}
                                 onChange={e => setFormData({...formData, email: e.target.value})}
                                 className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#73c6df]/30 font-medium text-sm dark:text-white" 
                                 placeholder="seu@email.com" />
                      </div>
                  </div>
                  
                  <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Assunto</label>
                      <select 
                         value={formData.subject}
                         onChange={e => setFormData({...formData, subject: e.target.value})}
                         className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#73c6df]/30 font-medium text-sm text-slate-600 dark:text-slate-200">
                          <option>Dúvida sobre Faturamento</option>
                          <option>Reportar um Bug</option>
                          <option>Sugestão de Feature</option>
                          <option>Outro</option>
                      </select>
                  </div>

                  <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Mensagem</label>
                      <textarea 
                        rows={4} 
                        required
                        value={formData.message}
                        onChange={e => setFormData({...formData, message: e.target.value})}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#73c6df]/30 font-medium text-sm resize-none dark:text-white" 
                        placeholder="Descreva como podemos ajudar..."></textarea>
                  </div>

                  <button 
                    disabled={isSubmitting}
                    className="w-full py-3.5 text-white rounded-xl font-bold hover:opacity-90 shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50" 
                    style={{ backgroundImage: 'linear-gradient(135deg, #2e8ba6, #73c6df)' }}>
                      <Send size={18} /> {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
                  </button>
              </form>
          </div>

      </div>
    </div>
  );
};

export default HelpSupport;
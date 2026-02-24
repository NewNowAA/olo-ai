import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Mail, MessageCircle, Phone, Send } from 'lucide-react';

const HelpSupport: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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
              
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Nome</label>
                          <input type="text" className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#73c6df]/30 font-medium text-sm dark:text-white" placeholder="Seu nome" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Email</label>
                          <input type="email" className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#73c6df]/30 font-medium text-sm dark:text-white" placeholder="seu@email.com" />
                      </div>
                  </div>
                  
                  <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Assunto</label>
                      <select className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#73c6df]/30 font-medium text-sm text-slate-600 dark:text-slate-200">
                          <option>Dúvida sobre Faturamento</option>
                          <option>Reportar um Bug</option>
                          <option>Sugestão de Feature</option>
                          <option>Outro</option>
                      </select>
                  </div>

                  <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Mensagem</label>
                      <textarea rows={4} className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#73c6df]/30 font-medium text-sm resize-none dark:text-white" placeholder="Descreva como podemos ajudar..."></textarea>
                  </div>

                  <button className="w-full py-3.5 text-white rounded-xl font-bold hover:opacity-90 shadow-lg flex items-center justify-center gap-2 transition-all" style={{ backgroundImage: 'linear-gradient(135deg, #2e8ba6, #73c6df)' }}>
                      <Send size={18} /> Enviar Mensagem
                  </button>
              </form>
          </div>

      </div>
    </div>
  );
};

export default HelpSupport;
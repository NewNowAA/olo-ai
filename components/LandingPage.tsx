import React, { useEffect, useRef, useState } from 'react';
import { 
  ArrowRight, 
  Zap, 
  Shield, 
  MessageSquare, 
  FileText,
  BarChart3,
  Play,
  ScanLine,
  Check,
  Bot,
  BrainCircuit,
  Smartphone,
  PieChart
} from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

// --- Helper Component for Scroll Animations ---
const ScrollReveal = ({ children, className = "", delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  return (
    <div 
      ref={ref}
      className={`transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegister }) => {
  return (
    <div className="min-h-screen bg-transparent text-slate-900 font-sans overflow-x-hidden selection:bg-[#73c6df] selection:text-white relative">
      
      {/* --- INFINITE BACKGROUND (FIXED) --- */}
      <div className="fixed inset-0 -z-50 bg-slate-50">
          <div className="absolute top-[-10%] left-[20%] w-[800px] h-[800px] bg-[#73c6df]/10 rounded-full blur-[120px] animate-float"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#8bd7bf]/15 rounded-full blur-[100px] animate-float-delayed"></div>
          <div className="absolute top-[40%] left-[-10%] w-[400px] h-[400px] bg-purple-100/40 rounded-full blur-[80px] animate-float"></div>
      </div>

      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-6 max-w-7xl mx-auto relative z-50">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#73c6df] to-[#8bd7bf] flex items-center justify-center shadow-lg shadow-[#73c6df]/20">
             <Zap size={18} className="text-white fill-current" />
           </div>
           <span className="text-2xl font-extrabold tracking-tighter text-slate-800">faturAI</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500">
           <a href="#features" className="hover:text-[#2e8ba6] transition-colors">Funcionalidades</a>
           <a href="#how-it-works" className="hover:text-[#2e8ba6] transition-colors">Como Funciona</a>
           <a href="#pricing" className="hover:text-[#2e8ba6] transition-colors">Preços</a>
        </div>

        <div className="flex items-center gap-4">
           <button onClick={onLogin} className="text-sm font-bold text-slate-600 hover:text-[#2e8ba6] transition-colors">
             Entrar
           </button>
           <button 
             onClick={onRegister}
             className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#73c6df] to-[#8bd7bf] text-white text-sm font-bold hover:brightness-110 transition-all shadow-lg hover:shadow-[#73c6df]/30"
           >
             Começar Grátis
           </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-20 pb-32 px-6">
         <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Content */}
            <div className="space-y-8 relative z-10 animate-in fade-in slide-in-from-left-8 duration-700">
               <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-sm border border-slate-200 text-xs font-bold text-[#2e8ba6] shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#73c6df] animate-pulse"></span>
                  Novo: Integração WhatsApp Business
               </div>
               
               <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] text-slate-900">
                  As suas faturas, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#73c6df] to-[#2e8ba6]">no piloto automático.</span>
               </h1>
               
               <p className="text-lg text-slate-500 max-w-xl leading-relaxed font-medium">
                  O faturAI lê, valida e organiza faturas do WhatsApp e Telegram — e apresenta tudo num dashboard limpo para controlar pagamentos, fluxo de caixa e fornecedores.
               </p>
               
               <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={onRegister}
                    className="px-8 py-4 rounded-full bg-gradient-to-r from-[#73c6df] to-[#8bd7bf] text-white font-bold text-lg hover:brightness-110 transition-all shadow-xl shadow-[#73c6df]/20 flex items-center justify-center gap-2 group"
                  >
                     Começar grátis <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button className="px-8 py-4 rounded-full bg-white border border-slate-200 text-slate-700 font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm">
                     <Play size={20} className="fill-slate-700" /> Ver demo
                  </button>
               </div>
               
               <div className="flex items-center gap-4 text-sm text-slate-500 font-bold pt-4">
                  <div className="flex -space-x-3">
                     {[1,2,3,4].map(i => (
                        <div key={i} className={`w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs text-slate-600 relative z-${10-i}`}>
                            <span className="opacity-50">U{i}</span>
                        </div>
                     ))}
                  </div>
                  <p>+2.000 empresas confiam</p>
               </div>
            </div>

            {/* Right Visual: AI Simulation */}
            <div className="relative animate-in fade-in slide-in-from-right-8 duration-1000">
                <div className="relative bg-white/80 backdrop-blur-md border border-slate-100 rounded-[2.5rem] p-6 shadow-2xl shadow-slate-200/50 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                    {/* Chat Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                        <div className="flex items-center gap-3">
                           <div className="w-12 h-12 rounded-2xl bg-[#73c6df]/10 text-[#2e8ba6] flex items-center justify-center">
                              <Bot size={24} />
                           </div>
                           <div>
                              <h4 className="font-bold text-slate-800">faturAI Assistente</h4>
                              <p className="text-xs text-[#2e8ba6] font-bold">● Online</p>
                           </div>
                        </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="space-y-6 font-medium text-sm">
                        <div className="flex justify-end">
                            <div className="bg-[#73c6df] text-white p-4 rounded-2xl rounded-tr-sm max-w-[80%] shadow-lg shadow-[#73c6df]/20">
                                <div className="flex items-center gap-2 mb-2 bg-white/20 p-2 rounded-lg">
                                    <FileText size={16} /> <span className="font-bold">Fatura_Outubro.pdf</span>
                                </div>
                                <span className="text-[10px] opacity-80 block text-right">Enviado 10:42</span>
                            </div>
                        </div>
                        
                        <div className="flex justify-start">
                            <div className="bg-slate-50 text-slate-600 p-5 rounded-2xl rounded-tl-sm max-w-[90%] border border-slate-100 shadow-sm">
                                <p className="mb-3 text-[#2e8ba6] font-bold flex items-center gap-2">
                                    <Check size={14} className="bg-[#2e8ba6] text-white rounded-full p-0.5" /> Fatura Processada
                                </p>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between gap-8 py-1 border-b border-slate-100">
                                        <span className="text-slate-400 font-bold uppercase">Fornecedor</span>
                                        <span className="text-slate-800 font-bold">TechCorp Solutions</span>
                                    </div>
                                    <div className="flex justify-between gap-8 py-1 border-b border-slate-100">
                                        <span className="text-slate-400 font-bold uppercase">Valor</span>
                                        <span className="text-slate-800 font-bold">€2,450.00</span>
                                    </div>
                                    <div className="flex justify-between gap-8 py-1">
                                        <span className="text-slate-400 font-bold uppercase">Categoria</span>
                                        <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-600 font-bold">Software</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mini Dashboard Float */}
                    <div className="absolute -bottom-8 -left-8 bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_20px_40px_rgba(0,0,0,0.1)] w-72 animate-float-delayed">
                        <div className="flex items-center justify-between mb-4">
                           <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fluxo Recente</span>
                           <BarChart3 size={18} className="text-[#73c6df]" />
                        </div>
                        <div className="flex items-end gap-2 h-16 justify-between px-2">
                           {[40, 70, 45, 90, 60, 80].map((h, i) => (
                              <div key={i} className="w-6 bg-slate-100 rounded-t-md relative group overflow-hidden" style={{height: '100%'}}>
                                  <div className={`absolute bottom-0 w-full bg-[#73c6df] rounded-t-md transition-all duration-500`} style={{height: `${h}%`}}></div>
                              </div>
                           ))}
                        </div>
                    </div>
                </div>
            </div>
         </div>
      </header>

      {/* --- SCROLLING BENTO WIZARD SECTION --- */}
      <section id="features" className="py-32 relative">
         <div className="max-w-7xl mx-auto px-6 relative z-10">
            
            <ScrollReveal>
                <div className="text-center mb-24 max-w-3xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-slate-900 tracking-tight">
                    O fim da contabilidade manual. <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#73c6df] to-[#8bd7bf]">Em 3 passos simples.</span>
                </h2>
                <p className="text-slate-500 text-lg font-medium">
                    Acompanhe como a faturAI transforma um processo complexo numa experiência invisível.
                </p>
                </div>
            </ScrollReveal>
            
            {/* Bento Grid Wizard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               
               {/* STEP 1: CAPTURE */}
               <ScrollReveal className="md:col-span-2" delay={100}>
                   <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-10 border border-white/50 shadow-xl hover:shadow-2xl hover:shadow-[#73c6df]/10 transition-all duration-500 group overflow-hidden relative h-full">
                       <div className="absolute top-0 right-0 w-64 h-64 bg-[#73c6df]/10 rounded-full blur-[80px] group-hover:bg-[#73c6df]/20 transition-all"></div>
                       
                       <div className="flex flex-col md:flex-row gap-10 items-center">
                           <div className="flex-1 relative z-10">
                               <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-widest">
                                   <span className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center mr-1">1</span>
                                   Captura
                               </div>
                               <h3 className="text-3xl font-bold text-slate-800 mb-4">Envie de qualquer lugar</h3>
                               <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                   Não guarde papéis. Tire uma foto ou encaminhe o PDF para o nosso <strong>WhatsApp</strong> ou <strong>Telegram</strong>. Nossa IA está sempre online para receber.
                               </p>
                               <div className="flex gap-4">
                                   <div className="w-12 h-12 bg-[#25D366]/10 text-[#25D366] rounded-2xl flex items-center justify-center">
                                       <MessageSquare size={24} />
                                   </div>
                                   <div className="w-12 h-12 bg-[#0088cc]/10 text-[#0088cc] rounded-2xl flex items-center justify-center">
                                       <Smartphone size={24} />
                                   </div>
                               </div>
                           </div>
                           
                           <div className="flex-1 relative">
                               <div className="bg-slate-900 rounded-3xl p-4 shadow-2xl transform rotate-2 group-hover:rotate-0 transition-transform duration-500 border border-slate-700 w-full max-w-xs mx-auto">
                                   <div className="flex gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-full bg-[#73c6df] flex items-center justify-center text-slate-900 text-xs font-bold">F</div>
                                        <div className="bg-white/10 rounded-2xl p-3 text-white text-xs">
                                            Aqui está a fatura do almoço. 🧾
                                        </div>
                                   </div>
                                   <div className="flex gap-3 justify-end">
                                        <div className="bg-[#73c6df] rounded-2xl p-3 text-slate-900 text-xs font-bold">
                                            Recebido! €45.00 classificado em "Refeições".
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#73c6df]"><Bot size={16} /></div>
                                   </div>
                               </div>
                           </div>
                       </div>
                   </div>
               </ScrollReveal>

               {/* STEP 2: PROCESSING */}
               <ScrollReveal className="md:col-span-1" delay={200}>
                   <div className="bg-gradient-to-br from-[#73c6df] to-[#8bd7bf] rounded-[2.5rem] p-8 text-white shadow-xl hover:scale-[1.02] transition-all duration-500 group relative overflow-hidden h-full flex flex-col">
                       <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                       
                       <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-widest w-fit">
                           <span className="w-6 h-6 rounded-full bg-white text-[#73c6df] flex items-center justify-center mr-1">2</span>
                           Processamento
                       </div>
                       
                       <div className="mb-auto">
                           <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                               <BrainCircuit size={32} className="text-white" />
                           </div>
                           <h3 className="text-2xl font-bold mb-3">IA Vision</h3>
                           <p className="text-white/90 text-sm font-medium leading-relaxed">
                               Nossa tecnologia OCR extrai NIF, Data, Itens e Valor com 99.8% de precisão em segundos.
                           </p>
                       </div>

                       <div className="mt-8 bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
                           <div className="flex justify-between text-xs font-bold mb-2">
                               <span>Precisão</span>
                               <span>99.8%</span>
                           </div>
                           <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                               <div className="h-full bg-white w-[99.8%]"></div>
                           </div>
                       </div>
                   </div>
               </ScrollReveal>

               {/* STEP 3: ORGANIZATION */}
               <ScrollReveal className="md:col-span-1" delay={300}>
                   <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/50 shadow-lg hover:border-[#73c6df] transition-all duration-500 group h-full">
                       <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-widest">
                           <span className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center mr-1">3</span>
                           Controle
                       </div>
                       
                       <h3 className="text-2xl font-bold text-slate-800 mb-3">Dashboard Vivo</h3>
                       <p className="text-slate-500 text-sm font-medium mb-8">
                           Tudo centralizado. Receitas, despesas e previsões em um só lugar.
                       </p>

                       <div className="relative">
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 group-hover:scale-105 transition-transform duration-500">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600"><PieChart size={20} /></div>
                                    <div>
                                        <div className="h-2 w-20 bg-slate-200 rounded mb-1"></div>
                                        <div className="h-2 w-12 bg-slate-100 rounded"></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-2 w-full bg-slate-100 rounded"></div>
                                    <div className="h-2 w-full bg-slate-100 rounded"></div>
                                </div>
                            </div>
                            <div className="absolute -top-2 -right-2 bg-[#73c6df] text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg">
                                Atualizado
                            </div>
                       </div>
                   </div>
               </ScrollReveal>

               {/* STEP 4: SECURITY/TRUST (Wide) */}
               <ScrollReveal className="md:col-span-2" delay={400}>
                   <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden h-full flex items-center">
                        <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        
                        <div className="flex flex-col md:flex-row gap-8 items-center relative z-10 w-full">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-4 text-[#73c6df]">
                                    <Shield size={24} />
                                    <span className="font-bold tracking-widest uppercase text-xs">Auditoria Automática</span>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-bold mb-4">Seu contador vai amar.</h3>
                                <p className="text-slate-400 font-medium leading-relaxed">
                                    Detectamos faturas duplicadas, alertamos sobre preços anômalos e preparamos tudo para a exportação contábil no fim do mês.
                                </p>
                            </div>
                            <div className="flex-1 flex justify-center md:justify-end">
                                <button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-4 rounded-xl font-bold transition-all flex items-center gap-2 backdrop-blur-sm">
                                    <ScanLine size={20} /> Ver Relatório de Exemplo
                                </button>
                            </div>
                        </div>
                   </div>
               </ScrollReveal>

            </div>

         </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 bg-white/60 backdrop-blur-md text-center text-slate-500 text-sm relative z-10">
         <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
               <span className="text-lg font-extrabold text-slate-800">faturAI</span>
               <span>© 2024</span>
            </div>
            <div className="flex gap-8 font-bold text-slate-400">
               <a href="#" className="hover:text-[#73c6df] transition-colors">Termos</a>
               <a href="#" className="hover:text-[#73c6df] transition-colors">Privacidade</a>
               <a href="#" className="hover:text-[#73c6df] transition-colors">Suporte</a>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default LandingPage;
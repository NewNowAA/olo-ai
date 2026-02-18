import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileX,
  Table,
  Clock,
  MessageSquare,
  Send,
  Shield,
  Monitor,
  ScanLine,
  BarChart3,
  Target,
  Bot,
  Users,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Menu,
  X,
  ArrowRight
} from 'lucide-react';
import { AuroraBackground } from './ui/aurora-background';
import { BackgroundGradientAnimation } from './ui/background-gradient-animation';
import { TextEffect } from './ui/text-effect';
import { cn } from '../lib/utils';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegister }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- Section 1: Hero ---
  const HeroSection = () => (
    <AuroraBackground className="h-screen">
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center max-w-7xl mx-auto pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 border border-slate-200 backdrop-blur-sm mb-6 shadow-sm"
        >
          <span className="flex h-2 w-2 rounded-full bg-[#73c6df]"></span>
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Novo: Integração Telegram activa
          </span>
        </motion.div>

        <TextEffect
          per="word"
          preset="blur"
          className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 max-w-4xl leading-[1.1]"
        >
          As suas faturas, no piloto automático.
        </TextEffect>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-lg md:text-xl text-slate-500 max-w-2xl mb-10 font-medium"
        >
          Tire foto, envie pelo Telegram, e deixe a IA organizar tudo. Dashboard, metas e relatórios — sem tocar num papel.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <button
            onClick={onRegister}
            className="px-8 py-4 rounded-full bg-gradient-to-r from-[#73c6df] to-[#8bd7bf] text-white font-bold text-lg shadow-lg hover:shadow-[#73c6df]/25 hover:scale-105 transition-all duration-300 transform active:scale-95"
          >
            Começar 30 dias Grátis
          </button>
          <a
            href="#como-funciona"
            className="px-8 py-4 rounded-full bg-white text-slate-600 font-bold text-lg border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all duration-300 shadow-sm"
          >
            Ver como funciona
          </a>
        </motion.div>
        
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 1 }}
           className="mt-4 text-sm text-slate-400 font-medium flex gap-4"
        >
           <span>Sem cartão de crédito</span>
           <span>•</span>
           <span>Setup em 2 minutos</span>
        </motion.div>

        {/* Hero Image Mockup */}
        <motion.div
           initial={{ opacity: 0, y: 50 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 1.2, duration: 0.8 }}
           className="mt-16 w-full max-w-5xl rounded-xl border border-slate-200 bg-white/50 backdrop-blur-xl shadow-2xl overflow-hidden p-2 md:p-4 perspective-1000 group hover:scale-[1.01] transition-transform duration-700"
        >
           <div className="rounded-lg bg-slate-50 border border-slate-100 overflow-hidden relative aspect-[16/9] md:aspect-[21/9]">
              {/* Mockup Content */}
              <div className="absolute inset-0 p-4 md:p-8 grid grid-cols-12 gap-4 md:gap-6 bg-slate-50/50">
                 {/* Sidebar Mockup */}
                 <div className="hidden md:block col-span-2 space-y-3">
                    <div className="h-8 w-8 bg-slate-200 rounded-lg mb-8"></div>
                    <div className="h-2 w-20 bg-slate-200 rounded"></div>
                    <div className="h-2 w-16 bg-slate-200 rounded"></div>
                    <div className="h-2 w-24 bg-slate-200 rounded"></div>
                 </div>
                 {/* Main Content Mockup */}
                 <div className="col-span-12 md:col-span-10 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* KPI Card 1 */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-2">
                       <div className="h-8 w-8 rounded-full bg-[#73c6df]/20 flex items-center justify-center">
                          <BarChart3 className="w-4 h-4 text-[#2e8ba6]" />
                       </div>
                       <div className="h-2 w-16 bg-slate-100 rounded"></div>
                       <div className="h-6 w-32 bg-slate-800 rounded"></div>
                    </div>
                    {/* KPI Card 2 */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-2">
                       <div className="h-8 w-8 rounded-full bg-[#8bd7bf]/20 flex items-center justify-center">
                          <ArrowRight className="w-4 h-4 text-[#2e8ba6]" />
                       </div>
                       <div className="h-2 w-16 bg-slate-100 rounded"></div>
                       <div className="h-6 w-24 bg-slate-800 rounded"></div>
                    </div>
                    {/* KPI Card 3 */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-2 hidden md:block">
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-purple-600" />
                       </div>
                       <div className="h-2 w-16 bg-slate-100 rounded"></div>
                       <div className="h-6 w-28 bg-slate-800 rounded"></div>
                    </div>
                    
                    {/* Big Chart Area */}
                    <div className="col-span-1 md:col-span-3 bg-white h-40 md:h-64 rounded-xl shadow-sm border border-slate-100 mt-2 relative overflow-hidden">
                       <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-8 pb-0 pt-10 h-full">
                          {[30, 45, 25, 60, 75, 50, 80, 40, 55, 70, 65, 90].map((h, i) => (
                             <div key={i} className="w-full mx-1 bg-gradient-to-t from-[#73c6df]/20 to-[#73c6df] rounded-t-sm" style={{ height: `${h}%` }}></div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </motion.div>
      </div>
    </AuroraBackground>
  );

  // --- Section 2: Trust Bar ---
  const TrustBar = () => (
    <div className="py-8 bg-white/80 backdrop-blur-sm border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
          Construído com tecnologia de classe mundial
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-60">
           {/* Supabase Logo Text */}
           <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100">
              <span className="font-bold text-xl text-slate-700">Supabase</span>
           </div>
           {/* Google AI */}
           <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100">
              <Sparkles className="w-5 h-5 text-slate-700" />
              <span className="font-bold text-xl text-slate-700">Google AI</span>
           </div>
           {/* Telegram */}
           <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100">
              <Send className="w-5 h-5 text-slate-700" />
              <span className="font-bold text-xl text-slate-700">Telegram</span>
           </div>
           {/* Netlify */}
           <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100">
              <span className="font-bold text-xl text-slate-700">Netlify</span>
           </div>
        </div>
      </div>
    </div>
  );

  // --- Section 3: Problem ---
  const ProblemSection = () => (
    <div className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
           <TextEffect preset="slide" className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
              Cansado de perder tempo com papéis?
           </TextEffect>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
           {[
              { icon: FileX, text: "Recibos perdidos no WhatsApp e gavetas", delay: 0 },
              { icon: Table, text: "Excel infinito que ninguém actualiza", delay: 0.1 },
              { icon: Clock, text: "Contabilista a pedir documentos em cima da hora", delay: 0.2 }
           ].map((item, idx) => (
              <motion.div
                 key={idx}
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: item.delay, duration: 0.5 }}
                 className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-shadow duration-300 flex flex-col items-center text-center"
              >
                 <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
                    <item.icon className="w-8 h-8 text-red-500" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-800">{item.text}</h3>
              </motion.div>
           ))}
        </div>
        
        <div className="text-center mt-16">
           <p className="text-2xl font-bold text-[#2e8ba6]">Há uma forma melhor.</p>
        </div>
      </div>
    </div>
  );

  // --- Section 4: Bento Grid (How it Works) ---
  const HowItWorks = () => (
    <div id="como-funciona" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4">
         <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
               Como funciona
            </h2>
            <p className="mt-4 text-slate-500 text-lg">Do papel ao dashboard em segundos.</p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 grid-rows-2 gap-6 h-auto md:h-[800px]">
            
            {/* Step 1: Envie de qualquer lugar */}
            <div className="col-span-1 md:col-span-2 row-span-1 bg-slate-50 rounded-3xl p-8 border border-slate-100 relative overflow-hidden group">
               <div className="relative z-10">
                  <div className="flex gap-4 mb-4">
                     <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-green-600" />
                     </div>
                     <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Send className="w-6 h-6 text-blue-500" />
                     </div>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Envie de qualquer lugar</h3>
                  <p className="text-slate-500">Tire uma foto e envie para o nosso bot no Telegram ou WhatsApp.</p>
               </div>
               
               {/* Mockup Chat */}
               <div className="absolute right-0 bottom-0 w-3/4 md:w-1/2 h-3/4 bg-white rounded-tl-2xl shadow-xl border-l border-t border-slate-200 p-4 translate-y-4 translate-x-4 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-500">
                  <div className="space-y-4">
                     <div className="flex justify-end">
                        <div className="bg-[#DCF8C6] p-3 rounded-2xl rounded-tr-none text-sm shadow-sm max-w-[80%]">
                           <div className="flex items-center gap-2 mb-1">
                             <ScanLine className="w-3 h-3 opacity-50" /> Foto da fatura
                           </div>
                           [Imagem Enviada]
                        </div>
                     </div>
                     <div className="flex justify-start">
                        <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none text-sm shadow-sm text-slate-800 max-w-[90%]">
                           <p className="font-bold text-[#2e8ba6] mb-1">Fatura Recebida! ✅</p>
                           <p>Extraímos: 45.000 Kz</p>
                           <p>Fornecedor: Shoprite Angola</p>
                           <p>Categoria: Alimentação</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Step 2: IA Vision */}
            <div className="col-span-1 row-span-1 bg-gradient-to-br from-[#73c6df] to-[#8bd7bf] rounded-3xl p-8 text-white relative overflow-hidden flex flex-col justify-between group">
               <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-2">IA Vision</h3>
                  <p className="opacity-90">Processamento instantâneo com precisão comprovada.</p>
               </div>
               <div className="absolute inset-0 flex items-center justify-center opacity-30">
                  <ScanLine className="w-64 h-64 animate-pulse" />
               </div>
               {/* Scan Line Animation */}
               <div className="absolute top-0 left-0 w-full h-1 bg-white/50 blur-sm animate-[scan_3s_ease-in-out_infinite]"></div>
               
               <div className="relative z-10 bg-white/20 backdrop-blur-md rounded-xl p-4 mt-8 border border-white/30">
                  <div className="flex justify-between text-sm font-bold mb-1">
                     <span>Processando...</span>
                     <span>100%</span>
                  </div>
                  <div className="w-full bg-black/10 rounded-full h-2 overflow-hidden">
                     <div className="bg-white h-full w-full animate-[progress_2s_ease-out_forwards]"></div>
                  </div>
               </div>
            </div>

            {/* Step 3: Dashboard Vivo */}
            <div className="col-span-1 md:col-span-1 row-span-1 bg-slate-900 rounded-3xl p-8 relative overflow-hidden group border border-slate-800">
               <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-white mb-2">Dashboard Vivo</h3>
                  <p className="text-slate-400">Ver como os seus gastos evoluem.</p>
               </div>
               <div className="mt-8 space-y-3">
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                     <div className="text-xs text-slate-400">Receita</div>
                     <div className="text-lg font-mono text-[#8bd7bf]">245.000 Kz</div>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                     <div className="text-xs text-slate-400">Despesa</div>
                     <div className="text-lg font-mono text-red-300">45.000 Kz</div>
                  </div>
               </div>
            </div>

            {/* Step 4: Seu contador vai amar */}
            <div className="col-span-1 md:col-span-2 row-span-1 bg-slate-50 rounded-3xl p-8 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8 group">
               <div className="flex-1">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                     <Shield className="w-6 h-6 text-purple-600" />
                  </div>
                   <h3 className="text-2xl font-bold text-slate-900 mb-2">Seu contador vai amar</h3>
                   <p className="text-slate-500 mb-6">Relatórios organizados, categorias corretas e nenhum documento perdido.</p>
                   <button className="text-[#2e8ba6] font-bold text-sm hover:underline flex items-center gap-1">
                      Ver relatório de exemplo <ArrowRight className="w-4 h-4" />
                   </button>
               </div>
               <div className="w-full md:w-1/2 h-48 bg-white border border-slate-200 rounded-xl shadow-lg p-4 flex flex-col gap-2 scale-95 group-hover:scale-100 transition-transform duration-300">
                  <div className="h-4 w-1/3 bg-slate-200 rounded"></div>
                  <div className="h-px w-full bg-slate-100 my-2"></div>
                  {[1,2,3].map(i => (
                     <div key={i} className="flex justify-between">
                        <div className="h-3 w-20 bg-slate-100 rounded"></div>
                        <div className="h-3 w-10 bg-slate-100 rounded"></div>
                     </div>
                  ))}
                  <div className="mt-auto pt-2 border-t border-slate-100 flex justify-between">
                     <div className="h-4 w-16 bg-slate-200 rounded"></div>
                     <div className="h-4 w-16 bg-[#73c6df]/30 rounded"></div>
                  </div>
               </div>
            </div>

         </div>
      </div>
    </div>
  );

  // --- Section 5: Channels ---
  const ChannelsSection = () => (
     <div className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4">
           <div className="grid md:grid-cols-3 gap-8">
              {/* Telegram */}
              <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:border-blue-200 transition-all cursor-default">
                 <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <Send className="w-6 h-6 text-[#0088cc]" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">Telegram</h3>
                 <p className="text-slate-500 mb-6">Envie foto ou PDF diretamente.</p>
                 <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-3 h-32 flex items-center justify-center text-sm text-slate-400 italic">
                    Mockup Conversa Telegram
                 </div>
              </div>
              
              {/* WhatsApp */}
              <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 opacity-75 relative">
                 <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">
                    🔜 Brevemente
                 </div>
                 <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                    <MessageSquare className="w-6 h-6 text-[#25D366]" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">WhatsApp Business</h3>
                 <p className="text-slate-500">A integração oficial está a caminho.</p>
              </div>

               {/* Website */}
               <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:border-[#73c6df] transition-all">
                 <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-4">
                    <Monitor className="w-6 h-6 text-[#2e8ba6]" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">Web Dashboard</h3>
                 <p className="text-slate-500 mb-6">Controlo total no seu browser.</p>
                  <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-3 h-32 flex items-center justify-center text-sm text-slate-400 italic">
                    Mini Dashboard Screenshot
                 </div>
              </div>
           </div>
        </div>
     </div>
  );

  // --- Section 6: IA Lumea ---
  const LumeaSection = () => (
     <div className="relative h-[80vh] min-h-[600px] w-full overflow-hidden">
        <BackgroundGradientAnimation 
           containerClassName="absolute inset-0 z-0"
           firstColor="115, 198, 223"
           secondColor="139, 215, 191"
           thirdColor="46, 139, 16" 
           size="60%"
        />
        <div className="absolute inset-0 z-10 flex items-center justify-center px-4">
           <div className="max-w-4xl w-full text-center text-white">
              <div className="inline-block px-4 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 mb-6 font-semibold tracking-wide uppercase text-sm">
                 Inteligência Artificial Utilizável
              </div>
              
               <TextEffect per="word" preset="blur" className="text-4xl md:text-6xl font-extrabold mb-12 drop-shadow-lg">
                  A sua contabilista digital. Disponível 24/7.
               </TextEffect>

               <div className="max-w-xl mx-auto bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-left shadow-2xl">
                  <div className="space-y-4">
                     {/* User Message */}
                     <div className="flex justify-end">
                        <div className="bg-white/20 p-4 rounded-2xl rounded-tr-sm text-white max-w-[85%]">
                           <p className="font-medium">Qual foi o meu maior gasto este mês?</p>
                        </div>
                     </div>
                     {/* Lumea Message */}
                     <div className="flex justify-start items-start gap-4">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-lg">
                           <Sparkles className="w-5 h-5 text-[#73c6df]" />
                        </div>
                        <div className="bg-white text-slate-800 p-4 rounded-2xl rounded-tl-sm shadow-xl max-w-[90%]">
                           <p className="leading-relaxed">
                              O teu maior gasto foi <span className="font-bold text-[#2e8ba6]">Alimentação (127.500 Kz)</span>, 
                              representando 34% das despesas. 
                           </p>
                           <div className="flex items-center gap-2 mt-2 text-xs font-bold text-red-500 bg-red-50 p-2 rounded-lg inline-flex">
                              <ChevronUp className="w-3 h-3" /> Subiu 12% vs mês anterior
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               <button 
                  onClick={onRegister}
                  className="mt-12 px-8 py-4 bg-white text-slate-900 font-bold rounded-full shadow-xl hover:scale-105 transition-transform"
               >
                  Experimentar Lumea
               </button>
           </div>
        </div>
     </div>
  );

  // --- Section 7: Features Grid ---
  const FeaturesGrid = () => (
     <div className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
           <div className="text-center mb-16">
              <h2 className="text-3xl font-extrabold text-slate-900">Tudo o que precisa para crescer</h2>
           </div>
           
           <div className="grid md:grid-cols-3 gap-6">
              {[
                 { icon: ScanLine, title: "OCR Inteligente", desc: "Foto → dados em segundos" },
                 { icon: BarChart3, title: "Dashboard em Tempo Real", desc: "KPIs sempre actualizados" },
                 { icon: Target, title: "Metas Financeiras", desc: "Define e acompanha objectivos" },
                 { icon: Bot, title: "Assistente IA", desc: "Perguntas sobre as tuas finanças" },
                 { icon: Users, title: "Multi-utilizador", desc: "Equipa com roles diferentes" },
                 { icon: Shield, title: "Compliance AGT", desc: "NIF, ATCUD, hash fiscal (Briefing)", badge: "Brevemente" }
              ].map((feature, idx) => (
                 <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 hover:shadow-lg hover:border-[#73c6df] transition-all group">
                    <div className="flex items-start justify-between mb-4">
                       <div className="p-3 bg-teal-50 rounded-xl group-hover:bg-[#73c6df] transition-colors duration-300">
                          <feature.icon className="w-6 h-6 text-[#2e8ba6] group-hover:text-white" />
                       </div>
                       {feature.badge && (
                          <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-700 px-2 py-1 rounded-full">{feature.badge}</span>
                       )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-slate-500 text-sm">{feature.desc}</p>
                 </div>
              ))}
           </div>
        </div>
     </div>
  );

  // --- Section 8: Pricing ---
  const PricingSection = () => {
     const [isAnnual, setIsAnnual] = useState(false);

     const plans = [
        {
           title: "Grátis",
           price: 0,
           desc: "Para começar a organizar suas faturas",
           features: ["Até 20 faturas/mês", "OCR básico", "1 utilizador", "Dashboard com KPIs", "Chat Lumea (50 msg/mês)"],
           cta: "Começar Grátis",
           highlight: false
        },
        {
           title: "Profissional",
           price: isAnnual ? 47900 : 4990,
           desc: "Para empresas em crescimento",
           features: ["Até 200 faturas/mês", "OCR avançado + Revisão", "Até 5 utilizadores", "Chat Lumea (500 msg/mês)", "Bot Telegram", "Relatórios PDF"],
           cta: "Iniciar Trial Grátis",
           highlight: true
        },
        {
           title: "Empresarial",
           price: isAnnual ? 143900 : 14990,
           desc: "Para grandes organizações",
           features: ["Faturas ilimitadas", "Utilizadores ilimitados", "IA ilimitada", "Compliance AGT completo", "API de integração", "Suporte 24/7"],
           cta: "Falar com Vendas",
           highlight: false
        }
     ];

     return (
        <div id="precos" className="py-24 bg-white">
           <div className="max-w-7xl mx-auto px-4">
              <div className="text-center mb-12">
                 <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6">Planos simples e transparentes</h2>
                 
                 {/* Toggle */}
                 <div className="flex items-center justify-center gap-4">
                    <span className={cn("text-sm font-bold", !isAnnual ? "text-slate-900" : "text-slate-400")}>Mensal</span>
                    <button 
                       onClick={() => setIsAnnual(!isAnnual)}
                       className="w-16 h-8 bg-slate-200 rounded-full p-1 relative transition-colors duration-300"
                    >
                       <div className={cn("w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300", isAnnual ? "translate-x-8" : "translate-x-0")}></div>
                    </button>
                    <span className={cn("text-sm font-bold", isAnnual ? "text-slate-900" : "text-slate-400")}>
                       Anual <span className="text-[#2e8ba6] ml-1">-20%</span>
                    </span>
                 </div>
              </div>

              <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                 {plans.map((plan, idx) => (
                    <div 
                       key={idx} 
                       className={cn(
                          "relative rounded-3xl p-8 border transition-all duration-300 flex flex-col",
                          plan.highlight 
                             ? "border-[#73c6df] shadow-2xl scale-105 z-10 bg-white" 
                             : "border-slate-200 bg-slate-50 hover:border-slate-300"
                       )}
                    >
                       {plan.highlight && (
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-[#73c6df] to-[#8bd7bf] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                             Mais Popular
                          </div>
                       )}
                       
                       <div className="mb-8">
                          <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.title}</h3>
                          <p className="text-sm text-slate-500 h-10">{plan.desc}</p>
                       </div>
                       
                       <div className="mb-8">
                          <div className="flex items-baseline gap-1">
                             <span className="text-sm font-bold text-slate-500">Kz</span>
                             <span className="text-4xl font-extrabold text-slate-900">{plan.price === 0 ? "0" : plan.price.toLocaleString('pt-AO')}</span>
                             <span className="text-slate-500">/{isAnnual ? "ano" : "mês"}</span>
                          </div>
                       </div>

                       <ul className="space-y-4 mb-8 flex-1">
                          {plan.features.map((feat, i) => (
                             <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                                <Check className="w-5 h-5 text-[#2e8ba6] shrink-0" />
                                {feat}
                             </li>
                          ))}
                       </ul>

                       <button 
                          onClick={onRegister}
                          className={cn(
                             "w-full py-4 rounded-xl font-bold transition-all",
                             plan.highlight 
                                ? "bg-slate-900 text-white hover:bg-slate-800 shadow-lg" 
                                : "bg-white border border-slate-200 text-slate-700 hover:border-slate-400"
                          )}
                       >
                          {plan.cta}
                       </button>
                    </div>
                 ))}
              </div>
           </div>
        </div>
     );
  };

  // --- Section 9: FAQ ---
  const FAQSection = () => {
      const [openIndex, setOpenIndex] = useState<number | null>(null);
      const faqs = [
          { q: "Preciso de instalar alguma app?", a: "Não. O FaturAI funciona no browser e no Telegram. Podes usar no telemóvel, tablet ou computador sem instalar nada." },
          { q: "Os meus dados estão seguros?", a: "Sim. Usamos Supabase com encriptação de classe mundial e Row Level Security (RLS). Cada utilizador só consegue ver estritamente os seus próprios dados." },
          { q: "Funciona com faturas angolanas?", a: "Sim. A nossa IA foi especificamente treinada para ler faturas com NIF angolano, valores em Kwanza (Kz) e os formatos mais comuns de Angola." },
          { q: "Posso cancelar a qualquer momento?", a: "Sim. Sem fidelização. O plano grátis é gratuito para sempre. Os planos pagos podem ser cancelados no fim do mês ou ano contratado." },
      ];

      return (
          <div className="py-24 bg-slate-50">
              <div className="max-w-3xl mx-auto px-4">
                  <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-12">Perguntas Frequentes</h2>
                  <div className="space-y-4">
                      {faqs.map((faq, idx) => (
                          <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                              <button 
                                  onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                                  className="w-full flex items-center justify-between p-6 text-left font-bold text-slate-800 hover:bg-slate-50 transition-colors"
                              >
                                  {faq.q}
                                  {openIndex === idx ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                              </button>
                              <AnimatePresence>
                                  {openIndex === idx && (
                                      <motion.div 
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: "auto", opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          className="overflow-hidden"
                                      >
                                          <div className="p-6 pt-0 text-slate-500 leading-relaxed border-t border-slate-100">
                                              {faq.a}
                                          </div>
                                      </motion.div>
                                  )}
                              </AnimatePresence>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      );
  };

  // --- Section 10: Footer & Final CTA ---
  const Footer = () => (
      <footer className="bg-white pt-24 pb-12 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4">
              
              {/* Final CTA */}
              <div className="bg-gradient-to-r from-[#73c6df] to-[#8bd7bf] rounded-3xl p-8 md:p-16 text-center text-white mb-24 shadow-2xl relative overflow-hidden">
                  <div className="relative z-10">
                      <h2 className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight">Pronto para acabar com o caos?</h2>
                      <p className="text-lg md:text-xl opacity-90 mb-10 max-w-2xl mx-auto">Junte-se aos primeiros utilizadores em Angola a automatizar a sua contabilidade pessoal e empresarial.</p>
                      <button 
                          onClick={onRegister}
                          className="bg-white text-[#2e8ba6] px-10 py-5 rounded-full font-bold text-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                      >
                          Começar Grátis — Sem cartão
                      </button>
                      <p className="mt-6 text-sm opacity-70 font-medium">Setup em 2 minutos. Cancela quando quiseres.</p>
                  </div>
                  {/* Decorative circles */}
                  <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
                  <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
              </div>

              {/* Footer Content */}
              <div className="grid md:grid-cols-4 gap-12 border-t border-slate-100 pt-12">
                  <div className="col-span-1 md:col-span-1">
                      <div className="text-2xl font-extrabold text-slate-900 mb-4 tracking-tighter">faturAI</div>
                      <p className="text-slate-400 text-sm">
                          © 2026 FaturAI Inc.<br/>
                          Todos os direitos reservados.
                      </p>
                  </div>
                  <div className="col-span-2 md:col-span-3 flex flex-wrap gap-8 md:gap-16">
                      <div>
                          <h4 className="font-bold text-slate-900 mb-4">Produto</h4>
                          <ul className="space-y-2 text-sm text-slate-500">
                              <li><a href="#" className="hover:text-[#73c6df]">Funcionalidades</a></li>
                              <li><a href="#" className="hover:text-[#73c6df]">Preços</a></li>
                              <li><a href="#" className="hover:text-[#73c6df]">Integrações</a></li>
                          </ul>
                      </div>
                      <div>
                          <h4 className="font-bold text-slate-900 mb-4">Empresa</h4>
                          <ul className="space-y-2 text-sm text-slate-500">
                              <li><a href="#" className="hover:text-[#73c6df]">Sobre</a></li>
                              <li><a href="#" className="hover:text-[#73c6df]">Blog</a></li>
                              <li><a href="#" className="hover:text-[#73c6df]">Carreiras</a></li>
                          </ul>
                      </div>
                      <div>
                          <h4 className="font-bold text-slate-900 mb-4">Legal</h4>
                          <ul className="space-y-2 text-sm text-slate-500">
                              <li><a href="#" className="hover:text-[#73c6df]">Termos</a></li>
                              <li><a href="#" className="hover:text-[#73c6df]">Privacidade</a></li>
                          </ul>
                      </div>
                  </div>
              </div>
              <div className="mt-12 text-center text-sm text-slate-400 font-medium">
                  Feito com ❤️ em Angola
              </div>
          </div>
      </footer>
  );

  // --- Main Render ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-[#73c6df]/30 text-slate-900">
      
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 h-20 flex items-center transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 w-full flex items-center justify-between">
          <div className="text-2xl font-extrabold tracking-tighter text-slate-900">faturAI</div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#como-funciona" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Como Funciona</a>
            <a href="#precos" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Preços</a>
            <button onClick={onLogin} className="text-sm font-bold text-slate-900 hover:text-[#2e8ba6] transition-colors">
              Entrar
            </button>
            <button 
              onClick={onRegister}
              className="px-6 py-2.5 rounded-full bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl"
            >
              Começar Grátis
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
             className="md:hidden p-2 text-slate-600"
             onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
             {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
         {isMobileMenuOpen && (
            <motion.div 
               initial={{ opacity: 0, y: -20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               className="fixed inset-0 z-40 bg-white pt-24 px-6 md:hidden"
            >
               <div className="flex flex-col gap-6 text-center">
                  <a href="#como-funciona" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-slate-800">Como funciona</a>
                  <a href="#precos" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-slate-800">Preços</a>
                  <hr className="border-slate-100" />
                  <button onClick={() => { onLogin(); setIsMobileMenuOpen(false); }} className="text-xl font-bold text-slate-600">Entrar</button>
                  <button onClick={() => { onRegister(); setIsMobileMenuOpen(false); }} className="w-full py-4 rounded-xl bg-[#73c6df] text-white font-bold text-lg">Começar Grátis</button>
               </div>
            </motion.div>
         )}
      </AnimatePresence>

      <HeroSection />
      <TrustBar />
      <ProblemSection />
      <HowItWorks />
      <ChannelsSection />
      <LumeaSection />
      <FeaturesGrid  />
      <PricingSection />
      <FAQSection />
      <Footer />
    </div>
  );
};

export default LandingPage;

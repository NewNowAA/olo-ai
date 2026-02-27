import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Zap, Send, FileText, CheckCircle2, TrendingUp, MessageCircle, BarChart3, Target, Activity } from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

// Custom Icons as simple SVGs
const BotIcon = () => <Send size={24} className="text-[#1042FF]" />;
const DocumentIcon = () => <FileText size={24} className="text-[#E94C76]" />;
const ChatIcon = () => <MessageCircle size={24} className="text-[#00B8FD]" />;

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegister }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });

  // Singularity Animation Transforms
  const singularityScale = useTransform(scrollYProgress, [0.1, 0.3], [1, 0]);
  const singularityOpacity = useTransform(scrollYProgress, [0.15, 0.3], [1, 0]);

  // IA Vision Transforms
  const scanLineY = useTransform(scrollYProgress, [0.35, 0.55], ['0%', '100%']);
  const tagsOpacity = useTransform(scrollYProgress, [0.45, 0.55], [0, 1]);
  const tagsScale = useTransform(scrollYProgress, [0.45, 0.55], [0.8, 1]);

  // Dashboard Expansion Transforms
  const phoneWidth = useTransform(scrollYProgress, [0.65, 0.85], ['300px', '800px']);
  const phoneHeight = useTransform(scrollYProgress, [0.65, 0.85], ['600px', '500px']);
  const phoneBorderRadius = useTransform(scrollYProgress, [0.65, 0.85], ['3rem', '1.5rem']);
  const dashboardOpacity = useTransform(scrollYProgress, [0.75, 0.9], [0, 1]);
  const hidePhoneContent = useTransform(scrollYProgress, [0.65, 0.7], [1, 0]);

  return (
    <div ref={containerRef} className="relative bg-[#00002C] text-white min-h-[500vh] font-sans overflow-x-hidden selection:bg-[#E94C76] selection:text-white">
      
      {/* Navbar (Fixed) */}
      <nav className="fixed top-0 w-full z-50 bg-[#00002C]/50 backdrop-blur-xl border-b border-white/10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
             <div className="bg-gradient-to-br from-[#1042FF] to-[#00B8FD] p-1.5 rounded-lg text-white shadow-[0_0_15px_rgba(16,66,255,0.5)]">
              <Zap size={20} fill="currentColor" />
            </div>
            <span className="font-extrabold text-xl tracking-tight">
              FATUR<span className="text-[#00B8FD]">AI</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onLogin} className="text-white/70 hover:text-white font-medium text-sm transition-colors">Login</button>
            <button onClick={onRegister} className="bg-gradient-to-r from-[#1042FF] to-[#E94C76] text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-[0_0_20px_rgba(233,76,118,0.4)] hover:shadow-[0_0_30px_rgba(233,76,118,0.6)] hover:-translate-y-0.5 transition-all">
              Acesso Alpha
            </button>
          </div>
        </div>
      </nav>

      {/* Background Partner Logos Marquee (Fixed behind everything) */}
      <div className="fixed top-1/4 left-0 w-full overflow-hidden opacity-10 pointer-events-none z-0">
         <motion.div 
            animate={{ x: [0, -1000] }} 
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            className="flex whitespace-nowrap gap-20 text-4xl font-black uppercase text-white/50"
          >
            {[...Array(10)].map((_, i) => (
              <span key={i}>BFA • UNITEL • NCR • BAI • KWANZA PAY •</span>
            ))}
          </motion.div>
      </div>

      {/* 
        ========================================================
        SCROLL SECTIONS
        ========================================================
      */}

      {/* 1. HERO SECTION (100vh) */}
      <section className="h-screen w-full flex items-center justify-center relative z-10 sticky top-0">
        <div className="max-w-7xl mx-auto w-full px-6 flex flex-col lg:flex-row items-center justify-between gap-12">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex-1 space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E94C76]/10 border border-[#E94C76]/30 shadow-[0_0_15px_rgba(233,76,118,0.2)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E94C76] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E94C76]"></span>
              </span>
              <span className="text-[10px] font-bold text-[#E94C76] tracking-widest uppercase">
                Alpha Phase: Early Access Only
              </span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tighter leading-[1.1] text-white">
              O Faturamento do Futuro é uma <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1042FF] to-[#00B8FD]">Conversa.</span>
            </h1>

            <p className="text-lg text-white/60 max-w-lg font-medium">
              A primeira IA Vision que transforma fotografias do WhatsApp e Telegram em dashboards financeiros automatizados.
            </p>

            <button onClick={onRegister} className="px-8 py-4 rounded-full bg-white text-[#00002C] font-black hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              Reivindicar Acesso
            </button>
          </motion.div>

          <div className="flex-1 flex justify-center lg:justify-end">
            {/* Initial iPhone Mockup Container */}
          </div>
        </div>
      </section>

      {/* 
        ========================================================
        STICKY CENTER PIVOT (The iPhone Mockup)
        Controls Sections 2, 3, and 4
        ========================================================
      */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none w-full flex justify-center lg:justify-end lg:pr-32 max-w-7xl">
         
         <motion.div 
            style={{ 
              width: phoneWidth, 
              height: phoneHeight, 
              borderRadius: phoneBorderRadius 
            }}
            className="relative bg-black border-[4px] border-[#333] shadow-[0_0_50px_rgba(16,66,255,0.3)] overflow-hidden flex items-center justify-center transition-all bg-gradient-to-b from-[#111] to-[#000]"
          >
            {/* Top Notch */}
            <motion.div style={{ opacity: hidePhoneContent }} className="absolute top-0 w-32 h-6 bg-[#333] rounded-b-2xl z-50"></motion.div>

            {/* Glowing Logo Initial State */}
            <motion.div style={{ opacity: hidePhoneContent }} className="absolute flex flex-col items-center">
               <Zap size={48} className="text-[#00B8FD] drop-shadow-[0_0_20px_rgba(0,184,253,0.8)] mb-2" />
               <span className="font-black tracking-widest text-[#1042FF] text-xl drop-shadow-[0_0_10px_rgba(16,66,255,0.8)]">FATURAI</span>
            </motion.div>

            {/* SECTION 2: The Singularity Icons shrinking into the center */}
            <motion.div style={{ scale: singularityScale, opacity: singularityOpacity }} className="absolute inset-0 flex items-center justify-center">
                <div className="absolute -top-10 -left-10 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20"><ChatIcon /></div>
                <div className="absolute top-20 -right-12 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20"><BotIcon /></div>
                <div className="absolute -bottom-8 left-10 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20"><DocumentIcon /></div>
            </motion.div>

            {/* SECTION 3: IA Vision Scan */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div 
                style={{ opacity: useTransform(scrollYProgress, [0.3, 0.4, 0.6, 0.65], [0, 1, 1, 0]) }} 
                className="w-[85%] h-[80%] bg-white/5 border border-white/10 rounded-xl backdrop-blur-md relative overflow-hidden flex flex-col p-4"
              >
                 {/* Fake Invoice Content */}
                 <div className="w-1/2 h-4 bg-white/20 rounded mb-4"></div>
                 <div className="w-full h-8 bg-white/10 rounded mb-2"></div>
                 <div className="w-3/4 h-8 bg-white/10 rounded mb-6"></div>
                 <div className="w-full h-px bg-white/20 my-4"></div>
                 <div className="w-1/3 h-6 bg-white/20 rounded ml-auto"></div>

                 {/* The Scan Line */}
                 <motion.div 
                    style={{ top: scanLineY }}
                    className="absolute left-0 w-full h-1 bg-[#00B8FD] shadow-[0_0_20px_2px_#00B8FD] z-20"
                 ></motion.div>

                 {/* Data Tags jumping out */}
                 <motion.div style={{ opacity: tagsOpacity, scale: tagsScale }} className="absolute top-10 -right-4 bg-[#E94C76] text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-[0_0_10px_#E94C76]">Total: 1.250€</motion.div>
                 <motion.div style={{ opacity: tagsOpacity, scale: tagsScale }} className="absolute top-24 -left-4 bg-[#1042FF] text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-[0_0_10px_#1042FF]">NIF: 123456</motion.div>
                 <motion.div style={{ opacity: tagsOpacity, scale: tagsScale }} className="absolute bottom-12 right-4 bg-[#00B8FD] text-[#00002C] text-[10px] font-bold px-2 py-1 rounded-md shadow-[0_0_10px_#00B8FD]">Vencimento: OK</motion.div>
              </motion.div>
            </div>

            {/* SECTION 4: The Global Dashboard (Bento Grid) */}
            <motion.div style={{ opacity: dashboardOpacity }} className="absolute inset-0 p-6 bg-[#00002C]/90 backdrop-blur-2xl flex flex-col pointer-events-auto shadow-[inset_0_0_100px_rgba(0,0,44,0.8)]">
              {/* Dashboard Content */}
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-extrabold text-white text-2xl tracking-tight">The Oracle</h3>
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#1042FF] to-[#E94C76] p-[1px] shadow-[0_0_20px_rgba(233,76,118,0.5)]">
                  <div className="w-full h-full bg-[#00002C]/80 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Zap size={18} className="text-[#00B8FD]" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 h-full">
                {/* Neon Line Chart (Receitas) */}
                <div className="col-span-2 bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden shadow-[inset_0_4px_20px_rgba(255,255,255,0.05)] backdrop-blur-xl">
                  <div className="flex justify-between items-start">
                     <div>
                       <p className="text-xs text-[#00B8FD] font-bold uppercase tracking-wider mb-1">Receitas Mês</p>
                       <p className="text-3xl font-black text-white">4.50M <span className="text-sm font-semibold text-[#E94C76] ml-2">↑ 12%</span></p>
                     </div>
                     <BarChart3 className="text-white/20" size={24} />
                  </div>
                  
                  <div className="mt-6 flex-1 w-full flex items-end justify-between gap-2">
                     {[20, 45, 30, 75, 55, 95, 85].map((h, i) => (
                       <div key={i} className="w-full bg-gradient-to-t from-[#00B8FD] to-[#1042FF] rounded-t-md opacity-90 shadow-[0_0_15px_rgba(0,184,253,0.6)] hover:shadow-[0_0_25px_rgba(0,184,253,1)] transition-shadow cursor-pointer" style={{ height: `${h}%` }}></div>
                     ))}
                  </div>
                </div>

                {/* Circular Progress */}
                <div className="col-span-1 bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col items-center justify-center shadow-[inset_0_4px_20px_rgba(255,255,255,0.05)] backdrop-blur-xl">
                  <Target size={28} className="text-[#E94C76] mb-3 drop-shadow-[0_0_10px_rgba(233,76,118,0.8)]" />
                  <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest mb-3">Metas de Crescimento</p>
                  <div className="relative w-24 h-24 flex items-center justify-center">
                     {/* Borda Externa Translúcida */}
                     <div className="absolute inset-0 rounded-full border-[6px] border-[#E94C76]/20"></div>
                     {/* Borda Animada/Preenchida */}
                     <div className="absolute inset-0 rounded-full border-[6px] border-[#E94C76] border-t-transparent border-r-transparent rotate-45 shadow-[0_0_20px_rgba(233,76,118,0.6)]"></div>
                     <span className="text-2xl font-black text-white drop-shadow-md">85%</span>
                  </div>
                </div>

                {/* Real Time Feed / AI Chip */}
                <div className="col-span-1 flex flex-col gap-4">
                    {/* Activity Feed Micro-Logos */}
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-4 flex flex-col items-center justify-center gap-3 shadow-[inset_0_4px_20px_rgba(255,255,255,0.05)] backdrop-blur-xl">
                        <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest text-center w-full mb-1">Live Feed</p>
                        <div className="flex -space-x-3">
                           <div className="w-10 h-10 rounded-full bg-[#25D366] border-2 border-[#00002C] flex items-center justify-center shadow-lg transform -translate-y-1"><MessageCircle size={18} className="text-white" /></div>
                           <div className="w-10 h-10 rounded-full bg-[#0088cc] border-2 border-[#00002C] flex items-center justify-center shadow-lg"><Send size={18} className="text-white" /></div>
                           <div className="w-10 h-10 rounded-full bg-[#E94C76] border-2 border-[#00002C] flex items-center justify-center shadow-lg transform translate-y-1"><FileText size={18} className="text-white" /></div>
                        </div>
                    </div>

                    {/* AI Chip 3D */}
                    <div className="flex-1 bg-gradient-to-br from-[#1042FF]/30 to-[#E94C76]/30 border border-[#1042FF]/50 rounded-3xl p-4 flex items-center justify-center relative shadow-[inset_0_0_30px_rgba(16,66,255,0.3)] backdrop-blur-2xl overflow-hidden group">
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="w-16 h-16 bg-[#00002C] border-2 border-[#00B8FD] rounded-xl shadow-[0_0_30px_#00B8FD] flex items-center justify-center transform perspective-[800px] rotate-x-12 rotate-y-[-15deg] group-hover:rotate-x-0 group-hover:rotate-y-0 transition-transform duration-500">
                          <Activity size={28} className="text-[#E94C76] drop-shadow-[0_0_15px_rgba(233,76,118,1)]" />
                        </div>
                    </div>
                </div>

              </div>
            </motion.div>

         </motion.div>
      </div>

      {/* Spacer Sections for Scroll Triggering */}
      <section className="h-screen w-full relative z-0"></section>
      <section className="h-screen w-full relative z-0"></section>
      <section className="h-screen w-full relative z-0"></section>

      {/* 
        ========================================================
        FOOTER/FINAL CTA SECTION
        ========================================================
      */}
      <section className="h-screen w-full flex flex-col items-center justify-center relative z-40 bg-[#00002C]">
         <div className="max-w-3xl mx-auto text-center space-y-8 px-6">
            <h2 className="text-4xl md:text-6xl font-black text-white">Pronto para a <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E94C76] to-[#00B8FD]">Singularidade?</span></h2>
            <p className="text-xl text-white/60">A próxima geração de software de gestão não tem formulários. Tem conversas.</p>
            <button onClick={onRegister} className="px-10 py-5 rounded-full bg-white text-[#00002C] font-black hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.3)] text-lg">
              Começar Agora
            </button>
         </div>
         {/* Minimal Footer */}
         <div className="absolute bottom-10 w-full text-center text-white/30 text-xs font-bold uppercase tracking-widest">
           &copy; 2026 FATURAI. All rights reserved.
         </div>
      </section>

    </div>
  );
};

export default LandingPage;

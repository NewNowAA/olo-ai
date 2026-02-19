import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Zap, TrendingUp, TrendingDown, Percent, ArrowRight, Play, CheckCircle2 } from 'lucide-react';
import { AuroraBackground } from './ui/aurora-background';
import { TextRotator } from './ui/text-rotator';
import { cn } from '../lib/utils';
import { BackgroundGradientAnimation } from './ui/background-gradient-animation';
import { Sparkles, BrainCircuit, ShieldCheck, Globe, Users, FileText, Check, ChevronDown, Twitter, Instagram, Linkedin, Github } from 'lucide-react';

// --- Interfaces ---
interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

// --- Components ---

// 1. Navbar
const Navbar = ({ onLogin, onRegister }: { onLogin: () => void, onRegister: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { name: "Funcionalidades", href: "#features" },
    { name: "Como Funciona", href: "#how-it-works" },
    { name: "Preços", href: "#pricing" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14"> {/* Reduced h-16 to h-14 */}
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="bg-gradient-to-br from-teal-primary to-teal-secondary p-1 rounded-lg text-white"> {/* Reduced p-1.5 to p-1 */}
              <Zap size={18} fill="currentColor" /> {/* Reduced size 20 to 18 */}
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900"> {/* Reduced text-xl to text-lg */}
              fatur<span className="text-teal-primary">AI</span>
            </span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex space-x-8">
            {links.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-slate-500 hover:text-teal-primary font-medium transition-colors text-sm"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-3"> {/* Reduced gap-4 to gap-3 */}
            <button
              onClick={onLogin}
              className="text-slate-600 hover:text-slate-900 font-semibold text-sm px-3 py-1.5"
            >
              Entrar
            </button>
            <button
              onClick={onRegister}
              className="bg-gradient-to-r from-teal-primary to-teal-secondary text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg shadow-teal-primary/20 hover:shadow-teal-primary/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              Começar Grátis
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-500 hover:text-slate-900 focus:outline-none"
            >
              {isOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-slate-100 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              {links.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:text-teal-primary hover:bg-slate-50"
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-4 space-y-3">
                <button
                  onClick={onLogin}
                  className="w-full text-center text-slate-600 font-semibold py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-sm"
                >
                  Entrar
                </button>
                <button
                  onClick={onRegister}
                  className="w-full text-center bg-gradient-to-r from-teal-primary to-teal-secondary text-white font-bold py-2.5 rounded-xl shadow-md text-sm"
                >
                  Começar Grátis
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// 2. Hero Section
const HeroSection = ({ onRegister }: { onRegister: () => void }) => {
  return (
    <div className="relative w-full">
      <AuroraBackground className="h-auto min-h-[85vh] py-12 lg:py-0"> {/* Reduced py-20 to py-12, 90vh to 85vh */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full h-full flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12"> {/* Reduced gap */}
          
          {/* Left Column: Content */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-1 text-center lg:text-left space-y-6"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur border border-teal-primary/20 shadow-sm mx-auto lg:mx-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-secondary"></span>
              </span>
              <span className="text-[10px] font-bold text-teal-dark tracking-wide uppercase">
                Integração Telegram activa
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              As suas faturas,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-primary to-[#2e8ba6]">
                <TextRotator
                  words={["no piloto automático.", "sem nenhum papel.", "com IA avançada."]}
                />
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base text-slate-500 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Tire foto, envie pelo Telegram, e deixe a IA organizar tudo. Dashboard, metas e relatórios — sem tocar num papel.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <button
                onClick={onRegister}
                className="group relative px-6 py-3 rounded-full font-bold text-white bg-gradient-to-r from-teal-primary to-teal-secondary shadow-lg shadow-teal-primary/30 hover:shadow-teal-primary/50 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden text-sm"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Começar 30 dias Grátis <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
                {/* Ripple Effect Element (simplified) */}
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
              </button>
              
              <a
                href="#features"
                className="px-6 py-3 rounded-full font-bold text-slate-600 border border-slate-200 hover:border-teal-primary/50 hover:bg-slate-50 hover:text-teal-dark transition-all duration-300 flex items-center gap-2 group text-sm"
              >
                <Play size={14} className="fill-current group-hover:scale-110 transition-transform" />
                Ver como funciona
              </a>
            </div>

            {/* Micro-copy & Social Proof */}
            <div className="space-y-3 pt-2">
              <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">
                SEM CARTÃO DE CRÉDITO • SETUP EM 2 MINUTOS
              </p>
              
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center overflow-hidden">
                       <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <div className="text-xs font-semibold text-slate-500">
                  Junte-se aos primeiros utilizadores
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Dashboard Mockup */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex-1 w-full max-w-[500px] perspective-1000"
          >
            <div className="relative transform rotate-y-[-5deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-700 ease-out preserve-3d">
              
              {/* Main Dashboard Card */}
              <div className="relative bg-white rounded-2xl shadow-xl border border-slate-100 p-5 z-20 overflow-hidden">
                {/* Header Mock */}
                <div className="flex justify-between items-center mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse"></div>
                    <div className="space-y-1.5">
                       <div className="h-2.5 w-20 bg-slate-100 rounded-full"></div>
                       <div className="h-1.5 w-12 bg-slate-50 rounded-full"></div>
                    </div>
                  </div>
                  <div className="h-6 w-6 rounded-full bg-slate-50"></div>
                </div>

                {/* Balance Section */}
                <div className="mb-6 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Saldo Total</p>
                  <p className="text-2xl font-extrabold text-slate-900">4.500.250 <span className="text-sm text-slate-400 font-normal">Kz</span></p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-teal-primary/5 border border-teal-primary/10">
                    <div className="flex items-center gap-1.5 mb-1.5 text-teal-dark">
                      <TrendingUp size={14} />
                      <span className="text-[10px] font-bold uppercase">Receita</span>
                    </div>
                    <p className="text-base font-bold text-slate-800">1.25M Kz</p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                    <div className="flex items-center gap-1.5 mb-1.5 text-red-500">
                      <TrendingDown size={14} />
                      <span className="text-[10px] font-bold uppercase">Despesa</span>
                    </div>
                    <p className="text-base font-bold text-slate-800">890K Kz</p>
                  </div>
                </div>

                {/* Chart Mock */}
                <div className="flex items-end justify-between gap-2 h-20 mt-2">
                  {[40, 70, 45, 90, 65, 80].map((h, i) => (
                    <div key={i} className="w-full bg-slate-100 rounded-t-sm relative group overflow-hidden" style={{ height: `${h}%` }}>
                       <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-teal-primary to-teal-secondary h-0 group-hover:h-full transition-all duration-500 ease-out opacity-80"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating Element: Processed Badge */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="absolute -right-4 top-8 bg-white px-3 py-2 rounded-lg shadow-lg border border-teal-primary/20 z-30 flex items-center gap-2 animate-float"
              >
                  <div className="bg-green-100 p-1 rounded-full text-green-600">
                    <CheckCircle2 size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">Status</p>
                    <p className="text-xs font-bold text-slate-800">Fatura Processada</p>
                  </div>
              </motion.div>

              {/* Floating Element: Profit */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="absolute -left-6 bottom-16 bg-white px-3 py-2 rounded-lg shadow-lg border border-teal-primary/20 z-30 flex items-center gap-2 animate-float-delayed"
              >
                  <div className="bg-blue-100 p-1 rounded-full text-blue-600">
                    <Percent size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">Margem</p>
                    <p className="text-xs font-bold text-slate-800">+ 32% este mês</p>
                  </div>
              </motion.div>

              {/* Decor: Background Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-teal-primary/20 blur-[80px] -z-10 rounded-full pointer-events-none"></div>
            </div>
          </motion.div>

        </div>
      </AuroraBackground>
    </div>
  );
};

// 3. Trust Bar Section
import { LogoMarquee } from './ui/logo-marquee';

const TrustBar = () => {
  const logos = [
    { name: "TechAngola", icon: <Zap size={20} /> },
    { name: "Kwanza Pay", icon: <TrendingUp size={20} /> },
    { name: "Unitel (Parceiro)", icon: <CheckCircle2 size={20} /> },
    { name: "BFA App", icon: <Percent size={20} /> },
    { name: "NCR Angola", icon: <Play size={20} /> },
  ];

  return (
    <div className="py-10 border-b border-slate-100 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6">
          Empresas que confiam na faturAI
        </p>
        <LogoMarquee logos={logos} speed={40} />
      </div>
    </div>
  );
};

// 4. Problem Section (Pain Points)
import { MessageCircle, FileSpreadsheet, EyeOff, Camera, Send, Mail, UploadCloud } from 'lucide-react';

const ProblemSection = () => {
  const problems = [
    {
      icon: <MessageCircle size={28} className="text-teal-primary" />, 
      title: "Caos no WhatsApp",
      text: "Faturas perdidas em conversas, fotos sem qualidade e zero organização. Onde está aquele recibo de Março?"
    },
    {
      icon: <FileSpreadsheet size={28} className="text-teal-primary" />,
      title: "Erros de Cálculo",
      text: "Excel com fórmulas quebradas. Um zero a menos e o seu lucro mensal desaparece sem você notar."
    },
    {
      icon: <EyeOff size={28} className="text-teal-primary" />,
      title: "Sem Visibilidade",
      text: "Quanto lucrou este mês? Quem lhe deve dinheiro? Sem dados, você está a gerir o negócio com uma venda nos olhos."
    }
  ];

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Ainda gere faturas no <span className="text-teal-primary">Excel</span> ou <span className="text-teal-primary">Papel</span>?
          </h2>
          <p className="text-slate-500 text-lg">
            O método manual não só é lento, como custa dinheiro ao seu negócio todos os dias.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
              className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-teal-primary/30 hover:shadow-xl hover:shadow-teal-primary/5 transition-all duration-300 group"
            >
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform duration-300 border border-slate-100">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
              <p className="text-slate-500 leading-relaxed">
                {item.text}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
      
      {/* Decor */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-slate-50 to-transparent pointer-events-none"></div>
    </section>
  );
};

// 5. How It Works Section
const HowItWorksSection = () => {
    return (
      <section className="py-24 bg-slate-50 relative overflow-hidden" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
              Do papel para o digital em <span className="text-teal-primary">3 segundos</span>
            </h2>
            <p className="text-slate-500 text-lg">
              Sem logins complicados, sem formulários infinitos. Apenas envie uma foto.
            </p>
          </div>
  
          <div className="relative grid md:grid-cols-3 gap-8">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-teal-primary/20 via-teal-primary/50 to-teal-primary/20 -z-10"></div>
  
            {[
              {
                icon: <Camera size={32} className="text-white" />,
                step: "01",
                title: "Tire uma Foto",
                desc: "Fotografe a fatura ou recibo com o seu telemóvel.",
                color: "bg-teal-primary"
              },
              {
                icon: <Send size={32} className="text-white" />,
                step: "02",
                title: "Envie no Telegram",
                desc: "Encaminhe para o nosso bot como se fosse um amigo.",
                color: "bg-blue-500"
              },
              {
                icon: <FileText size={32} className="text-white" />,
                step: "03",
                title: "Relatórios Prontos",
                desc: "A IA extrai os dados e atualiza o seu dashboard.",
                color: "bg-slate-900"
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="relative flex flex-col items-center text-center"
              >
                <div className={`w-20 h-20 rounded-2xl ${item.color} shadow-lg shadow-teal-primary/20 flex items-center justify-center mb-6 relative z-10 group hover:scale-110 transition-transform duration-300`}>
                  {item.icon}
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-xs font-bold text-slate-900 shadow-sm">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500 max-w-xs">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  };
  
  // 6. Channels Section (Omnichannel)
  const ChannelsSection = () => {
    return (
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left: Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
                Omnicanal: Envie por onde <span className="text-teal-primary">preferir</span>.
              </h2>
              <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                Não mude a sua rotina. A faturAI integra-se nos apps que você já usa todos os dias. 
                Seja WhatsApp, Telegram ou Email, nós estamos lá.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: "Telegram Bot", icon: <Send size={20} />, active: true },
                  { name: "WhatsApp (Breve)", icon: <MessageCircle size={20} />, active: false },
                  { name: "Email Forward", icon: <Mail size={20} />, active: false },
                  { name: "Upload Direto", icon: <UploadCloud size={20} />, active: true },
                ].map((channel, i) => (
                  <div key={i} className={`flex items-center gap-3 p-4 rounded-xl border ${channel.active ? 'border-teal-primary/30 bg-teal-primary/5' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
                    <div className={`p-2 rounded-lg ${channel.active ? 'bg-teal-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {channel.icon}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{channel.name}</p>
                      <p className="text-xs text-slate-500">{channel.active ? 'Disponível' : 'Em breve'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
  
            {/* Right: Visual Integration */}
            <motion.div
               initial={{ opacity: 0, scale: 0.9 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-teal-primary/20 to-teal-secondary/20 rounded-full blur-[100px] -z-10"></div>
              
              <div className="relative bg-slate-900 rounded-3xl p-2 shadow-2xl border border-slate-800">
                  <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800">
                      {/* Fake Telegram Interface */}
                      <div className="bg-slate-900 p-4 flex items-center gap-3 border-b border-slate-800">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-primary to-teal-secondary flex items-center justify-center text-white font-bold">
                              AI
                          </div>
                          <div>
                              <p className="text-white font-bold text-sm">faturAI Bot</p>
                              <p className="text-teal-400 text-xs">bot</p>
                          </div>
                      </div>
                      <div className="p-4 space-y-4 h-[300px] overflow-y-auto bg-[url('https://web.telegram.org/img/bg_0.png')] bg-cover">
                          {/* User Message */}
                          <div className="flex justify-end">
                              <div className="bg-teal-600 text-white p-3 rounded-2xl rounded-tr-none max-w-[80%] text-sm shadow-sm">
                                  <div className="flex items-center gap-2 mb-2 bg-black/10 p-2 rounded-lg">
                                      <FileText size={16} />
                                      <span className="text-xs truncate">Fatura_Restaurante.jpg</span>
                                  </div>
                                  Processa esta fatura por favor.
                              </div>
                          </div>
                          {/* Bot Response */}
                          <div className="flex justify-start">
                              <div className="bg-slate-800 text-slate-200 p-3 rounded-2xl rounded-tl-none max-w-[80%] text-sm shadow-sm border border-slate-700">
                                  <p className="mb-2">✅ <span className="font-bold text-white">Fatura Processada!</span></p>
                                  <div className="space-y-1 text-xs text-slate-400">
                                      <div className="flex justify-between border-b border-slate-700 pb-1">
                                          <span>Total:</span>
                                          <span className="text-white font-mono">12.500 Kz</span>
                                      </div>
                                      <div className="flex justify-between border-b border-slate-700 pb-1">
                                          <span>Data:</span>
                                          <span className="text-white">Hoje, 14:30</span>
                                      </div>
                                      <div className="flex justify-between">
                                          <span>Categoria:</span>
                                          <span className="text-teal-400">Alimentação</span>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
  
              {/* Floating Icons */}
              <div className="absolute -top-6 -right-6 w-16 h-16 bg-[#25D366] rounded-2xl flex items-center justify-center shadow-xl animate-bounce">
                  <MessageCircle size={32} className="text-white" />
              </div>
              <div className="absolute -bottom-6 -left-6 w-14 h-14 bg-[#0088cc] rounded-2xl flex items-center justify-center shadow-xl animate-pulse">
                  <Send size={28} className="text-white" />
              </div>
  
            </motion.div>
          </div>
        </div>
      </section>
    );
  };
// 7. AI Lumea Section
const LumeaSection = () => {
    return (
      <section className="relative w-full py-24 bg-slate-900 overflow-hidden">
        <BackgroundGradientAnimation
            gradientBackgroundStart="rgb(15, 23, 42)" 
            gradientBackgroundEnd="rgb(15, 23, 42)"
            firstColor="115, 198, 223"
            secondColor="46, 139, 166"
            thirdColor="139, 215, 191"
            size="80%"
            className="absolute inset-0 opacity-40"
        />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-16">
                
                {/* Left: Text */}
                <div className="flex-1 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-primary/10 border border-teal-primary/20 text-teal-primary text-xs font-bold uppercase tracking-wider mb-6">
                        <Sparkles size={14} />
                        Inteligência Artificial
                    </div>
                    <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight">
                        Conheça a <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-primary to-teal-secondary">Lumea</span>.
                        <br />
                        A sua analista financeira pessoal.
                    </h2>
                    <p className="text-slate-400 text-lg mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">
                        Ela não dorme, não erra e está sempre pronta para responder: "Quanto lucrei hoje?", "Quem é o meu melhor cliente?", "Previsão para o próximo mês?".
                    </p>
                    
                    <button className="px-8 py-4 rounded-full bg-white text-slate-900 font-bold hover:bg-teal-50 transition-colors flex items-center gap-2 mx-auto lg:mx-0 shadow-[0_0_40px_-10px_rgba(115,198,223,0.5)]">
                        <BrainCircuit size={20} className="text-teal-primary" />
                        Falar com a Lumea
                    </button>
                </div>

                {/* Right: Code/Chat Interface Mockup */}
                <div className="flex-1 w-full max-w-xl">
                    <div className="bg-[#1e1e1e] rounded-xl overflow-hidden shadow-2xl border border-slate-700 font-mono text-sm relative group">
                        {/* OS Header */}
                        <div className="bg-[#2d2d2d] px-4 py-3 flex items-center gap-2 border-b border-black/50">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                                <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                            </div>
                            <div className="mx-auto text-slate-400 text-xs">lumea_analysis.ts — AI Agent</div>
                        </div>

                        {/* Editor Content */}
                        <div className="p-6 text-slate-300 space-y-4">
                            <div className="flex gap-3">
                                <span className="text-slate-600 select-none">1</span>
                                <div>
                                    <span className="text-[#c586c0]">const</span> <span className="text-[#9cdcfe]">userQuery</span> = <span className="text-[#ce9178]">"Resumo de hoje?"</span>;
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <span className="text-slate-600 select-none">2</span>
                                <div>
                                    <span className="text-[#c586c0]">await</span> <span className="text-[#4ec9b0]">Lumea</span>.<span className="text-[#dcdcaa]">analyze</span>(userQuery);
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <span className="text-slate-600 select-none">3</span>
                                <div className="text-slate-500">// Processing data from 12 invoices...</div>
                            </div>
                            
                            {/* Animated Response Typing */}
                            <div className="mt-4 p-4 bg-[#2d2d2d]/50 rounded border-l-2 border-teal-primary">
                                <div className="text-teal-primary mb-1 text-xs uppercase tracking-wide font-bold">Lumea Response</div>
                                <p className="text-slate-200 leading-relaxed">
                                    Hoje a receita foi de <span className="text-[#4ec9b0] font-bold">145.000 Kz</span>. 😎
                                    <br />
                                    Isso é <span className="text-[#dcdcaa] font-bold">+15%</span> acima da sua média diária.
                                    <br />
                                    O produto mais vendido foi "Consultoria TI".
                                </p>
                                <span className="inline-block w-2 H-4 bg-teal-primary animate-pulse mt-1">_</span>
                            </div>
                        </div>
                        
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-teal-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    </div>
                </div>

            </div>
        </div>
      </section>
    );
};

// 8. Features Section
const FeaturesSection = () => {
    return (
        <section className="py-24 bg-slate-50" id="features">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
                        Tudo o que precisa para <span className="text-teal-primary">crescer</span>.
                    </h2>
                    <p className="text-slate-500 text-lg">
                        Ferramentas poderosas numa interface simples. Feito para empreendedores, não contabilistas.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 auto-rows-[minmax(200px,auto)]">
                    
                    {/* Large Card: OCR */}
                    <div className="md:col-span-2 md:row-span-2 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-teal-primary/5 transition-all overflow-hidden relative group">
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-primary mb-6">
                                <Camera size={24} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-3">Reconhecimento Inteligente (OCR)</h3>
                            <p className="text-slate-500 text-lg max-w-md">
                                A nossa tecnologia lê faturas angolanas com precisão. Identifica NIF, data, itens e totais automaticamente, mesmo em fotos tremidas.
                            </p>
                        </div>
                        <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-50 group-hover:scale-105 transition-transform duration-500">
                             <img 
                                src="https://images.unsplash.com/photo-1586769852044-692d6e3703f0?auto=format&fit=crop&q=80&w=800" 
                                alt="OCR Scanning" 
                                className="w-full h-full object-cover object-left mask-linear-fade"
                                style={{ maskImage: 'linear-gradient(to right, transparent, black)' }}
                             />
                        </div>
                    </div>

                    {/* Small Card: Multi-user */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                            <Users size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Multi-usuário</h3>
                        <p className="text-slate-500 text-sm">Convide a sua equipa e defina permissões. O contabilista acessa só o que precisa.</p>
                    </div>

                    {/* Small Card: Global Access */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all">
                        <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 mb-4">
                            <Globe size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Acesso Global</h3>
                        <p className="text-slate-500 text-sm">Acesse os seus dados de qualquer lugar, em qualquer dispositivo. Tudo na nuvem.</p>
                    </div>

                    {/* Medium Card: Reports */}
                    <div className="md:col-span-1 bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-sm hover:shadow-lg transition-all text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-teal-primary mb-4">
                                <FileText size={20} />
                            </div>
                            <h3 className="text-lg font-bold mb-2">Relatórios em PDF</h3>
                            <p className="text-slate-400 text-sm">Exporte relatórios mensais profissionais com um clique. Prontos para enviar à AGT.</p>
                        </div>
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <FileText size={120} />
                        </div>
                    </div>

                     {/* Small Card: Security */}
                     <div className="md:col-span-2 bg-gradient-to-br from-teal-primary/5 to-teal-secondary/5 rounded-3xl p-6 border border-teal-primary/10 shadow-sm hover:shadow-lg transition-all flex items-center gap-6">
                        <div className="flex-1">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-teal-600 mb-4 shadow-sm">
                                <ShieldCheck size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Segurança Bancária</h3>
                            <p className="text-slate-500 text-sm">Seus dados são criptografados com padrões de nível bancário. Backups automáticos diários.</p>
                        </div>
                         <div className="hidden sm:block">
                            <ShieldCheck size={80} className="text-teal-primary/10" />
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

// 9. Pricing Section
const PricingSection = () => {
    const [isAnnual, setIsAnnual] = useState(true);
  
    return (
      <section className="py-24 bg-white" id="pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6 tracking-tight">
              Investimento que se paga <span className="text-teal-primary">sozinho</span>.
            </h2>
            <p className="text-slate-500 text-lg mb-8">
              Cancele quando quiser. Sem contratos de fidelização.
            </p>
            
            {/* Toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className={`text-sm font-bold ${!isAnnual ? 'text-slate-900' : 'text-slate-400'}`}>Mensal</span>
              <button 
                onClick={() => setIsAnnual(!isAnnual)}
                className="relative w-14 h-8 bg-slate-200 rounded-full p-1 transition-colors duration-300 focus:outline-none"
              >
                <div 
                    className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isAnnual ? 'translate-x-6' : 'translate-x-0'}`}
                />
              </button>
              <span className={`text-sm font-bold ${isAnnual ? 'text-slate-900' : 'text-slate-400'}`}>
                Anual <span className="text-teal-primary text-xs ml-1 font-extrabold">-20%</span>
              </span>
            </div>
          </div>
  
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            
            {/* Free Tier */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Starter</h3>
              <p className="text-slate-500 text-sm mb-6">Para quem está a começar.</p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-slate-900">0</span>
                <span className="text-slate-500 font-medium"> Kz/mês</span>
              </div>
              <button className="w-full py-3 rounded-xl bg-white border border-slate-200 text-slate-900 font-bold hover:bg-slate-50 transition-colors mb-8">
                Começar Grátis
              </button>
              <ul className="space-y-4">
                {[
                  "Até 50 faturas/mês",
                  "1 Utilizador",
                  "Digitalização Básica",
                  "Retenção de 3 meses"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-600 text-sm">
                    <Check size={16} className="text-teal-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
  
            {/* Pro Tier - Highlighted */}
            <div className="p-8 rounded-3xl bg-slate-900 text-white relative transform md:-translate-y-4 shadow-2xl shadow-teal-primary/20 border border-slate-700">
               <div className="absolute top-0 center left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-teal-primary to-teal-secondary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Mais Popular
               </div>
              <h3 className="text-xl font-bold mb-2">Pro</h3>
              <p className="text-slate-400 text-sm mb-6">Para empresas em crescimento.</p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-white">{isAnnual ? '15.000' : '19.000'}</span>
                <span className="text-slate-400 font-medium"> Kz/mês</span>
              </div>
              <button className="w-full py-3 rounded-xl bg-teal-primary text-white font-bold hover:bg-teal-600 transition-colors mb-8 shadow-lg shadow-teal-primary/25">
                Experimentar Pro
              </button>
              <ul className="space-y-4">
                {[
                  "Faturas Ilimitadas",
                  "Até 5 Utilizadores",
                  "IA Lumea Avançada",
                  "Exportação SAF-T (AGT)",
                  "Suporte Prioritário"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300 text-sm">
                    <Check size={16} className="text-teal-400" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
  
            {/* Enterprise Tier */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Enterprise</h3>
              <p className="text-slate-500 text-sm mb-6">Para grandes operações.</p>
              <div className="mb-6">
                <span className="text-3xl font-extrabold text-slate-900">Sob Consulta</span>
              </div>
              <button className="w-full py-3 rounded-xl bg-white border border-slate-200 text-slate-900 font-bold hover:bg-slate-50 transition-colors mb-8">
                Falar com Vendas
              </button>
              <ul className="space-y-4">
                {[
                  "Utilizadores Ilimitados",
                  "API Dedicada",
                  "Gestor de Conta",
                  "SLA Personalizado",
                  "Integração ERP Custom"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-600 text-sm">
                    <Check size={16} className="text-teal-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
  
          </div>
        </div>
      </section>
    );
  };

// 10. FAQ Section
const FAQSection = () => {
  const faqs = [
    {
      q: "Preciso de cartão de crédito?",
      a: "Não. Pode começar com o plano Starter totalmente grátis. Para o plano Pro, aceitamos transferência bancária ou Multicaixa Express."
    },
    {
      q: "Funciona com a AGT?",
      a: "Sim. Exportamos o ficheiro SAF-T (AO) conforme exigido pela AGT. Estamos em processo de certificação final."
    },
    {
      q: "Posso cancelar a qualquer momento?",
      a: "Sim. Não há contratos de fidelização. Pode cancelar a sua subscrição a qualquer momento no dashboard."
    },
    {
      q: "Os meus dados estão seguros?",
      a: "Absolutamente. Usamos encriptação de nível bancário e backups diários. Os seus dados são seus e nunca serão vendidos."
    }
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24 bg-slate-50" id="faq">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-12">
          Perguntas Frequentes
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
              >
                <span className="font-bold text-slate-900">{faq.q}</span>
                <span className={`transform transition-transform duration-300 ${openIndex === idx ? 'rotate-180' : ''}`}>
                  <ChevronDown size={20} className="text-slate-400" />
                </span>
              </button>
              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-6 text-slate-500 leading-relaxed text-sm">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// 11. Footer Section
const FooterSection = () => {
    return (
        <footer className="bg-slate-900 pt-20 pb-10 text-white border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="bg-gradient-to-br from-teal-primary to-teal-secondary p-1 rounded-lg text-white">
                                <Zap size={18} fill="currentColor" />
                            </div>
                            <span className="font-extrabold text-xl tracking-tight text-white">
                                fatur<span className="text-teal-primary">AI</span>
                            </span>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">
                            A primeira plataforma de faturação inteligente de Angola. Automatize, analise e cresça.
                        </p>
                        <div className="flex gap-4">
                            {[Twitter, Instagram, Linkedin, Github].map((Icon, i) => (
                                <a key={i} href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-teal-primary hover:text-white transition-all transform hover:scale-110">
                                    <Icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="font-bold text-white mb-6">Produto</h4>
                        <ul className="space-y-4">
                            {["Funcionalidades", "Preços", "Segurança", "Changelog"].map((item) => (
                                <li key={item}>
                                    <a href="#" className="text-slate-400 hover:text-teal-primary text-sm transition-colors">{item}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-6">Empresa</h4>
                        <ul className="space-y-4">
                            {["Sobre Nós", "Carreiras", "Blog", "Contacto"].map((item) => (
                                <li key={item}>
                                    <a href="#" className="text-slate-400 hover:text-teal-primary text-sm transition-colors">{item}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-6">Legal</h4>
                        <ul className="space-y-4">
                            {["Termos de Uso", "Privacidade", "Cookies", "Licença"].map((item) => (
                                <li key={item}>
                                    <a href="#" className="text-slate-400 hover:text-teal-primary text-sm transition-colors">{item}</a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                
                <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-500 text-sm">
                        © 2024 FaturAI Angola. Todos os direitos reservados.
                    </p>
                    <p className="text-slate-500 text-sm flex items-center gap-1">
                        Feito com <span className="text-red-500 animate-pulse">❤</span> em Luanda
                    </p>
                </div>
            </div>
        </footer>
    );
};

export const LandingPage = ({ onLogin, onRegister }: LandingPageProps) => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-teal-primary/20 selection:text-teal-dark">
      
      {/* 1. Navbar */}
      <Navbar onLogin={onLogin} onRegister={onRegister} />

      {/* 2. Hero Section */}
      <HeroSection onRegister={onRegister} />

      {/* 3. Trust Bar */}
      <TrustBar />

      {/* 4. Problem Section */}
      <ProblemSection />

      {/* 5. How It Works Section */}
      <HowItWorksSection />

      {/* 6. Channels Section */}
      <ChannelsSection />

      {/* 7. AI Lumea Section */}
      <LumeaSection />

      {/* 8. Features Section */}
      <FeaturesSection />

      {/* 9. Pricing Section */}
      <PricingSection />

      {/* Placeholder for next sections */}
      {/* 10. FAQ Section */}
      <FAQSection />

      {/* 11. Final CTA & Footer */}
      <FooterSection />

    </div>
  );
};

export default LandingPage;

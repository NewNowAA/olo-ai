import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Zap, TrendingUp, TrendingDown, Percent, ArrowRight, Play, CheckCircle2 } from 'lucide-react';
import { AuroraBackground } from './ui/aurora-background';
import { TextRotator } from './ui/text-rotator';
import { cn } from '../lib/utils';

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
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="bg-gradient-to-br from-teal-primary to-teal-secondary p-1.5 rounded-lg text-white">
              <Zap size={20} fill="currentColor" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
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
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={onLogin}
              className="text-slate-600 hover:text-slate-900 font-semibold text-sm px-4 py-2"
            >
              Entrar
            </button>
            <button
              onClick={onRegister}
              className="bg-gradient-to-r from-teal-primary to-teal-secondary text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-teal-primary/20 hover:shadow-teal-primary/40 hover:-translate-y-0.5 transition-all duration-300"
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
              {isOpen ? <X size={24} /> : <Menu size={24} />}
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
                  className="block px-3 py-3 rounded-md text-base font-medium text-slate-600 hover:text-teal-primary hover:bg-slate-50"
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-4 space-y-3">
                <button
                  onClick={onLogin}
                  className="w-full text-center text-slate-600 font-semibold py-3 border border-slate-200 rounded-xl hover:bg-slate-50"
                >
                  Entrar
                </button>
                <button
                  onClick={onRegister}
                  className="w-full text-center bg-gradient-to-r from-teal-primary to-teal-secondary text-white font-bold py-3 rounded-xl shadow-md"
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
      <AuroraBackground className="h-auto min-h-[90vh] py-20 lg:py-0">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full h-full flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16">
          
          {/* Left Column: Content */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-1 text-center lg:text-left space-y-8"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur border border-teal-primary/20 shadow-sm mx-auto lg:mx-0">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-secondary"></span>
              </span>
              <span className="text-xs font-semibold text-teal-dark tracking-wide uppercase">
                Integração Telegram activa
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              As suas faturas,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-primary to-[#2e8ba6]">
                <TextRotator
                  words={["no piloto automático.", "sem nenhum papel.", "com IA avançada."]}
                />
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-slate-500 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Tire foto, envie pelo Telegram, e deixe a IA organizar tudo. Dashboard, metas e relatórios — sem tocar num papel.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={onRegister}
                className="group relative px-8 py-4 rounded-full font-bold text-white bg-gradient-to-r from-teal-primary to-teal-secondary shadow-lg shadow-teal-primary/30 hover:shadow-teal-primary/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Começar 30 dias Grátis <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </span>
                {/* Ripple Effect Element (simplified) */}
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
              </button>
              
              <a
                href="#features"
                className="px-8 py-4 rounded-full font-bold text-slate-600 border border-slate-200 hover:border-teal-primary/50 hover:bg-slate-50 hover:text-teal-dark transition-all duration-300 flex items-center gap-2 group"
              >
                <Play size={16} className="fill-current group-hover:scale-110 transition-transform" />
                Ver como funciona
              </a>
            </div>

            {/* Micro-copy & Social Proof */}
            <div className="space-y-4 pt-4">
              <p className="text-xs text-slate-400 font-medium tracking-wide">
                SEM CARTÃO DE CRÉDITO • SETUP EM 2 MINUTOS
              </p>
              
              <div className="flex items-center justify-center lg:justify-start gap-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center overflow-hidden">
                       <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <div className="text-sm font-medium text-slate-600">
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
            className="flex-1 w-full max-w-[600px] perspective-1000"
          >
            <div className="relative transform rotate-y-[-5deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-700 ease-out preserve-3d">
              
              {/* Main Dashboard Card */}
              <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 z-20 overflow-hidden">
                {/* Header Mock */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse"></div>
                    <div className="space-y-2">
                       <div className="h-3 w-24 bg-slate-100 rounded-full"></div>
                       <div className="h-2 w-16 bg-slate-50 rounded-full"></div>
                    </div>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-slate-50"></div>
                </div>

                {/* Balance Section */}
                <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider">Saldo Total</p>
                  <p className="text-3xl font-extrabold text-slate-900">4.500.250 <span className="text-lg text-slate-400 font-normal">Kz</span></p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 rounded-xl bg-teal-primary/5 border border-teal-primary/10">
                    <div className="flex items-center gap-2 mb-2 text-teal-dark">
                      <TrendingUp size={16} />
                      <span className="text-xs font-bold">Receita</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800">1.25M Kz</p>
                  </div>
                  <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                    <div className="flex items-center gap-2 mb-2 text-red-500">
                      <TrendingDown size={16} />
                      <span className="text-xs font-bold">Despesa</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800">890K Kz</p>
                  </div>
                </div>

                {/* Chart Mock */}
                <div className="flex items-end justify-between gap-2 h-24 mt-4">
                  {[40, 70, 45, 90, 65, 80].map((h, i) => (
                    <div key={i} className="w-full bg-slate-100 rounded-t-md relative group overflow-hidden" style={{ height: `${h}%` }}>
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
                className="absolute -right-6 top-12 bg-white px-4 py-3 rounded-xl shadow-xl border border-teal-primary/20 z-30 flex items-center gap-3 animate-float"
              >
                  <div className="bg-green-100 p-1.5 rounded-full text-green-600">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Status</p>
                    <p className="text-sm font-bold text-slate-800">Fatura Processada</p>
                  </div>
              </motion.div>

              {/* Floating Element: Profit */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="absolute -left-8 bottom-20 bg-white px-4 py-3 rounded-xl shadow-xl border border-teal-primary/20 z-30 flex items-center gap-3 animate-float-delayed"
              >
                  <div className="bg-blue-100 p-1.5 rounded-full text-blue-600">
                    <Percent size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Margem de Lucro</p>
                    <p className="text-sm font-bold text-slate-800">+ 32% este mês</p>
                  </div>
              </motion.div>

              {/* Decor: Background Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-teal-primary/20 blur-[100px] -z-10 rounded-full pointer-events-none"></div>
            </div>
          </motion.div>

        </div>
      </AuroraBackground>
    </div>
  );
};

// --- Main LandingPage Component ---
export const LandingPage = ({ onLogin, onRegister }: LandingPageProps) => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-teal-primary/20 selection:text-teal-dark">
      
      {/* 1. Navbar */}
      <Navbar onLogin={onLogin} onRegister={onRegister} />

      {/* 2. Hero Section */}
      <HeroSection onRegister={onRegister} />

      {/* Placeholder for next sections */}
      <div className="py-20 text-center text-slate-400 text-sm border-t border-slate-100">
        [More sections coming soon...]
      </div>

    </div>
  );
};

export default LandingPage;

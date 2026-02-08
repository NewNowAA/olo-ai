import React from 'react';
import { ArrowLeft, Lock, Mail } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
  onRegister: () => void;
  onBack: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onRegister, onBack }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#73c6df]/20 rounded-full blur-[120px] animate-float"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#8bd7bf]/20 rounded-full blur-[120px] animate-float-delayed"></div>
      </div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative z-10">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-800 text-sm font-bold mb-10 transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Voltar à página inicial
        </button>

        <div className="mb-10 text-center md:text-left">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">Bem-vindo</h2>
            <p className="text-slate-500 font-medium">Introduza os seus dados para aceder.</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onLogin(); }} className="space-y-6">
            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Email ou Telemóvel</label>
                <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#73c6df] focus:bg-white transition-all shadow-sm"
                        placeholder="exemplo@email.com"
                    />
                </div>
            </div>

            <div>
                <div className="flex justify-between mb-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Palavra-passe</label>
                    <a href="#" className="text-xs text-[#2e8ba6] hover:underline font-bold">Esqueceu-se?</a>
                </div>
                <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="password" 
                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#73c6df] focus:bg-white transition-all shadow-sm"
                        placeholder="••••••••"
                    />
                </div>
            </div>

            <button 
                type="submit"
                className="w-full py-4 bg-[#0F172A] text-white font-extrabold rounded-xl hover:bg-[#73c6df] hover:shadow-lg hover:shadow-[#73c6df]/30 transition-all transform hover:-translate-y-1 mt-4"
            >
                Entrar
            </button>
        </form>

        <div className="mt-10 text-center border-t border-slate-100 pt-8">
            <p className="text-sm text-slate-500 font-medium">
                Ainda não tem conta? <button onClick={onRegister} className="text-[#2e8ba6] font-bold hover:underline">Criar conta</button>
            </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
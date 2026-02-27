import React, { useState } from 'react';
import { ArrowLeft, Lock, Mail, Loader2, AlertCircle, Zap } from 'lucide-react';
import { loginUser } from '../services/auth/authService';

interface LoginPageProps {
    onLogin: () => void;
    onRegister: () => void;
    onBack: () => void;
    onForgotPassword: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onRegister, onBack, onForgotPassword }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (!email || !password) {
            setError('Por favor, preencha todos os campos');
            setIsLoading(false);
            return;
        }

        try {
            const result = await loginUser({ email, password });

            if (result.success) {
                onLogin(); // App.tsx will also react to auth state change
            } else {
                setError(result.error || 'Erro ao iniciar sessão');
            }
        } catch (err) {
            setError('Ocorreu um erro inesperado');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#00002C] flex items-center justify-center p-4 font-sans relative overflow-hidden selection:bg-[#E94C76] selection:text-white">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#1042FF]/20 rounded-full blur-[120px] animate-float"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#E94C76]/15 rounded-full blur-[120px] animate-float-delayed"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00B8FD]/20 to-transparent"></div>
            </div>

            <div className="w-full max-w-md bg-[#00002C]/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-[0_0_50px_rgba(0,0,44,0.8)] relative z-10">
                {/* Brand Header */}
                <div className="flex justify-center mb-8">
                     <div className="flex items-center gap-2">
                        <div className="bg-gradient-to-br from-[#1042FF] to-[#00B8FD] p-1.5 rounded-lg text-white shadow-[0_0_15px_rgba(16,66,255,0.5)]">
                          <Zap size={20} fill="currentColor" />
                        </div>
                        <span className="font-extrabold text-xl tracking-tight text-white">
                          FATUR<span className="text-[#00B8FD]">AI</span>
                        </span>
                     </div>
                </div>

                <button onClick={onBack} className="flex items-center gap-2 text-white/50 hover:text-white text-sm font-bold mb-10 transition-colors group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Voltar à página inicial
                </button>

                <div className="mb-10 text-center md:text-left">
                    <h2 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Bem-vindo de volta</h2>
                    <p className="text-white/60 font-medium">Introduza os seus dados para aceder.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-[#E94C76]/10 border border-[#E94C76]/30 rounded-xl flex items-center gap-3 text-[#E94C76] text-sm font-medium animate-in fade-in slide-in-from-top-2">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#00B8FD] focus:bg-white/10 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]"
                                placeholder="exemplo@email.com"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest">Palavra-passe</label>
                            <button type="button" onClick={onForgotPassword} className="text-xs text-[#00B8FD] hover:text-white transition-colors font-bold drop-shadow-[0_0_5px_rgba(0,184,253,0.5)]">Esqueceu-se?</button>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#00B8FD] focus:bg-white/10 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]"
                                placeholder="••••••••"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-gradient-to-r from-[#1042FF] to-[#00B8FD] text-white font-extrabold rounded-xl hover:shadow-[0_0_25px_rgba(0,184,253,0.5)] transition-all transform hover:-translate-y-1 mt-4 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                A entrar...
                            </>
                        ) : (
                            'Entrar'
                        )}
                    </button>
                </form>

                <div className="mt-10 text-center border-t border-white/10 pt-8">
                    <p className="text-sm text-white/50 font-medium">
                        Ainda não tem conta? <button onClick={onRegister} className="text-[#00B8FD] font-bold hover:text-white transition-colors drop-shadow-[0_0_5px_rgba(0,184,253,0.5)]">Criar conta</button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
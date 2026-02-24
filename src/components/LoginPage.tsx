import React, { useState } from 'react';
import { ArrowLeft, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
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

                <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#73c6df] focus:bg-white transition-all shadow-sm"
                                placeholder="exemplo@email.com"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Palavra-passe</label>
                            <button type="button" onClick={onForgotPassword} className="text-xs text-[#2e8ba6] hover:underline font-bold">Esqueceu-se?</button>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#73c6df] focus:bg-white transition-all shadow-sm"
                                placeholder="••••••••"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-[#0F172A] text-white font-extrabold rounded-xl hover:bg-[#73c6df] hover:shadow-lg hover:shadow-[#73c6df]/30 transition-all transform hover:-translate-y-1 mt-4 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
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
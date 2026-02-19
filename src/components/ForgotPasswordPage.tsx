import React, { useState } from 'react';
import { ArrowLeft, Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { resetPassword } from '../services/auth/authService';

interface ForgotPasswordPageProps {
    onBack: () => void;
    onLogin: () => void;
}

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onBack, onLogin }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (!email) {
            setError('Por favor, introduza o seu email');
            setIsLoading(false);
            return;
        }

        try {
            const result = await resetPasswordForEmail(email);

            if (result.success) {
                setIsSuccess(true);
            } else {
                setError(result.error || 'Erro ao enviar email de recuperação');
            }
        } catch (err) {
            setError('Ocorreu um erro inesperado');
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

            <div className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative z-10 transition-all duration-300">
                <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-800 text-sm font-bold mb-8 transition-colors group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Voltar
                </button>

                <div className="mb-8 text-center md:text-left">
                    <h2 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">Recuperar Conta</h2>
                    <p className="text-slate-500 font-medium">Introduza o email associado à sua conta para receber um link de recuperação.</p>
                </div>

                {!isSuccess ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
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

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-[#0F172A] text-white font-extrabold rounded-xl hover:bg-[#73c6df] hover:shadow-lg hover:shadow-[#73c6df]/30 transition-all transform hover:-translate-y-1 mt-4 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    A enviar...
                                </>
                            ) : (
                                'Enviar Link de Recuperação'
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                            <CheckCircle size={40} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Email Enviado!</h3>
                            <p className="text-slate-500 text-sm">
                                Verifique a sua caixa de entrada (e spam) para encontrar o link de redefinição de palavra-passe.
                            </p>
                        </div>
                        <button
                            onClick={onLogin}
                            className="w-full py-4 bg-[#0F172A] text-white font-extrabold rounded-xl hover:bg-[#73c6df] transition-all"
                        >
                            Voltar ao Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordPage;

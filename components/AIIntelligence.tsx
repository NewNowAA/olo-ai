import React, { useState, useRef, useEffect } from 'react';
import {
    Send,
    Bot,
    User,
    Sparkles,
    Loader2,
    MessageSquarePlus,
    TrendingUp,
    PieChart,
    Scissors,
    CalendarClock,
    BarChart3,
    FileText
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { geminiService } from '@/src/services';

interface Message {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    time: string;
}

const SUGGESTED_QUESTIONS = [
    { icon: PieChart, text: 'Quais são as minhas maiores despesas este mês?', color: 'from-blue-500 to-cyan-400' },
    { icon: TrendingUp, text: 'Analisa as tendências das minhas faturas', color: 'from-emerald-500 to-teal-400' },
    { icon: Scissors, text: 'Onde posso reduzir custos no meu negócio?', color: 'from-orange-500 to-amber-400' },
    { icon: CalendarClock, text: 'Faz uma previsão financeira para o próximo mês', color: 'from-purple-500 to-violet-400' },
    { icon: BarChart3, text: 'Quais categorias têm crescido mais?', color: 'from-rose-500 to-pink-400' },
    { icon: FileText, text: 'Dá-me um resumo financeiro completo', color: 'from-indigo-500 to-blue-400' },
];

const AIIntelligence: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            sender: 'user',
            text: text.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInputText('');
        setIsLoading(true);

        try {
            // Build history from existing messages (exclude the just-added user msg from context for API)
            const historyForApi = messages.map(m => ({ sender: m.sender, text: m.text }));

            const aiText = await geminiService.askConsultant(text.trim(), historyForApi);

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: aiText,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, aiMsg]);

        } catch (error) {
            console.error("Erro ao chamar consultor IA:", error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: "Estou com dificuldade em conectar aos meus servidores. Tente novamente em instantes.",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(inputText);
        }
    };

    const handleNewChat = () => {
        setMessages([]);
        setInputText('');
    };

    const hasMessages = messages.length > 0;

    return (
        <div className="p-6 md:p-10 max-w-[1600px] mx-auto h-[calc(100vh-100px)] flex flex-col gap-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Consultor IA</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">O seu consultor financeiro inteligente, baseado nos seus dados reais.</p>
                </div>
                {hasMessages && (
                    <button
                        onClick={handleNewChat}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow-md"
                    >
                        <MessageSquarePlus size={16} />
                        Nova Conversa
                    </button>
                )}
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col">

                {/* Chat Header */}
                <div className="p-5 border-b border-white/40 dark:border-slate-700/40 flex items-center gap-3 bg-white/40 dark:bg-slate-800/60 backdrop-blur-md">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#73c6df] to-[#8bd7bf] text-white flex items-center justify-center shadow-lg shadow-[#73c6df]/20">
                        <Bot size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white">Lumea — Consultora Financeira</h3>
                        <p className="text-xs text-[#2e8ba6] dark:text-[#73c6df] font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#8bd7bf] animate-pulse"></span> Online
                        </p>
                    </div>
                </div>

                {/* Messages / Welcome Screen */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6">

                    {!hasMessages ? (
                        /* Welcome Screen with suggested questions */
                        <div className="h-full flex flex-col items-center justify-center gap-8 max-w-2xl mx-auto">
                            {/* Avatar */}
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#73c6df] to-[#8bd7bf] text-white flex items-center justify-center shadow-xl shadow-[#73c6df]/30">
                                    <Sparkles size={36} />
                                </div>
                                <div className="text-center">
                                    <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Olá! Sou a Lumea 👋</h2>
                                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm max-w-md">
                                        Sou a sua consultora financeira de IA. Analiso as suas faturas em tempo real para dar conselhos personalizados sobre o seu negócio.
                                    </p>
                                </div>
                            </div>

                            {/* Suggested Questions */}
                            <div className="w-full">
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 text-center">Comece com uma pergunta</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {SUGGESTED_QUESTIONS.map((q, i) => (
                                        <button
                                            key={i}
                                            onClick={() => sendMessage(q.text)}
                                            className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-left hover:shadow-md hover:scale-[1.02] transition-all group"
                                        >
                                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${q.color} text-white flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md transition-shadow`}>
                                                <q.icon size={18} />
                                            </div>
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-tight">{q.text}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Chat Messages */
                        <div className="space-y-6 pb-4">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex gap-3 max-w-2xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.sender === 'user' ? 'bg-slate-800 dark:bg-slate-600 text-white' : 'bg-gradient-to-br from-[#73c6df] to-[#8bd7bf] text-white'}`}>
                                        {msg.sender === 'user' ? <User size={14} /> : <Sparkles size={14} />}
                                    </div>
                                    <div className={`space-y-1 ${msg.sender === 'user' ? 'text-right' : ''}`}>
                                        <div className={`
                                            p-4 rounded-2xl shadow-sm leading-relaxed text-sm
                                            ${msg.sender === 'user'
                                                ? 'bg-[#73c6df] text-white rounded-tr-none shadow-[#73c6df]/20'
                                                : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-tl-none'}
                                        `}>
                                            {msg.sender === 'user' ? (
                                                msg.text.split('\n').map((line, i) => (
                                                    <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                                                ))
                                            ) : (
                                                <div className="prose prose-sm max-w-none text-slate-600 dark:text-slate-300 prose-headings:text-slate-800 dark:prose-headings:text-white prose-strong:text-slate-700 dark:prose-strong:text-slate-200">
                                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-medium px-2">{msg.time}</span>
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex gap-3 max-w-2xl">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#73c6df] to-[#8bd7bf] text-white flex items-center justify-center shrink-0 mt-1">
                                        <Sparkles size={14} />
                                    </div>
                                    <div className="bg-white/60 dark:bg-slate-800/60 px-4 py-3 rounded-2xl rounded-tl-none border border-white/60 dark:border-slate-700 flex gap-2 items-center">
                                        <Loader2 size={16} className="animate-spin text-[#73c6df]" />
                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">A analisar os seus dados...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white/60 dark:bg-slate-800/60 border-t border-white/40 dark:border-slate-700/40">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-2 flex items-end gap-2 shadow-sm focus-within:ring-2 focus-within:ring-[#73c6df]/30 transition-all">
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                            placeholder="Pergunte sobre as suas faturas, custos ou estratégia financeira..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-slate-700 dark:text-slate-200 py-3 px-3 max-h-32 resize-none placeholder:text-slate-400"
                        />
                        <button
                            onClick={() => sendMessage(inputText)}
                            disabled={isLoading || !inputText.trim()}
                            className="p-2.5 bg-gradient-to-br from-[#2e8ba6] to-[#73c6df] text-white rounded-xl hover:opacity-90 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                    <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-2">A Lumea analisa os seus dados reais — pode cometer erros. Verifique informações importantes.</p>
                </div>
            </div>
        </div>
    );
};

export default AIIntelligence;
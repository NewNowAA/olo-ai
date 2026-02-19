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
    FileText,
    History,
    Trash2,
    Layout,
    Menu,
    X
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { geminiService } from '../services';
import { supabase } from '../services/supabase';
import { useToast } from '../contexts/ToastContext';

interface Message {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    time: string;
}

interface Conversation {
    id: string;
    title: string;
    messages: Message[];
    updated_at: string;
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
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConvId, setActiveConvId] = useState<string | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(true); // Default open on desktop
    const scrollRef = useRef<HTMLDivElement>(null);
    const { addToast } = useToast();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        fetchConversations();
        // Responsive sidebar check
        if (window.innerWidth < 768) setIsHistoryOpen(false);
    }, []);

    const fetchConversations = async () => {
        const { data, error } = await supabase
            .from('chat_conversations')
            .select('*')
            .order('updated_at', { ascending: false });
        
        if (error) console.error('Error fetching conversations:', error);
        else setConversations(data || []);
    };

    const loadConversation = (conv: Conversation) => {
        setMessages(conv.messages);
        setActiveConvId(conv.id);
        if (window.innerWidth < 768) setIsHistoryOpen(false);
    };

    const deleteConversation = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const { error } = await supabase.from('chat_conversations').delete().eq('id', id);
        if (error) {
            addToast('Erro ao apagar conversa', 'error');
        } else {
            setConversations(prev => prev.filter(c => c.id !== id));
            if (activeConvId === id) {
                handleNewChat();
            }
            addToast('Conversa apagada', 'success');
        }
    };

    const sendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            sender: 'user',
            text: text.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInputText('');
        setIsLoading(true);

        try {
            // Build history from existing messages
            const historyForApi = messages.map(m => ({ sender: m.sender, text: m.text }));

            const aiText = await geminiService.askConsultant(text.trim(), historyForApi);

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: aiText,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            
            const finalMessages = [...newMessages, aiMsg];
            setMessages(finalMessages);

            // Persist to Supabase
            if (activeConvId) {
                await supabase
                    .from('chat_conversations')
                    .update({ messages: finalMessages, updated_at: new Date().toISOString() })
                    .eq('id', activeConvId);
                // Update local list to move to top
                fetchConversations();
            } else {
                const title = text.trim().slice(0, 30) + (text.length > 30 ? '...' : '');
                const { data, error } = await supabase
                    .from('chat_conversations')
                    .insert({ title, messages: finalMessages })
                    .select()
                    .single();
                
                if (data && !error) {
                    setActiveConvId(data.id);
                    fetchConversations(); // Refresh list
                }
            }

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
        setActiveConvId(null);
        if (window.innerWidth < 768) setIsHistoryOpen(false);
    };

    const hasMessages = messages.length > 0;

    return (
        <div className="p-4 md:p-8 max-w-[1800px] mx-auto h-[calc(100vh-80px)] flex flex-col gap-6">

            {/* Header & Toggle */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <Layout size={24} className="text-slate-600 dark:text-slate-300" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                           <Sparkles size={24} className="text-[#73c6df]"/> Lumea AI
                        </h1>
                    </div>
                </div>
                 <button
                    onClick={handleNewChat}
                    className="flex items-center gap-2 px-4 py-2 bg-[#73c6df] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-sm"
                >
                    <MessageSquarePlus size={18} />
                    <span className="hidden sm:inline">Nova Conversa</span>
                </button>
            </div>

            <div className="flex flex-1 gap-6 overflow-hidden relative">
                
                {/* Sidebar (History) */}
                <div className={`
                    absolute md:static inset-y-0 left-0 z-30 w-72 bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl md:shadow-none border border-slate-100 dark:border-slate-700
                    transform transition-transform duration-300 ease-in-out flex flex-col overflow-hidden
                    ${isHistoryOpen ? 'translate-x-0' : '-translate-x-[110%] md:w-0 md:opacity-0 md:border-none p-0'}
                `}>
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2">
                            <History size={16} /> Histórico
                        </h3>
                        <button onClick={() => setIsHistoryOpen(false)} className="md:hidden p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">
                            <X size={16} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {conversations.length === 0 ? (
                            <div className="text-center py-10 px-4">
                                <p className="text-xs text-slate-400">Nenhuma conversa guardada nos últimos 15 dias.</p>
                            </div>
                        ) : (
                            conversations.map(conv => (
                                <div 
                                    key={conv.id} 
                                    onClick={() => loadConversation(conv)}
                                    className={`
                                        group relative p-3 rounded-xl cursor-pointer transition-all border
                                        ${activeConvId === conv.id 
                                            ? 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 shadow-sm' 
                                            : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400'}
                                    `}
                                >
                                    <p className="text-xs font-bold truncate pr-6 text-slate-700 dark:text-slate-200">{conv.title || 'Conversa sem título'}</p>
                                    <p className="text-[10px] text-slate-400 mt-1">{new Date(conv.updated_at).toLocaleDateString()}</p>
                                    <button 
                                        onClick={(e) => deleteConversation(e, conv.id)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Overlay for mobile */}
                {isHistoryOpen && (
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden" onClick={() => setIsHistoryOpen(false)} />
                )}

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-[2.5rem] shadow-sm overflow-hidden relative transition-all">
                    
                    {/* Chat Header (Internal) - Removed simple title, kept status */}
                    <div className="p-4 border-b border-white/40 dark:border-slate-700/40 flex items-center justify-between bg-white/40 dark:bg-slate-800/60 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#73c6df] to-[#8bd7bf] text-white flex items-center justify-center shadow-lg shadow-[#73c6df]/20">
                                <Bot size={16} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Consultora Financeira</h3>
                                <p className="text-[10px] text-[#2e8ba6] dark:text-[#73c6df] font-medium flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#8bd7bf] animate-pulse"></span> Online • Memória de 15 dias
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Messages / Welcome Screen */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6">

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
                            placeholder="Ex: Qual foi o produto mais vendido este mês?"
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
                     <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-2">A Lumea pode cometer erros. Verifique informações importantes.</p>
                </div>
            </div>
            </div>
        </div>
    );
};

export default AIIntelligence;
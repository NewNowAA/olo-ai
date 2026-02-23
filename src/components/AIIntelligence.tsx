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
    const [isHistoryOpen, setIsHistoryOpen] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { addToast } = useToast();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        fetchConversations();
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

            if (activeConvId) {
                await supabase
                    .from('chat_conversations')
                    .update({ messages: finalMessages, updated_at: new Date().toISOString() })
                    .eq('id', activeConvId);
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
                    fetchConversations();
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

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setIsHistoryOpen(!isHistoryOpen)} 
                        className="p-2 rounded-xl transition-colors"
                        style={{ color: 'var(--t2)' }}
                    >
                        <Layout size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2" style={{ color: 'var(--t1)' }}>
                           <Sparkles size={24} className="text-[#73c6df]"/> Lumea AI
                        </h1>
                    </div>
                </div>
                 <button
                    onClick={handleNewChat}
                    className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #2e8ba6, #73c6df)', fontFamily: "'Outfit', sans-serif" }}
                >
                    <MessageSquarePlus size={18} />
                    <span className="hidden sm:inline">Nova Conversa</span>
                </button>
            </div>

            <div className="flex flex-1 gap-6 overflow-hidden relative">
                
                {/* Sidebar (History) */}
                <div 
                    className={`
                        absolute md:static inset-y-0 left-0 z-30 w-72 rounded-[2rem] backdrop-blur-xl
                        transform transition-transform duration-300 ease-in-out flex flex-col overflow-hidden
                        ${isHistoryOpen ? 'translate-x-0' : '-translate-x-[110%] md:w-0 md:opacity-0 md:border-none p-0'}
                    `}
                    style={{ 
                        backgroundColor: 'var(--card)', 
                        border: '1px solid var(--border)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
                    }}
                >
                    <div className="p-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border)' }}>
                        <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--t2)' }}>
                            <History size={16} /> Histórico
                        </h3>
                        <button onClick={() => setIsHistoryOpen(false)} className="md:hidden p-1 rounded-lg" style={{ color: 'var(--t3)' }}>
                            <X size={16} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {conversations.length === 0 ? (
                            <div className="text-center py-10 px-4">
                                <p className="text-xs" style={{ color: 'var(--t3)' }}>Nenhuma conversa guardada nos últimos 15 dias.</p>
                            </div>
                        ) : (
                            conversations.map(conv => (
                                <div 
                                    key={conv.id} 
                                    onClick={() => loadConversation(conv)}
                                    className="group relative p-3 rounded-xl cursor-pointer transition-all"
                                    style={{ 
                                        backgroundColor: activeConvId === conv.id ? 'var(--blue-a)' : 'transparent',
                                        border: activeConvId === conv.id ? '1px solid var(--blue)' : '1px solid transparent'
                                    }}
                                >
                                    <p className="text-xs font-bold truncate pr-6" style={{ color: 'var(--t1)' }}>{conv.title || 'Conversa sem título'}</p>
                                    <p className="text-[10px] mt-1" style={{ color: 'var(--t3)' }}>{new Date(conv.updated_at).toLocaleDateString()}</p>
                                    <button 
                                        onClick={(e) => deleteConversation(e, conv.id)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:text-rose-500"
                                        style={{ color: 'var(--t3)' }}
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
                <div 
                    className="flex-1 flex flex-col rounded-[2.5rem] backdrop-blur-xl overflow-hidden relative transition-all"
                    style={{ 
                        backgroundColor: 'var(--card)', 
                        border: '1px solid var(--border)',
                    }}
                >
                    
                    {/* Chat Header (Internal) */}
                    <div className="p-4 flex items-center justify-between backdrop-blur-md" style={{ borderBottom: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#73c6df] to-[#8bd7bf] text-white flex items-center justify-center shadow-lg shadow-[#73c6df]/20">
                                <Bot size={16} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm" style={{ color: 'var(--t1)' }}>Consultora Financeira</h3>
                                <p className="text-[10px] text-[#73c6df] font-medium flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#8bd7bf] animate-pulse"></span>
                                    Online • Memória de 15 dias
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
                                    <h2 className="text-2xl font-extrabold" style={{ color: 'var(--t1)' }}>Olá! Sou a Lumea 👋</h2>
                                    <p className="mt-2 text-sm max-w-md" style={{ color: 'var(--t2)' }}>
                                        Sou a sua consultora financeira de IA. Analiso as suas faturas em tempo real para dar conselhos personalizados sobre o seu negócio.
                                    </p>
                                </div>
                            </div>

                            {/* Suggested Questions */}
                            <div className="w-full">
                                <p className="text-xs font-bold uppercase tracking-widest mb-4 text-center" style={{ color: 'var(--t3)' }}>Comece com uma pergunta</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {SUGGESTED_QUESTIONS.map((q, i) => (
                                        <button
                                            key={i}
                                            onClick={() => sendMessage(q.text)}
                                            className="flex items-center gap-3 p-4 rounded-2xl text-left transition-all group hover:scale-[1.02]"
                                            style={{ 
                                                backgroundColor: 'var(--input-bg)', 
                                                border: '1px solid var(--border)',
                                            }}
                                        >
                                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${q.color} text-white flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md transition-shadow`}>
                                                <q.icon size={18} />
                                            </div>
                                            <span className="text-sm font-medium leading-tight" style={{ color: 'var(--t2)' }}>{q.text}</span>
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
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                                        msg.sender === 'user' 
                                            ? 'text-white' 
                                            : 'bg-gradient-to-br from-[#73c6df] to-[#8bd7bf] text-white'
                                    }`}
                                    style={msg.sender === 'user' ? { backgroundColor: 'var(--blue)' } : {}}
                                    >
                                        {msg.sender === 'user' ? <User size={14} /> : <Sparkles size={14} />}
                                    </div>
                                    <div className={`space-y-1 ${msg.sender === 'user' ? 'text-right' : ''}`}>
                                        <div 
                                            className={`p-4 rounded-2xl shadow-sm leading-relaxed text-sm ${
                                                msg.sender === 'user'
                                                    ? 'rounded-tr-none text-white'
                                                    : 'rounded-tl-none'
                                            }`}
                                            style={msg.sender === 'user' 
                                                ? { background: 'linear-gradient(135deg, #2e8ba6, #73c6df)' }
                                                : { backgroundColor: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--t2)' }
                                            }
                                        >
                                            {msg.sender === 'user' ? (
                                                msg.text.split('\n').map((line, i) => (
                                                    <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                                                ))
                                            ) : (
                                                <div className="prose prose-sm max-w-none" style={{ color: 'var(--t2)' }}>
                                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-medium px-2" style={{ color: 'var(--t3)' }}>{msg.time}</span>
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex gap-3 max-w-2xl">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#73c6df] to-[#8bd7bf] text-white flex items-center justify-center shrink-0 mt-1">
                                        <Sparkles size={14} />
                                    </div>
                                    <div 
                                        className="px-4 py-3 rounded-2xl rounded-tl-none flex gap-2 items-center"
                                        style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border)' }}
                                    >
                                        <Loader2 size={16} className="animate-spin text-[#73c6df]" />
                                        <span className="text-xs font-medium" style={{ color: 'var(--t3)' }}>A analisar os seus dados...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>


                {/* Input Area */}
                <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
                    <div 
                        className="rounded-2xl p-2 flex items-end gap-2 shadow-sm transition-all"
                        style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border)' }}
                    >
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                            placeholder="Ex: Qual foi o produto mais vendido este mês?"
                            className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-sm py-3 px-3 max-h-32 resize-none"
                            style={{ color: 'var(--t1)', fontFamily: "'Outfit', sans-serif" }}
                        />
                        <button
                            onClick={() => sendMessage(inputText)}
                            disabled={isLoading || !inputText.trim()}
                            className="p-2.5 text-white rounded-xl transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                            style={{ background: 'linear-gradient(135deg, #2e8ba6, #73c6df)' }}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                     <p className="text-center text-[10px] mt-2" style={{ color: 'var(--t3)' }}>A Lumea pode cometer erros. Verifique informações importantes.</p>
                </div>
            </div>
            </div>
        </div>
    );
};

export default AIIntelligence;
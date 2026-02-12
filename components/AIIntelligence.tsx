import React, { useState, useRef, useEffect } from 'react';
import {
    BrainCircuit,
    Send,
    Bot,
    User,
    MoreVertical,
    Search,
    Paperclip,
    Sparkles,
    Loader2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { geminiService } from '@/src/services';

interface Message {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    time: string;
}

const AIIntelligence: React.FC = () => {
    const [activeChat, setActiveChat] = useState('1');
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const [messages, setMessages] = useState<Message[]>([
        { id: '1', sender: 'ai', text: 'Olá! Sou a Lumea, sua assistente de inteligência financeira. Analisei seus dados e notei um aumento de 12% nas despesas de marketing. Como posso ajudar hoje?', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);

    const chats = [
        { id: '1', name: 'Lumea Assistente', type: 'ai', lastMsg: 'Como posso ajudar hoje?', time: 'Agora', unread: 0 },
        { id: '2', name: 'Financeiro Team', type: 'group', lastMsg: 'Alex: Precisamos aprovar a fatura AWS.', time: '09:15', unread: 2 },
    ];

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            sender: 'user',
            text: inputText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);

        try {
            const aiText = await geminiService.askFinancialAssistant(inputText);

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: aiText,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, aiMsg]);

        } catch (error) {
            console.error("Erro ao chamar Gemini:", error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: "Estou tendo dificuldades para conectar com meus servidores neurais. Tente novamente em instantes.",
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
            handleSendMessage();
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-[1600px] mx-auto h-[calc(100vh-100px)] flex flex-col gap-6">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Inteligência IA</h1>
                    <p className="text-slate-500 mt-2 font-medium">Converse com seus dados financeiros em tempo real.</p>
                </div>
            </div>

            <div className="flex-1 bg-white/40 backdrop-blur-xl border border-white/50 rounded-[2.5rem] shadow-sm overflow-hidden flex">

                {/* Sidebar Chat List */}
                <div className="hidden md:flex w-80 border-r border-white/40 bg-white/20 flex-col">
                    <div className="p-6 border-b border-white/40">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar conversas..."
                                className="w-full pl-9 pr-4 py-2.5 bg-white/60 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#73c6df]/30 transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {chats.map(chat => (
                            <button
                                key={chat.id}
                                onClick={() => setActiveChat(chat.id)}
                                className={`w-full p-4 rounded-2xl flex items-start gap-3 transition-all ${activeChat === chat.id ? 'bg-white shadow-sm' : 'hover:bg-white/40'}`}
                            >
                                <div className={`
                             w-10 h-10 rounded-full flex items-center justify-center shrink-0
                             ${chat.type === 'ai' ? 'bg-gradient-to-br from-[#73c6df] to-[#8bd7bf] text-white' : 'bg-slate-200 text-slate-500'}
                          `}>
                                    {chat.type === 'ai' ? <Bot size={20} /> : <User size={20} />}
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-slate-800 text-sm truncate">{chat.name}</span>
                                        <span className="text-[10px] text-slate-400 font-bold">{chat.time}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 truncate">{chat.lastMsg}</p>
                                </div>
                                {chat.unread > 0 && (
                                    <div className="w-5 h-5 rounded-full bg-[#73c6df] text-white text-[10px] font-bold flex items-center justify-center">
                                        {chat.unread}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col bg-white/30 relative">
                    {/* Chat Header */}
                    <div className="p-6 border-b border-white/40 flex justify-between items-center bg-white/40 backdrop-blur-md absolute top-0 left-0 right-0 z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#73c6df] to-[#8bd7bf] text-white flex items-center justify-center shadow-lg shadow-[#73c6df]/20">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">Lumea Assistente</h3>
                                <p className="text-xs text-[#2e8ba6] font-medium flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#8bd7bf] animate-pulse"></span> Online
                                </p>
                            </div>
                        </div>
                        <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                            <MoreVertical size={20} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 pt-24 pb-4">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-4 max-w-2xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.sender === 'user' ? 'bg-slate-800 text-white' : 'bg-gradient-to-br from-[#73c6df] to-[#8bd7bf] text-white'}`}>
                                    {msg.sender === 'user' ? <User size={14} /> : <Sparkles size={14} />}
                                </div>
                                <div className={`space-y-1 ${msg.sender === 'user' ? 'text-right' : ''}`}>
                                    <div className={`
                                  p-4 rounded-2xl shadow-sm leading-relaxed text-sm
                                  ${msg.sender === 'user'
                                            ? 'bg-[#73c6df] text-white rounded-tr-none shadow-[#73c6df]/20'
                                            : 'bg-white border border-slate-100 text-slate-600 rounded-tl-none'}
                              `}>
                                        {msg.sender === 'user' ? (
                                            msg.text.split('\n').map((line, i) => (
                                                <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                                            ))
                                        ) : (
                                            <div className="prose prose-sm max-w-none text-slate-600">
                                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-medium px-2">{msg.time}</span>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-4 max-w-2xl">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#73c6df] to-[#8bd7bf] text-white flex items-center justify-center shrink-0 mt-1">
                                    <Sparkles size={14} />
                                </div>
                                <div className="bg-white/50 px-4 py-3 rounded-2xl rounded-tl-none border border-white/60 flex gap-2 items-center">
                                    <Loader2 size={16} className="animate-spin text-[#73c6df]" />
                                    <span className="text-xs text-slate-500 font-medium">Pensando...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white/60 border-t border-white/40">
                        <div className="bg-white rounded-2xl border border-slate-200 p-2 flex items-end gap-2 shadow-sm focus-within:ring-2 focus-within:ring-[#73c6df]/30 transition-all">
                            <button className="p-2 text-slate-400 hover:text-[#73c6df] hover:bg-slate-50 rounded-xl transition-colors">
                                <Paperclip size={20} />
                            </button>
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                rows={1}
                                placeholder="Pergunte sobre suas metas, faturas ou previsões..."
                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-slate-700 py-3 max-h-32 resize-none"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={isLoading || !inputText.trim()}
                                className="p-2 bg-[#2e8ba6] text-white rounded-xl hover:bg-[#257a91] transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                        <p className="text-center text-[10px] text-slate-400 mt-2">A Lumea pode cometer erros. Verifique informações importantes.</p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AIIntelligence;
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, MessageSquare, Loader2, Trash2, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { geminiService } from '../services/ai/geminiService';
import { chatService, Message, Conversation } from '../services/chat/chatService';
import { supabase } from '../services/organizationService/supabase/client';

export const ChatComponent: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Initialize user and conversation on mount/open
    useEffect(() => {
        const initChat = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);

            const activeConv = await chatService.getActiveConversation(user.id);
            if (activeConv) {
                setConversationId(activeConv.id);
                const msgs = await chatService.getMessages(activeConv.id);
                setMessages(msgs);
            } else {
                setMessages([{
                    id: 'welcome',
                    conversation_id: 'temp',
                    role: 'assistant',
                    content: 'Olá! Sou a Lumea, sua assistente financeira. Como posso ajudar você hoje?',
                    created_at: new Date().toISOString()
                }]);
            }
        };

        if (isOpen) {
            initChat();
        }
    }, [isOpen]);

    const handleNewConversation = async () => {
        if (!userId) return;
        setMessages([{
            id: 'welcome',
            conversation_id: 'temp',
            role: 'assistant',
            content: 'Olá! Sou a Lumea. Iniciei uma nova conversa. Em que posso ajudar?',
            created_at: new Date().toISOString()
        }]);
        setConversationId(null);
    };

    const handleDeleteConversation = async () => {
        if (!conversationId) return;
        if (confirm('Tem certeza que deseja apagar esta conversa?')) {
            await chatService.deleteConversation(conversationId);
            handleNewConversation();
        }
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading || !userId) return;

        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            // 1. Ensure Conversation Exists
            let currentConvId = conversationId;
            if (!currentConvId) {
                const newConv = await chatService.createConversation(userId);
                if (newConv) {
                    currentConvId = newConv.id;
                    setConversationId(newConv.id);
                } else {
                    throw new Error("Falha ao criar conversa");
                }
            }

            // 2. Optimistic Update (Show User Message)
            const tempUserMsg: Message = {
                id: Date.now().toString(),
                conversation_id: currentConvId!,
                role: 'user',
                content: currentInput,
                created_at: new Date().toISOString()
            };
            setMessages(prev => [...prev, tempUserMsg]);

            // 3. Save User Message to DB
            await chatService.addMessage(currentConvId!, 'user', currentInput);

            // 4. Call AI Edge Function
            // Prepare history for context (last 10 messages)
            const history = messages.slice(-10).map(m => ({
                sender: m.role === 'user' ? 'user' : 'model',
                text: m.content
            }));

            const responseText = await geminiService.askConsultant(currentInput, history);

            // 5. Save Assistant Message to DB
            const savedBotMsg = await chatService.addMessage(currentConvId!, 'assistant', responseText);

            if (savedBotMsg) {
                setMessages(prev => [...prev, savedBotMsg]);
            } else {
                // Fallback if save fails (shouldn't happen often)
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    conversation_id: currentConvId!,
                    role: 'assistant',
                    content: responseText,
                    created_at: new Date().toISOString()
                }]);
            }

        } catch (error) {
            console.error('Chat Error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                conversation_id: conversationId || 'error',
                role: 'assistant',
                content: 'Desculpe, tive um problema ao processar sua mensagem. Tente novamente.',
                created_at: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-all duration-300 z-50 flex items-center justify-center ${isOpen
                        ? 'bg-red-500 hover:bg-red-600 rotate-90'
                        : 'bg-emerald-500 hover:bg-emerald-600 hover:scale-110'
                    }`}
            >
                {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageSquare className="w-6 h-6 text-white" />}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">

                    {/* Header */}
                    <div className="bg-slate-800 p-4 border-b border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50">
                                <Bot className="w-6 h-6 text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Lumea Assistant</h3>
                                <p className="text-xs text-slate-400 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Online
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleNewConversation}
                                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                                title="Nova Conversa"
                            >
                                <Plus size={18} />
                            </button>
                            {conversationId && (
                                <button
                                    onClick={handleDeleteConversation}
                                    className="p-2 hover:bg-rose-900/30 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                                    title="Apagar Conversa"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-500/20 text-blue-500' : 'bg-emerald-500/20 text-emerald-500'
                                    }`}>
                                    {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                                </div>

                                <div className={`max-w-[80%] rounded-2xl p-3 ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
                                    }`}>
                                    {msg.role === 'user' ? (
                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                    ) : (
                                        <div className="prose prose-invert prose-sm max-w-none">
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        </div>
                                    )}
                                    <span className="text-[10px] opacity-50 mt-1 block text-right">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-5 h-5" />
                                </div>
                                <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none p-3 flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                                    <span className="text-sm text-slate-400">Digitando...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-slate-800 border-t border-slate-700">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Pergunte sobre suas finanças..."
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all flex items-center justify-center shadow-lg shadow-emerald-500/20"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

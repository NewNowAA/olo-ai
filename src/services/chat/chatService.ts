import { supabase } from '../organizationService/supabase/client';

export interface Message {
    id: string;
    conversation_id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
}

export interface Conversation {
    id: string;
    user_id: string;
    title: string;
    created_at: string;
    updated_at: string;
}

export const chatService = {
    // Get the most recent active conversation for the user
    getActiveConversation: async (userId: string): Promise<Conversation | null> => {
        const { data, error } = await supabase
            .from('lumea_conversations')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows returned"
            console.error('Error fetching conversation:', error);
            return null;
        }
        return data || null;
    },

    // Create a new conversation
    createConversation: async (userId: string, title: string = 'Nova conversa'): Promise<Conversation | null> => {
        const { data, error } = await supabase
            .from('lumea_conversations')
            .insert([{ user_id: userId, title }])
            .select()
            .single();

        if (error) {
            console.error('Error creating conversation:', error);
            return null;
        }
        return data;
    },

    // Get messages for a specific conversation
    getMessages: async (conversationId: string): Promise<Message[]> => {
        const { data, error } = await supabase
            .from('lumea_messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching messages:', error);
            return [];
        }
        return data;
    },

    // Add a message to a conversation
    addMessage: async (conversationId: string, role: 'user' | 'assistant', content: string): Promise<Message | null> => {
        const { data, error } = await supabase
            .from('lumea_messages')
            .insert([{ conversation_id: conversationId, role, content }])
            .select()
            .single();

        if (error) {
            console.error('Error adding message:', error);
            return null;
        }

        // Update conversation updated_at
        await supabase
            .from('lumea_conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', conversationId);

        return data;
    },

    // Delete a conversation (and cascade messages)
    deleteConversation: async (conversationId: string): Promise<boolean> => {
        const { error } = await supabase
            .from('lumea_conversations')
            .delete()
            .eq('id', conversationId);

        if (error) {
            console.error('Error deleting conversation:', error);
            return false;
        }
        return true;
    }
};

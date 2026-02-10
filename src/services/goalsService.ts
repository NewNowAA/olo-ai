import { supabase } from './supabase/client';

export interface Goal {
    id: string;
    title: string;
    target_value: number;
    current_value: number;
    deadline: string;
    type: 'Individual' | 'Conjunta';
    kpi: string;
    status: 'active' | 'completed' | 'archived';
    color: string;
    start_date?: string; // Optional for backward compatibility, but UI will enforce
    category?: string; // Optional filter
    progress?: number; // Calculated field
}

export const goalsService = {
    async getGoals() {
        // Fetch specific columns or all
        const { data, error } = await supabase
            .from('goals')
            .select('*')
            .order('deadline', { ascending: true });

        if (error) {
            console.error('Error fetching goals:', error);
            throw error;
        }

        // Calculate progress and ensure status is set
        return (data || []).map((goal: any) => ({
            ...goal,
            status: goal.status || 'active', // Default to active if null
            progress: Math.min(100, Math.round((goal.current_value / goal.target_value) * 100))
        })) as Goal[];
    },

    async createGoal(goal: Omit<Goal, 'id' | 'current_value' | 'status' | 'color' | 'progress'>) {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('goals')
            .insert([{
                ...goal,
                user_id: user.id,
                current_value: 0,
                status: 'active',
                start_date: goal.start_date || new Date().toISOString().split('T')[0], // Default to today
                category: goal.category || null,
                color: 'bg-[#73c6df]' // Default color
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating goal:', error);
            throw error;
        }

        return data;
    },

    async updateGoal(id: string, updates: Partial<Goal>) {
        const { data, error } = await supabase
            .from('goals')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating goal:', error);
            throw error;
        }

        return data;
    },

    async updateGoalStatus(id: string, status: 'active' | 'completed' | 'archived') {
        const { data, error } = await supabase
            .from('goals')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating goal status:', error);
            throw error;
        }
        return data;
    },

    async deleteGoal(id: string) {
        const { error } = await supabase
            .from('goals')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting goal:', error);
            throw error;
        }
    }
};

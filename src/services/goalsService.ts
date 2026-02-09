import { supabase } from './supabase/client';

export interface Goal {
    id: string;
    title: string;
    target_value: number;
    current_value: number;
    deadline: string;
    type: 'Individual' | 'Conjunta';
    kpi: string;
    status: 'Em andamento' | 'Concluído' | 'Atrasado' | 'Quase lá';
    color: string;
    progress?: number; // Calculated field
}

export const goalsService = {
    async getGoals() {
        // Fetch goals for the current user
        // If type is 'Conjunta', we might want to see others later, but for now RLS limits to own rows or simple check.
        // We will fetch all goals the user has access to.
        const { data, error } = await supabase
            .from('goals')
            .select('*')
            .order('deadline', { ascending: true });

        if (error) {
            console.error('Error fetching goals:', error);
            throw error;
        }

        // Calculate progress
        return (data || []).map((goal: any) => ({
            ...goal,
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
                status: 'Em andamento',
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

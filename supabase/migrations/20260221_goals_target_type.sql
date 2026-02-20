-- Add target_type to goals table
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS target_type text DEFAULT 'currency' CHECK (target_type IN ('currency', 'percentage'));

-- Migration: Add feedbacks table and organizations preview_mode
-- Created: 2026-03-14

-- 1. Add feedbacks table
CREATE TABLE IF NOT EXISTS public.feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    url TEXT,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: We assume preview_mode is currently handled in-memory. Let's add it to organizations.
-- If the column already exists, this is safe in most modern postgres or we can do a safe alter.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizations' AND column_name='preview_mode') THEN
        ALTER TABLE public.organizations ADD COLUMN preview_mode TEXT DEFAULT 'owner';
    END IF;
END $$;

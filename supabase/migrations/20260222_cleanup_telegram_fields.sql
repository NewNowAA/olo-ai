-- Fix 1: Remover o NOT NULL do campo password
ALTER TABLE public.users ALTER COLUMN password DROP NOT NULL;
UPDATE public.users SET password = NULL WHERE password = 'managed_by_supabase_auth';

-- Fix 2: Limpar migration telegram_chat_id e alinhar campos
ALTER TABLE public.users DROP COLUMN IF EXISTS telegram_chat_id;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS link_token text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS token_expires_at timestamptz;

UPDATE public.users 
SET telegram_id = NULL 
WHERE telegram_id IS NOT NULL 
  AND telegram_id !~ '^\d+$';

CREATE INDEX IF NOT EXISTS idx_users_link_token ON public.users(link_token) WHERE link_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON public.users(telegram_id) WHERE telegram_id IS NOT NULL;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS link_token text,
ADD COLUMN IF NOT EXISTS token_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS telegram_chat_id text;

-- Remove from profiles if it was created
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS link_token,
DROP COLUMN IF EXISTS token_expires_at,
DROP COLUMN IF EXISTS telegram_chat_id;

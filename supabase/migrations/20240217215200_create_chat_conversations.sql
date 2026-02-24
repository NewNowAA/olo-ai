-- Create the chat_conversations table to store AI chat history
create table if not exists public.chat_conversations (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
    title text,
    messages jsonb[] not null default '{}',
    updated_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

-- Enable RLS to securely isolate user data
alter table public.chat_conversations enable row level security;

-- Create policy allowing full access to own data
create policy "Users can manage their own conversations"
    on public.chat_conversations
    for all
    using (auth.uid() = user_id);

-- Create indexes for performance
create index if not exists idx_chat_conversations_user_id on public.chat_conversations(user_id);
create index if not exists idx_chat_conversations_updated_at on public.chat_conversations(updated_at);

-- Function to clean up old conversations (retention policy: 15 days)
create or replace function public.delete_old_conversations()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.chat_conversations
  where updated_at < now() - interval '15 days';
end;
$$;

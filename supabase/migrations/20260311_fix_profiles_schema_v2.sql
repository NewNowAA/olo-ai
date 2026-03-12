-- Fix the profiles table schema for Olo.AI

-- 1. Add missing columns (if not exists)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name text;

-- 2. Drop existing role check constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 3. Add updated role check constraint supporting all new and old roles
-- 'dev', 'owner', 'client', 'admin' are Olo.AI specific
-- 'user', 'system_admin' might be from the old schema
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('dev', 'admin', 'user', 'owner', 'client', 'system_admin'));

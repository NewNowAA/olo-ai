-- Enable RLS and setup policies for the profiles table

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Safely drop existing policies if they happen to exist to avoid duplication errors
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;

-- Create basic policies for profiles
-- 1. Users can view their own profile
CREATE POLICY "Users can view their own profile." 
  ON public.profiles 
  FOR SELECT 
  USING ( auth.uid() = id );

-- 2. Users can update their own profile
CREATE POLICY "Users can update their own profile." 
  ON public.profiles 
  FOR UPDATE 
  USING ( auth.uid() = id );

-- 3. The service role inserts profiles, but in case the client needs to insert
CREATE POLICY "Users can insert their own profile." 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK ( auth.uid() = id );

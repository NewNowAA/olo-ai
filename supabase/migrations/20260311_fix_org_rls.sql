-- Run this in your Supabase SQL Editor

-- Allow authenticated users to insert their own organizations
CREATE POLICY "Allow authenticated users to insert organizations" 
ON public.organizations 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Allow authenticated users to insert their own profile" 
ON public.users 
FOR INSERT 
WITH CHECK (auth.uid() = id);

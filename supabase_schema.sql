-- Run this SQL in your Supabase SQL Editor

-- 1. Create the Profiles table (Safe to run multiple times)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE,
  full_name TEXT,
  country TEXT,
  theme TEXT DEFAULT 'default'
);

-- Safely add the column if it was missing from a previous migration
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'default';

-- Enable Row Level Security (Safe to run multiple times)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Safely Drop Existing Policies to prevent "already exists" errors
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

-- Create Policies for Profiles
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. Create the Legal Queries table
CREATE TABLE IF NOT EXISTS public.legal_queries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_prompt TEXT NOT NULL,
  category TEXT,
  applicable_sections TEXT,
  penalties_fines_tenure TEXT,
  advice TEXT,
  required_documents TEXT,
  risk_score INTEGER CHECK (risk_score >= 1 AND risk_score <= 10)
);

-- Safely add missing columns if the table already existed from an older version
ALTER TABLE public.legal_queries ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.legal_queries ADD COLUMN IF NOT EXISTS applicable_sections TEXT;
ALTER TABLE public.legal_queries ADD COLUMN IF NOT EXISTS penalties_fines_tenure TEXT;
ALTER TABLE public.legal_queries ADD COLUMN IF NOT EXISTS advice TEXT;
ALTER TABLE public.legal_queries ADD COLUMN IF NOT EXISTS required_documents TEXT;
ALTER TABLE public.legal_queries ADD COLUMN IF NOT EXISTS risk_score INTEGER CHECK (risk_score >= 1 AND risk_score <= 10);


-- Enable RLS for queries
ALTER TABLE public.legal_queries ENABLE ROW LEVEL SECURITY;

-- Safely Drop Existing Policies for Queries
DROP POLICY IF EXISTS "Users can view their own queries." ON public.legal_queries;
DROP POLICY IF EXISTS "Users can insert their own queries." ON public.legal_queries;

-- Create Policies for Queries
CREATE POLICY "Users can view their own queries." ON public.legal_queries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own queries." ON public.legal_queries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Optional: Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Force Supabase schema cache to explicitly reload
NOTIFY pgrst, 'reload schema';

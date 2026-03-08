
-- Create leads table (public insert)
CREATE TABLE public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  path TEXT NOT NULL CHECK (path IN ('architect', 'operator')),
  book_bump_clicked BOOLEAN DEFAULT FALSE,
  book_bump_timestamp TIMESTAMPTZ,
  ghl_synced BOOLEAN DEFAULT FALSE,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT
);

CREATE INDEX leads_email_idx ON leads(email);
CREATE INDEX leads_path_idx ON leads(path);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_insert_leads" ON public.leads FOR INSERT WITH CHECK (true);

-- Create profiles table for authenticated users
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  email TEXT,
  display_name TEXT
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_profile" ON public.profiles FOR ALL USING (auth.uid() = id);

-- Create user_roles table
CREATE TYPE public.app_role AS ENUM ('practitioner', 'healer', 'administrator');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'practitioner',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "users_read_own_roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Create codex_conversations table
CREATE TABLE public.codex_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sources JSONB
);

ALTER TABLE public.codex_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_conversations" ON public.codex_conversations FOR ALL USING (auth.uid() = user_id);

-- Create webhook_errors table for failure logging
CREATE TABLE public.webhook_errors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  event_type TEXT NOT NULL,
  payload JSONB,
  error_message TEXT
);

ALTER TABLE public.webhook_errors ENABLE ROW LEVEL SECURITY;

-- Auto-create profile + role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'practitioner');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

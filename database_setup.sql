-- =====================================================
-- AgencyFlow Database Setup Script
-- =====================================================
-- This script creates the complete database schema for AgencyFlow
-- Run this on a fresh Supabase project to set up all tables, relationships, and policies
--
-- PREREQUISITES:
-- 1. auth.users table exists (created by Supabase Auth)
-- 2. public.profiles table exists and is linked to auth.users
--
-- IMPORTANT: This script does NOT drop auth.users or profiles!
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Create ENUM Types
-- =====================================================

CREATE TYPE public.project_category AS ENUM (
  'web_design', 'app_dev', 'social_campaign', 'tv_commercial', 'on_air_promotion',
  'event', 'user_experience', 'consulting', 'other'
);

CREATE TYPE public.project_status AS ENUM ('planned', 'active', 'on_hold', 'completed', 'cancelled');

CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'review', 'done');

CREATE TYPE public.asset_type AS ENUM ('design', 'video', 'document', 'image', 'audio', 'code', 'other');

CREATE TYPE public.asset_status AS ENUM ('upload', 'internal_review', 'client_review', 'approved', 'rejected', 'final');

CREATE TYPE public.doc_type AS ENUM ('quote', 'invoice', 'credit_note');

CREATE TYPE public.doc_status AS ENUM ('draft', 'sent', 'approved', 'paid', 'overdue', 'cancelled');

CREATE TYPE public.time_status AS ENUM ('submitted', 'approved', 'rejected', 'billed');

CREATE TYPE public.service_category_enum AS ENUM ('CONSULTING', 'CREATION', 'PRODUCTION', 'MANAGEMENT', 'LOGISTICS');

-- =====================================================
-- STEP 2: Create Tables (in dependency order)
-- =====================================================

-- 2.1 CLIENTS (no dependencies)
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  company_name TEXT NOT NULL,
  address_line1 TEXT,
  zip_code TEXT,
  city TEXT,
  country TEXT DEFAULT 'Germany',
  vat_id TEXT,
  payment_terms_days INTEGER DEFAULT 30,
  website TEXT,
  logo_url TEXT,
  notes TEXT
);

-- 2.2 CLIENT CONTACTS (depends on clients)
CREATE TABLE public.client_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  position TEXT,
  email TEXT,
  phone TEXT,
  is_primary BOOLEAN DEFAULT false,
  notes TEXT
);

-- 2.3 SENIORITY LEVELS (no dependencies)
CREATE TABLE public.seniority_levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT UNIQUE NOT NULL,
  level_order INTEGER UNIQUE NOT NULL,
  description TEXT
);

-- 2.4 SERVICE MODULES (no dependencies)
CREATE TABLE public.service_modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT UNIQUE NOT NULL,
  category public.service_category_enum NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true
);

-- 2.5 SERVICE PRICING (depends on service_modules, seniority_levels)
CREATE TABLE public.service_pricing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  service_module_id UUID NOT NULL REFERENCES public.service_modules(id) ON DELETE CASCADE,
  seniority_level_id UUID NOT NULL REFERENCES public.seniority_levels(id) ON DELETE CASCADE,
  rate NUMERIC NOT NULL DEFAULT 0,
  internal_cost NUMERIC NOT NULL DEFAULT 0,
  margin_percentage NUMERIC GENERATED ALWAYS AS (
    CASE WHEN rate > 0 THEN ((rate - internal_cost) / rate * 100) ELSE 0 END
  ) STORED,
  UNIQUE(service_module_id, seniority_level_id)
);

-- 2.6 PROJECTS (depends on clients, profiles)
CREATE TABLE public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  project_manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category public.project_category,
  status public.project_status DEFAULT 'planned',
  start_date DATE,
  end_date DATE,
  budget NUMERIC DEFAULT 0,
  actual_cost NUMERIC DEFAULT 0
);

-- 2.7 TASKS (depends on projects, profiles, service_modules, seniority_levels)
CREATE TABLE public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  description TEXT,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  service_module_id UUID REFERENCES public.service_modules(id) ON DELETE SET NULL,
  seniority_level_id UUID REFERENCES public.seniority_levels(id) ON DELETE SET NULL,
  status public.task_status DEFAULT 'todo',
  priority INTEGER DEFAULT 0,
  estimated_hours NUMERIC DEFAULT 0,
  actual_hours NUMERIC DEFAULT 0,
  due_date DATE
);

-- 2.8 ASSETS (depends on projects, profiles)
CREATE TABLE public.assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  asset_type public.asset_type DEFAULT 'other',
  status public.asset_status DEFAULT 'upload',
  version INTEGER DEFAULT 1,
  notes TEXT
);

-- 2.9 TIME ENTRIES (depends on projects, profiles)
CREATE TABLE public.time_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  hours NUMERIC NOT NULL,
  description TEXT,
  status public.time_status DEFAULT 'submitted',
  billable BOOLEAN DEFAULT true
);

-- 2.10 FINANCIAL DOCUMENTS (depends on clients, profiles)
CREATE TABLE public.financial_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  doc_type public.doc_type NOT NULL,
  doc_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  issue_date DATE NOT NULL,
  due_date DATE,
  status public.doc_status DEFAULT 'draft',
  subtotal NUMERIC DEFAULT 0,
  tax_rate NUMERIC DEFAULT 19,
  tax_amount NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  notes TEXT
);

-- 2.11 FINANCIAL ITEMS (depends on financial_documents, service_modules)
CREATE TABLE public.financial_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  document_id UUID NOT NULL REFERENCES public.financial_documents(id) ON DELETE CASCADE,
  service_module_id UUID REFERENCES public.service_modules(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- 2.12 NOTIFICATIONS (depends on profiles)
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT false,
  link TEXT
);

-- =====================================================
-- STEP 3: Create Indexes
-- =====================================================

CREATE INDEX idx_client_contacts_client ON public.client_contacts(client_id);
CREATE INDEX idx_projects_client_id ON public.projects(client_id);
CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX idx_assets_project_id ON public.assets(project_id);
CREATE INDEX idx_time_entries_project_id ON public.time_entries(project_id);
CREATE INDEX idx_service_pricing_module ON public.service_pricing(service_module_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);

-- =====================================================
-- STEP 4: Create Helper Functions
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_internal()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'employee', 'freelancer')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_my_client_id()
RETURNS UUID AS $$
DECLARE
  v_client_id UUID;
BEGIN
  SELECT client_id INTO v_client_id
  FROM public.profiles
  WHERE id = auth.uid();
  RETURN v_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_team_directory()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.email, p.full_name, p.role::TEXT, p.avatar_url
  FROM public.profiles p
  WHERE p.role IN ('admin', 'employee', 'freelancer')
  ORDER BY p.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 5: Enable RLS on All Tables
-- =====================================================

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seniority_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 6: Create RLS Policies
-- =====================================================

-- CLIENTS: All authenticated users can read, admins can write
CREATE POLICY "Authenticated users can view clients" 
ON public.clients FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage clients" 
ON public.clients FOR ALL 
USING (public.is_internal());

-- CLIENT CONTACTS: All authenticated users can read, admins can write
CREATE POLICY "Authenticated users can view client contacts" 
ON public.client_contacts FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage client contacts" 
ON public.client_contacts FOR ALL 
USING (public.is_internal());

-- SENIORITY LEVELS: All authenticated users can read, admins can write
CREATE POLICY "Authenticated users can view seniority levels" 
ON public.seniority_levels FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage seniority levels" 
ON public.seniority_levels FOR ALL 
USING (public.is_internal());

-- SERVICE MODULES: All authenticated users can read, admins can write
CREATE POLICY "Authenticated users can view service modules" 
ON public.service_modules FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage service modules" 
ON public.service_modules FOR ALL 
USING (public.is_internal());

-- SERVICE PRICING: All authenticated users can read, admins can write
CREATE POLICY "Authenticated users can view service pricing" 
ON public.service_pricing FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage service pricing" 
ON public.service_pricing FOR ALL 
USING (public.is_internal());

-- PROJECTS: Internal users can view all, manage based on role
CREATE POLICY "Internal users can view all projects" 
ON public.projects FOR SELECT 
USING (public.is_internal());

CREATE POLICY "Internal users can manage projects" 
ON public.projects FOR ALL 
USING (public.is_internal());

-- TASKS: Internal users can view all, manage based on role
CREATE POLICY "Internal users can view all tasks" 
ON public.tasks FOR SELECT 
USING (public.is_internal());

CREATE POLICY "Internal users can manage tasks" 
ON public.tasks FOR ALL 
USING (public.is_internal());

-- ASSETS: Internal users can view all, manage based on role
CREATE POLICY "Internal users can view all assets" 
ON public.assets FOR SELECT 
USING (public.is_internal());

CREATE POLICY "Internal users can manage assets" 
ON public.assets FOR ALL 
USING (public.is_internal());

-- TIME ENTRIES: Users can view own, admins can view all
CREATE POLICY "Users can view own time entries" 
ON public.time_entries FOR SELECT 
USING (user_id = auth.uid() OR public.is_internal());

CREATE POLICY "Users can manage own time entries" 
ON public.time_entries FOR ALL 
USING (user_id = auth.uid() OR public.is_internal());

-- FINANCIAL DOCUMENTS: Internal users only
CREATE POLICY "Internal users can view financial documents" 
ON public.financial_documents FOR SELECT 
USING (public.is_internal());

CREATE POLICY "Internal users can manage financial documents" 
ON public.financial_documents FOR ALL 
USING (public.is_internal());

-- FINANCIAL ITEMS: Internal users only
CREATE POLICY "Internal users can view financial items" 
ON public.financial_items FOR SELECT 
USING (public.is_internal());

CREATE POLICY "Internal users can manage financial items" 
ON public.financial_items FOR ALL 
USING (public.is_internal());

-- NOTIFICATIONS: Users can view own
CREATE POLICY "Users can view own notifications" 
ON public.notifications FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can manage own notifications" 
ON public.notifications FOR ALL 
USING (user_id = auth.uid());

-- =====================================================
-- STEP 7: Seed Data
-- =====================================================

-- Insert seniority levels with specific IDs (for CSV compatibility)
INSERT INTO public.seniority_levels (id, name, level_order, description) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Junior', 1, 'Entry-level position'),
  ('22222222-2222-2222-2222-222222222222', 'Intermediate', 2, 'Mid-level position'),
  ('33333333-3333-3333-3333-333333333333', 'Senior', 3, 'Senior-level position'),
  ('44444444-4444-4444-4444-444444444444', 'Expert', 4, 'Expert-level position');

-- =====================================================
-- STEP 8: Reload Schema Cache (CRITICAL!)
-- =====================================================

NOTIFY pgrst, 'reload schema';

COMMIT;

-- =====================================================
-- Setup Complete!
-- =====================================================
-- Next steps:
-- 1. Import CSV data for service_modules, service_pricing, clients, client_contacts
-- 2. Set admin role: UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email@example.com';
-- 3. Reload your application
-- =====================================================

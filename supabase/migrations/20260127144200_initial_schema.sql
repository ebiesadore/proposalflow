-- NeXSYS CORE™ Initial Schema Migration
-- Creates core tables for authentication, clients, proposals, and templates

-- =====================================================
-- 1. TYPES (ENUMs)
-- =====================================================

DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM ('admin', 'manager', 'user');

DROP TYPE IF EXISTS public.client_status CASCADE;
CREATE TYPE public.client_status AS ENUM ('Active', 'Inactive', 'Pending');

DROP TYPE IF EXISTS public.proposal_status CASCADE;
CREATE TYPE public.proposal_status AS ENUM ('Draft', 'Pending', 'Won', 'Lost', 'Archived');

DROP TYPE IF EXISTS public.template_status CASCADE;
CREATE TYPE public.template_status AS ENUM ('Active', 'Archived', 'Draft');

-- =====================================================
-- 2. CORE TABLES
-- =====================================================

-- User Profiles Table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role public.user_role DEFAULT 'user'::public.user_role,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Clients Table
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    logo TEXT,
    logo_alt TEXT,
    primary_contact TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    industry TEXT,
    location TEXT,
    status public.client_status DEFAULT 'Active'::public.client_status,
    client_since TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Proposals Table
CREATE TABLE IF NOT EXISTS public.proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    value TEXT,
    status public.proposal_status DEFAULT 'Draft'::public.proposal_status,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Templates Table
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    status public.template_status DEFAULT 'Active'::public.template_status,
    content JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON public.user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_proposals_user_id ON public.proposals(user_id);
CREATE INDEX IF NOT EXISTS idx_proposals_client_id ON public.proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON public.templates(user_id);

-- =====================================================
-- 4. FUNCTIONS (BEFORE RLS POLICIES)
-- =====================================================

-- Trigger function to create user_profiles automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'user'::public.user_role)
    );
    RETURN NEW;
END;
$$;

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. RLS POLICIES (AFTER FUNCTIONS)
-- =====================================================

-- User Profiles Policies
DROP POLICY IF EXISTS "users_manage_own_user_profiles" ON public.user_profiles;
CREATE POLICY "users_manage_own_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Clients Policies
DROP POLICY IF EXISTS "users_manage_own_clients" ON public.clients;
CREATE POLICY "users_manage_own_clients"
ON public.clients
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Proposals Policies
DROP POLICY IF EXISTS "users_manage_own_proposals" ON public.proposals;
CREATE POLICY "users_manage_own_proposals"
ON public.proposals
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Templates Policies
DROP POLICY IF EXISTS "users_manage_own_templates" ON public.templates;
CREATE POLICY "users_manage_own_templates"
ON public.templates
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 8. MOCK DATA
-- =====================================================

DO $$
DECLARE
    admin_uuid UUID := gen_random_uuid();
    manager_uuid UUID := gen_random_uuid();
    user_uuid UUID := gen_random_uuid();
    client1_uuid UUID := gen_random_uuid();
    client2_uuid UUID := gen_random_uuid();
BEGIN
    -- Create auth users (trigger creates user_profiles automatically)
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES
        (admin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'admin@nexsyscore.com', crypt('Admin@2026', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'Admin User', 'role', 'admin'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (manager_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'manager@nexsyscore.com', crypt('Manager@2026', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'Manager User', 'role', 'manager'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (user_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'user@nexsyscore.com', crypt('User@2026', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'Standard User', 'role', 'user'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null)
    ON CONFLICT (id) DO NOTHING;

    -- Create sample clients
    INSERT INTO public.clients (id, user_id, company_name, logo, logo_alt, primary_contact, email, phone, industry, location, status, client_since, description)
    VALUES
        (client1_uuid, admin_uuid, 'TechVision Solutions', 'https://img.rocket.new/generatedImages/rocket_gen_img_1fc28eaa7-1764648368637.png', 'Modern tech company logo with blue gradient and geometric shapes on white background', 'Sarah Mitchell', 'sarah.mitchell@techvision.com', '+1 (555) 123-4567', 'Technology', 'San Francisco, CA', 'Active'::public.client_status, '2023', 'TechVision Solutions is a leading provider of enterprise software solutions specializing in cloud infrastructure and digital transformation services.'),
        (client2_uuid, admin_uuid, 'Global Finance Corp', 'https://img.rocket.new/generatedImages/rocket_gen_img_175c27d30-1767558611401.png', 'Professional financial services logo with gold and navy blue colors featuring abstract building design', 'Michael Chen', 'm.chen@globalfinance.com', '+1 (555) 234-5678', 'Finance', 'New York, NY', 'Active'::public.client_status, '2024', 'Global Finance Corp provides comprehensive financial services to enterprise clients worldwide.')
    ON CONFLICT (id) DO NOTHING;

    -- Create sample proposals
    INSERT INTO public.proposals (user_id, client_id, title, description, value, status)
    VALUES
        (admin_uuid, client1_uuid, 'Cloud Migration Project', 'Complete infrastructure migration to AWS cloud platform', '$450,000', 'Pending'::public.proposal_status),
        (admin_uuid, client1_uuid, 'Security Audit Services', 'Comprehensive security assessment and implementation', '$180,000', 'Won'::public.proposal_status),
        (admin_uuid, client2_uuid, 'Financial System Integration', 'Integration of legacy systems with modern platforms', '$320,000', 'Draft'::public.proposal_status)
    ON CONFLICT (id) DO NOTHING;

    -- Create sample templates
    INSERT INTO public.templates (user_id, name, description, category, status)
    VALUES
        (admin_uuid, 'Standard Proposal Template', 'Default template for standard proposals', 'General', 'Active'::public.template_status),
        (admin_uuid, 'Technical Proposal Template', 'Template for technical service proposals', 'Technical', 'Active'::public.template_status),
        (admin_uuid, 'Financial Services Template', 'Specialized template for financial sector', 'Finance', 'Active'::public.template_status)
    ON CONFLICT (id) DO NOTHING;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Mock data insertion failed: %', SQLERRM;
END $$;
-- ============================================================
-- Client Documents: Table + Storage Buckets + RLS Policies
-- ============================================================

-- 1. ENUM TYPES
DROP TYPE IF EXISTS public.document_type_enum CASCADE;
CREATE TYPE public.document_type_enum AS ENUM ('legal', 'financial', 'contractual', 'correspondence');

DROP TYPE IF EXISTS public.document_sensitivity_enum CASCADE;
CREATE TYPE public.document_sensitivity_enum AS ENUM ('high', 'medium', 'low');

-- 2. TABLE
CREATE TABLE IF NOT EXISTS public.client_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    document_name TEXT NOT NULL,
    document_type public.document_type_enum NOT NULL,
    file_path TEXT NOT NULL,
    bucket_name TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    sensitivity public.document_sensitivity_enum NOT NULL DEFAULT 'low',
    expiry_date DATE,
    uploaded_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_client_documents_client_id ON public.client_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_uploaded_by ON public.client_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_client_documents_document_type ON public.client_documents(document_type);

-- 4. ENABLE RLS
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES — scoped to client owner via clients table
-- Helper function: check if current user owns the client
CREATE OR REPLACE FUNCTION public.user_owns_client(p_client_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = p_client_id AND c.user_id = auth.uid()
)
$$;

DROP POLICY IF EXISTS "users_select_own_client_documents" ON public.client_documents;
CREATE POLICY "users_select_own_client_documents"
ON public.client_documents
FOR SELECT
TO authenticated
USING (public.user_owns_client(client_id));

DROP POLICY IF EXISTS "users_insert_own_client_documents" ON public.client_documents;
CREATE POLICY "users_insert_own_client_documents"
ON public.client_documents
FOR INSERT
TO authenticated
WITH CHECK (public.user_owns_client(client_id));

DROP POLICY IF EXISTS "users_update_own_client_documents" ON public.client_documents;
CREATE POLICY "users_update_own_client_documents"
ON public.client_documents
FOR UPDATE
TO authenticated
USING (public.user_owns_client(client_id))
WITH CHECK (public.user_owns_client(client_id));

DROP POLICY IF EXISTS "users_delete_own_client_documents" ON public.client_documents;
CREATE POLICY "users_delete_own_client_documents"
ON public.client_documents
FOR DELETE
TO authenticated
USING (public.user_owns_client(client_id));

-- 6. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'client-documents-private',
    'client-documents-private',
    false,
    10485760,
    ARRAY['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'client-documents-general',
    'client-documents-general',
    false,
    10485760,
    ARRAY['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO NOTHING;

-- 7. STORAGE RLS POLICIES — private bucket
DROP POLICY IF EXISTS "auth_users_upload_private_docs" ON storage.objects;
CREATE POLICY "auth_users_upload_private_docs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'client-documents-private');

DROP POLICY IF EXISTS "auth_users_select_private_docs" ON storage.objects;
CREATE POLICY "auth_users_select_private_docs"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'client-documents-private');

DROP POLICY IF EXISTS "auth_users_delete_private_docs" ON storage.objects;
CREATE POLICY "auth_users_delete_private_docs"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'client-documents-private');

-- 8. STORAGE RLS POLICIES — general bucket
DROP POLICY IF EXISTS "auth_users_upload_general_docs" ON storage.objects;
CREATE POLICY "auth_users_upload_general_docs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'client-documents-general');

DROP POLICY IF EXISTS "auth_users_select_general_docs" ON storage.objects;
CREATE POLICY "auth_users_select_general_docs"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'client-documents-general');

DROP POLICY IF EXISTS "auth_users_delete_general_docs" ON storage.objects;
CREATE POLICY "auth_users_delete_general_docs"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'client-documents-general');

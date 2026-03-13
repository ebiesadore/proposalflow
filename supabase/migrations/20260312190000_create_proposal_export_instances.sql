-- Proposal Export Instances: per-proposal customised export copies
-- Creates proposal_export_instances table and proposal-exports storage bucket

-- ============================================================
-- 1. TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.proposal_export_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.export_templates(id) ON DELETE CASCADE,
    proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
    custom_layout_json JSONB NOT NULL DEFAULT '{}',
    generated_files JSONB NOT NULL DEFAULT '[]',
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_modified TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_proposal_export_instances_template_id
    ON public.proposal_export_instances(template_id);

CREATE INDEX IF NOT EXISTS idx_proposal_export_instances_proposal_id
    ON public.proposal_export_instances(proposal_id);

CREATE INDEX IF NOT EXISTS idx_proposal_export_instances_created_by
    ON public.proposal_export_instances(created_by);

-- ============================================================
-- 3. FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_export_instance_last_modified()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.last_modified = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- ============================================================
-- 4. ENABLE RLS
-- ============================================================

ALTER TABLE public.proposal_export_instances ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. RLS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "users_manage_own_proposal_export_instances" ON public.proposal_export_instances;
CREATE POLICY "users_manage_own_proposal_export_instances"
ON public.proposal_export_instances
FOR ALL
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- ============================================================
-- 6. TRIGGER
-- ============================================================

DROP TRIGGER IF EXISTS update_proposal_export_instances_last_modified ON public.proposal_export_instances;
CREATE TRIGGER update_proposal_export_instances_last_modified
    BEFORE UPDATE ON public.proposal_export_instances
    FOR EACH ROW
    EXECUTE FUNCTION public.update_export_instance_last_modified();

-- ============================================================
-- 7. STORAGE BUCKET for proposal exports
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'proposal-exports',
    'proposal-exports',
    false,
    52428800,
    ARRAY[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
    ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for proposal-exports bucket
DROP POLICY IF EXISTS "users_upload_own_proposal_exports" ON storage.objects;
CREATE POLICY "users_upload_own_proposal_exports"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'proposal-exports'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "users_read_own_proposal_exports" ON storage.objects;
CREATE POLICY "users_read_own_proposal_exports"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'proposal-exports'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "users_delete_own_proposal_exports" ON storage.objects;
CREATE POLICY "users_delete_own_proposal_exports"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'proposal-exports'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

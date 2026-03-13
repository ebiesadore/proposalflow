-- Create proposal_versions table for versioning system
-- Option B: Separate table with JSONB snapshots

DROP TYPE IF EXISTS public.version_status_type CASCADE;
CREATE TYPE public.version_status_type AS ENUM ('draft', 'under_review', 'approved', 'superseded');

CREATE TABLE IF NOT EXISTS public.proposal_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    version_label TEXT,
    snapshot JSONB NOT NULL DEFAULT '{}',
    version_status public.version_status_type NOT NULL DEFAULT 'draft',
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    versioned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    change_notes TEXT,
    proposal_value NUMERIC DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_proposal_versions_proposal_id ON public.proposal_versions(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_versions_created_by ON public.proposal_versions(created_by);
CREATE INDEX IF NOT EXISTS idx_proposal_versions_versioned_at ON public.proposal_versions(versioned_at DESC);

-- Enable RLS
ALTER TABLE public.proposal_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "users_manage_own_proposal_versions" ON public.proposal_versions;
CREATE POLICY "users_manage_own_proposal_versions"
ON public.proposal_versions
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.proposals p
        WHERE p.id = proposal_versions.proposal_id
        AND p.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.proposals p
        WHERE p.id = proposal_versions.proposal_id
        AND p.user_id = auth.uid()
    )
);

-- Fix proposal_versions RLS policy to not depend on proposals table during cascade delete.
--
-- ROOT CAUSE: The original RLS policy used a subquery:
--   EXISTS (SELECT 1 FROM proposals p WHERE p.id = proposal_versions.proposal_id AND p.user_id = auth.uid())
--
-- When Postgres CASCADE-deletes proposal_versions after a proposal is deleted, the parent
-- proposal row is already gone. The subquery returns no rows → RLS blocks the cascade →
-- the delete hangs or fails with a foreign key violation.
--
-- FIX: Replace the subquery-based policy with a direct ownership check using created_by = auth.uid().
-- This works for both direct deletes (pre-delete step) and cascade deletes.
-- We also add a helper function so SELECT/INSERT/UPDATE can still verify proposal ownership
-- without causing cascade issues on DELETE.

-- Drop the old policy
DROP POLICY IF EXISTS "users_manage_own_proposal_versions" ON public.proposal_versions;

-- SELECT / INSERT / UPDATE: still verify via proposal ownership (proposal exists at this point)
DROP POLICY IF EXISTS "users_select_own_proposal_versions" ON public.proposal_versions;
CREATE POLICY "users_select_own_proposal_versions"
ON public.proposal_versions
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.proposals p
        WHERE p.id = proposal_versions.proposal_id
          AND p.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "users_insert_own_proposal_versions" ON public.proposal_versions;
CREATE POLICY "users_insert_own_proposal_versions"
ON public.proposal_versions
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.proposals p
        WHERE p.id = proposal_versions.proposal_id
          AND p.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "users_update_own_proposal_versions" ON public.proposal_versions;
CREATE POLICY "users_update_own_proposal_versions"
ON public.proposal_versions
FOR UPDATE
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

-- DELETE: use created_by = auth.uid() so this works even when the parent proposal is already gone
-- (i.e. during cascade delete or the explicit pre-delete step in deleteProposal).
DROP POLICY IF EXISTS "users_delete_own_proposal_versions" ON public.proposal_versions;
CREATE POLICY "users_delete_own_proposal_versions"
ON public.proposal_versions
FOR DELETE
TO authenticated
USING (
    created_by = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.proposals p
        WHERE p.id = proposal_versions.proposal_id
          AND p.user_id = auth.uid()
    )
);

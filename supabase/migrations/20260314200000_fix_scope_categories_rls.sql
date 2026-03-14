-- Fix scope_categories RLS: allow all authenticated users to insert/update/delete categories

-- Drop the admin-only policy
DROP POLICY IF EXISTS "admin_manage_scope_categories" ON public.scope_categories;

-- Allow all authenticated users to manage categories (insert/update/delete)
CREATE POLICY "authenticated_manage_scope_categories"
ON public.scope_categories
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

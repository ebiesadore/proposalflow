-- Fix infinite recursion in admin policy for user_profiles
-- Root cause: Policy queries user_profiles to check admin role, causing circular dependency
-- Solution: Two-tier approach - allow SELECT for all, then check admin for writes

-- Drop the problematic policies
DROP POLICY IF EXISTS "admins_manage_all_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "users_manage_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "users_can_view_other_profiles" ON public.user_profiles;

-- Drop the old function that doesn't work
DROP FUNCTION IF EXISTS public.is_admin_from_auth();

-- Policy 1: Allow all authenticated users to SELECT from user_profiles
-- This is safe and prevents recursion in admin checks
CREATE POLICY "authenticated_users_can_view_profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Users can INSERT, UPDATE, DELETE their own profile
CREATE POLICY "users_manage_own_profile"
ON public.user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Create safe admin check function
-- This works because SELECT policy above allows reading user_profiles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
$$;

-- Policy 3: Admins can INSERT, UPDATE, DELETE any profile
-- This works because the function can now safely query user_profiles (SELECT is allowed)
CREATE POLICY "admins_manage_all_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Note: The key insight is that SELECT must be allowed BEFORE the admin check function
-- can query the table. This breaks the circular dependency.
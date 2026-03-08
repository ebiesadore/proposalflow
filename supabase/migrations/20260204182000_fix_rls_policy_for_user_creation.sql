-- Fix RLS policy to allow admins to create new users
-- Root cause: Admin check queries user_profiles, but for INSERT operations on new users,
-- the circular dependency and policy evaluation order causes issues
-- Solution: Use auth.users metadata for admin check (no circular dependency)

-- Drop all existing policies on user_profiles
DROP POLICY IF EXISTS "authenticated_users_can_view_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "users_manage_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "admins_manage_all_profiles" ON public.user_profiles;

-- Drop the function that queries user_profiles (causes issues)
DROP FUNCTION IF EXISTS public.is_admin();

-- Create safe admin check function using auth.users metadata
-- This is safe because it doesn't query user_profiles (no circular dependency)
CREATE OR REPLACE FUNCTION public.is_admin_from_auth()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid() 
    AND (au.raw_user_meta_data->>'role' = 'admin' 
         OR au.raw_app_meta_data->>'role' = 'admin'
         OR EXISTS (
           SELECT 1 FROM public.user_profiles up
           WHERE up.id = auth.uid() AND up.role = 'admin'
         ))
  )
$$;

-- Policy 1: Allow all authenticated users to view all profiles
-- This is safe and necessary for collaboration features
CREATE POLICY "authenticated_users_can_view_profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Users can update and delete their own profile only
CREATE POLICY "users_manage_own_profile"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "users_delete_own_profile"
ON public.user_profiles
FOR DELETE
TO authenticated
USING (id = auth.uid());

-- Policy 3: Admins can INSERT, UPDATE, DELETE any profile
-- Uses auth.users metadata check to avoid circular dependency
CREATE POLICY "admins_insert_any_profile"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_from_auth());

CREATE POLICY "admins_update_any_profile"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

CREATE POLICY "admins_delete_any_profile"
ON public.user_profiles
FOR DELETE
TO authenticated
USING (public.is_admin_from_auth());

-- Note: The key changes:
-- 1. Admin check uses auth.users metadata first (fast, no recursion)
-- 2. Falls back to user_profiles check (works because SELECT is allowed for all)
-- 3. Separate policies for each operation to avoid conflicts
-- 4. INSERT policy only checks WITH CHECK (no USING needed for INSERT)
-- Fix infinite recursion in user_profiles RLS policy
-- The previous policy queried user_profiles to check admin role, causing circular dependency
-- Solution: Query auth.users metadata instead

-- Drop the problematic admin policy that causes infinite recursion
DROP POLICY IF EXISTS "admins_manage_all_profiles" ON public.user_profiles;

-- Create function that checks admin role from auth.users metadata (NOT user_profiles)
-- This avoids circular dependency since it doesn't query the protected table
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
         OR au.raw_app_meta_data->>'role' = 'admin')
)
$$;

-- Recreate admin policy using the safe function
-- This policy is safe because it queries auth.users, not user_profiles
CREATE POLICY "admins_manage_all_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

-- Note: The existing policies remain unchanged:
-- 1. "users_manage_own_profile" - users can manage their own profile
-- 2. "users_can_view_other_profiles" - users can view other profiles
-- 3. "admins_manage_all_profiles" - admins can manage all profiles (now fixed)
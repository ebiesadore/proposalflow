-- Add RLS policy to allow admins to manage all user profiles
-- This fixes the "new row violates row-level security policy" error when creating users

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "users_manage_own_user_profiles" ON public.user_profiles;

-- Policy 1: Users can view and update their own profile
CREATE POLICY "users_manage_own_profile"
ON public.user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Policy 2: Admins can manage all user profiles (view, insert, update, delete)
CREATE POLICY "admins_manage_all_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy 3: Allow users to view other users (for collaboration features)
CREATE POLICY "users_can_view_other_profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (true);
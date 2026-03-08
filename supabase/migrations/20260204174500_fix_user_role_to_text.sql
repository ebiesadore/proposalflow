-- Fix user_profiles.role column to support custom roles
-- Change from enum to TEXT to allow flexible role names from roles table

-- Step 1: Drop policies that depend on the role column
DROP POLICY IF EXISTS "admins_can_manage_roles" ON public.roles;

-- Step 2: Drop the default constraint
ALTER TABLE public.user_profiles 
  ALTER COLUMN role DROP DEFAULT;

-- Step 3: Change the column type from enum to TEXT
ALTER TABLE public.user_profiles 
  ALTER COLUMN role TYPE TEXT USING role::TEXT;

-- Step 4: Set new default
ALTER TABLE public.user_profiles 
  ALTER COLUMN role SET DEFAULT 'user';

-- Step 5: Recreate the policy with TEXT comparison
CREATE POLICY "admins_can_manage_roles"
ON public.roles
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

-- Step 6: Update the trigger function to use TEXT instead of enum
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: We keep the user_role enum type for backward compatibility
-- but it's no longer used by user_profiles table
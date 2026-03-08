-- Extend user_profiles table with user management fields
-- This migration adds columns needed for the user management system

-- Add new columns to user_profiles table
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS permission_level TEXT DEFAULT 'view',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active',
ADD COLUMN IF NOT EXISTS employee_id TEXT,
ADD COLUMN IF NOT EXISTS join_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_department ON public.user_profiles(department);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON public.user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_employee_id ON public.user_profiles(employee_id);

-- Update existing users with default values if needed
DO $$
BEGIN
    UPDATE public.user_profiles
    SET 
        status = COALESCE(status, 'Active'),
        permission_level = COALESCE(permission_level, 'view'),
        join_date = COALESCE(join_date, created_at),
        last_login = COALESCE(last_login, created_at)
    WHERE status IS NULL OR permission_level IS NULL OR join_date IS NULL;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Update existing users failed: %', SQLERRM;
END $$;
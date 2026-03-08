-- Add theme_preference column to user_profiles table
-- This allows storing user's dark/light mode preference with cross-device sync

-- Add theme_preference column
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'system';

-- Add check constraint to ensure valid theme values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_profiles_theme_preference_check'
    ) THEN
        ALTER TABLE public.user_profiles
        ADD CONSTRAINT user_profiles_theme_preference_check
        CHECK (theme_preference IN ('light', 'dark', 'system'));
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Constraint creation failed: %', SQLERRM;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_theme_preference 
ON public.user_profiles(theme_preference);

-- Update existing users with default value
DO $$
BEGIN
    UPDATE public.user_profiles
    SET theme_preference = COALESCE(theme_preference, 'system')
    WHERE theme_preference IS NULL;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Update existing users failed: %', SQLERRM;
END $$;
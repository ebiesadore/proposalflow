-- Add project_type column to proposals table
-- Migration: 20260201110000_add_project_type.sql

-- Add project_type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'proposals' 
    AND column_name = 'project_type'
  ) THEN
    ALTER TABLE public.proposals 
    ADD COLUMN project_type TEXT DEFAULT 'Standard';
  END IF;
END $$;

-- Update existing proposals to have a default project_type if null
UPDATE public.proposals 
SET project_type = 'Standard' 
WHERE project_type IS NULL;

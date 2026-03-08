-- Add missing fields to proposals table for proper data linking
-- This migration adds: progress, deadline, estimated_total_budget, project_name

-- Add new columns to proposals table
ALTER TABLE public.proposals
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS estimated_total_budget NUMERIC(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS project_name TEXT;

-- Update existing proposals to have default values
UPDATE public.proposals
SET 
  progress = 0,
  estimated_total_budget = CASE 
    WHEN value IS NOT NULL AND value ~ '^[0-9]+(\.[0-9]+)?$' THEN value::NUMERIC
    ELSE 0
  END,
  project_name = title
WHERE progress IS NULL OR estimated_total_budget IS NULL OR project_name IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_proposals_deadline ON public.proposals(deadline);
CREATE INDEX IF NOT EXISTS idx_proposals_progress ON public.proposals(progress);
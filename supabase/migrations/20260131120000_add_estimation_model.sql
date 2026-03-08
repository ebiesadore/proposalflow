-- Add estimation_model field to proposals table for Materials + Labour tab
-- This migration adds the estimation_model field to track whether Single Module Template or Individual Modules is selected

-- Add new column to proposals table
ALTER TABLE public.proposals
ADD COLUMN IF NOT EXISTS estimation_model TEXT DEFAULT 'single-module';

-- Add check constraint to ensure valid values
ALTER TABLE public.proposals
ADD CONSTRAINT check_estimation_model CHECK (estimation_model IN ('single-module', 'per-module-price'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_proposals_estimation_model ON public.proposals(estimation_model);
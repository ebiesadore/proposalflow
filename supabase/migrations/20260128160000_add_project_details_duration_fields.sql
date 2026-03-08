-- Add JSONB fields for project details and project duration
-- This migration adds fields for storing detailed project information and duration calculations

ALTER TABLE public.proposals
ADD COLUMN IF NOT EXISTS project_details JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS project_duration JSONB DEFAULT '{}'::jsonb;

-- Create indexes for better query performance on JSONB fields
CREATE INDEX IF NOT EXISTS idx_proposals_project_details ON public.proposals USING GIN (project_details);
CREATE INDEX IF NOT EXISTS idx_proposals_project_duration ON public.proposals USING GIN (project_duration);
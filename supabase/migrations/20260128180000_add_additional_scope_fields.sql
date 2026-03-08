-- Add Additional Scope fields to proposals table
-- This migration adds fields for: internal_value_added_scope, margined_sub_contractors, zero_margined_supply

-- Add new JSONB columns to proposals table for Additional Scope data
ALTER TABLE public.proposals
ADD COLUMN IF NOT EXISTS internal_value_added_scope JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS margined_sub_contractors JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS zero_margined_supply JSONB DEFAULT '[]'::jsonb;

-- Create indexes for better query performance on JSONB fields
CREATE INDEX IF NOT EXISTS idx_proposals_internal_value_added_scope ON public.proposals USING GIN (internal_value_added_scope);
CREATE INDEX IF NOT EXISTS idx_proposals_margined_sub_contractors ON public.proposals USING GIN (margined_sub_contractors);
CREATE INDEX IF NOT EXISTS idx_proposals_zero_margined_supply ON public.proposals USING GIN (zero_margined_supply);
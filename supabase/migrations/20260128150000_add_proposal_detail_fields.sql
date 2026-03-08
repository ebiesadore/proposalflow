-- Add JSONB fields to proposals table for storing detailed proposal data
-- This migration adds fields for: modules, milestones, materials, labour, overheads, site_costs, logistics, commission, revenue_centers, financing, risks, payment_terms

-- Add new JSONB columns to proposals table
ALTER TABLE public.proposals
ADD COLUMN IF NOT EXISTS modules JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS milestones JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS materials JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS labour JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS overheads JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS site_costs JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS logistics JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS commission NUMERIC(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS margin_percentage NUMERIC(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS revenue_centers JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS financing JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS risks JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS payment_terms JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;

-- Create indexes for better query performance on JSONB fields
CREATE INDEX IF NOT EXISTS idx_proposals_modules ON public.proposals USING GIN (modules);
CREATE INDEX IF NOT EXISTS idx_proposals_materials ON public.proposals USING GIN (materials);
CREATE INDEX IF NOT EXISTS idx_proposals_risks ON public.proposals USING GIN (risks);
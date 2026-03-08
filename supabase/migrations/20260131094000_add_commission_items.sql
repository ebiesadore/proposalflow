-- Add commission_items JSONB field to proposals table for storing commission line items
-- This migration adds the commission_items field to store detailed commission breakdown

-- Add commission_items column to proposals table
ALTER TABLE public.proposals
ADD COLUMN IF NOT EXISTS commission_items JSONB DEFAULT '[]'::jsonb;

-- Create index for better query performance on commission_items JSONB field
CREATE INDEX IF NOT EXISTS idx_proposals_commission_items ON public.proposals USING GIN (commission_items);
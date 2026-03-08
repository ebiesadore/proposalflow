-- Add new status values to proposal_status enum
-- This migration adds 'Approved' and 'Closed' status options

ALTER TYPE public.proposal_status ADD VALUE IF NOT EXISTS 'Approved';
ALTER TYPE public.proposal_status ADD VALUE IF NOT EXISTS 'Closed';
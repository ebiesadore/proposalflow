-- Fix proposal_status enum by adding missing values
-- This migration properly adds 'Approved' and 'Closed' status options

-- Add 'Approved' value if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'Approved' 
        AND enumtypid = 'public.proposal_status'::regtype
    ) THEN
        ALTER TYPE public.proposal_status ADD VALUE 'Approved';
    END IF;
END $$;

-- Add 'Closed' value if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'Closed' 
        AND enumtypid = 'public.proposal_status'::regtype
    ) THEN
        ALTER TYPE public.proposal_status ADD VALUE 'Closed';
    END IF;
END $$;
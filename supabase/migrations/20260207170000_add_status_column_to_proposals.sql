-- Add status column to proposals table
-- This migration fixes the missing status column error

-- Add status column with default value
ALTER TABLE public.proposals
ADD COLUMN IF NOT EXISTS status public.proposal_status DEFAULT 'Draft'::public.proposal_status;

-- Create index for status column for better query performance
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.proposals(status);

-- Update any existing proposals without status to 'Draft'
DO $$
BEGIN
    UPDATE public.proposals
    SET status = 'Draft'::public.proposal_status
    WHERE status IS NULL;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Status update skipped: %', SQLERRM;
END $$;
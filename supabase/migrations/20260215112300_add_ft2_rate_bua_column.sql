-- Add ft2_rate_bua column to proposals table
-- This stores the calculated Ft² Rate BUA value from the Summary page

ALTER TABLE public.proposals
ADD COLUMN IF NOT EXISTS ft2_rate_bua NUMERIC DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.proposals.ft2_rate_bua IS 'Calculated Ft² Rate BUA from Summary page (Grand Total / Total Ft²)';

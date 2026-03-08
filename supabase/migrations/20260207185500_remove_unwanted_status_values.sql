-- Remove unwanted status values from proposal_status enum
-- Keeping only: Draft, Pending, Approved, Won
-- Removing: Lost, Closed, Archived

-- Step 1: Update any existing proposals with removed statuses to 'Draft'
UPDATE public.proposals
SET status = 'Draft'
WHERE status IN ('Lost', 'Closed', 'Archived');

-- Step 2: Drop the default constraint to allow type change
ALTER TABLE public.proposals 
  ALTER COLUMN status DROP DEFAULT;

-- Step 3: Create new enum type with only desired values
CREATE TYPE public.proposal_status_new AS ENUM ('Draft', 'Pending', 'Approved', 'Won');

-- Step 4: Alter the proposals table to use the new enum
ALTER TABLE public.proposals 
  ALTER COLUMN status TYPE public.proposal_status_new 
  USING status::text::public.proposal_status_new;

-- Step 5: Drop the old enum type
DROP TYPE public.proposal_status;

-- Step 6: Rename the new enum type to the original name
ALTER TYPE public.proposal_status_new RENAME TO proposal_status;

-- Step 7: Re-add the default constraint
ALTER TABLE public.proposals 
  ALTER COLUMN status SET DEFAULT 'Draft'::public.proposal_status;

-- Verify the enum values
DO $$
DECLARE
    enum_values text[];
BEGIN
    SELECT array_agg(enumlabel::text ORDER BY enumsortorder)
    INTO enum_values
    FROM pg_enum
    WHERE enumtypid = 'public.proposal_status'::regtype;
    
    RAISE NOTICE 'Updated proposal_status enum values: %', enum_values;
END $$;
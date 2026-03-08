-- Ensure all proposal_status enum values exist
-- This migration uses proper PostgreSQL syntax to add missing enum values

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

-- Verify all expected enum values exist
DO $$
DECLARE
    enum_values text[];
    expected_values text[] := ARRAY['Draft', 'Pending', 'Won', 'Lost', 'Archived', 'Approved', 'Closed'];
    missing_value text;
BEGIN
    -- Get current enum values
    SELECT array_agg(enumlabel::text ORDER BY enumsortorder)
    INTO enum_values
    FROM pg_enum
    WHERE enumtypid = 'public.proposal_status'::regtype;
    
    -- Check for missing values
    FOREACH missing_value IN ARRAY expected_values
    LOOP
        IF NOT (missing_value = ANY(enum_values)) THEN
            RAISE EXCEPTION 'Missing enum value: %', missing_value;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'All proposal_status enum values verified: %', enum_values;
END $$;
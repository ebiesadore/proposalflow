-- Fix project number generation function and trigger
-- This migration ensures the auto-generation works correctly

-- Drop existing trigger and function to recreate them
DROP TRIGGER IF EXISTS trigger_set_project_number ON public.proposals;
DROP FUNCTION IF EXISTS public.set_project_number();
DROP FUNCTION IF EXISTS public.generate_project_number();

-- Recreate the function to generate next project number in format MP_YY_9XXX
CREATE OR REPLACE FUNCTION public.generate_project_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_year TEXT;
    year_prefix TEXT;
    max_number INTEGER;
    next_number INTEGER;
    new_project_number TEXT;
BEGIN
    -- Get current year in YY format
    current_year := TO_CHAR(CURRENT_DATE, 'YY');
    year_prefix := 'MP_' || current_year || '_9';
    
    -- Find the highest XXX number for current year pattern
    -- This ensures we follow the highest existing number, not just last created
    SELECT COALESCE(MAX(
        CASE 
            WHEN project_number LIKE year_prefix || '%' 
            THEN CAST(SUBSTRING(project_number FROM LENGTH(year_prefix) + 1) AS INTEGER)
            ELSE 0
        END
    ), 0) INTO max_number
    FROM public.proposals
    WHERE project_number IS NOT NULL AND project_number LIKE year_prefix || '%';
    
    -- Increment to get next number
    next_number := max_number + 1;
    
    -- Format as MP_YY_9XXX (pad XXX to 3 digits)
    new_project_number := year_prefix || LPAD(next_number::TEXT, 3, '0');
    
    RETURN new_project_number;
EXCEPTION
    WHEN OTHERS THEN
        -- If any error occurs, return a fallback value
        RAISE NOTICE 'Error generating project number: %', SQLERRM;
        RETURN 'MP_' || TO_CHAR(CURRENT_DATE, 'YY') || '_9001';
END;
$$;

-- Recreate trigger function to auto-generate project_number on insert
CREATE OR REPLACE FUNCTION public.set_project_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only generate if project_number is not provided or is NULL
    IF NEW.project_number IS NULL OR NEW.project_number = '' THEN
        NEW.project_number := public.generate_project_number();
        RAISE NOTICE 'Generated project number: %', NEW.project_number;
    END IF;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in set_project_number trigger: %', SQLERRM;
        -- Still return NEW to allow insert to proceed
        RETURN NEW;
END;
$$;

-- Recreate trigger to auto-generate project_number before insert
CREATE TRIGGER trigger_set_project_number
    BEFORE INSERT ON public.proposals
    FOR EACH ROW
    EXECUTE FUNCTION public.set_project_number();

-- Update any existing proposals that don't have project numbers
DO $$
DECLARE
    proposal_record RECORD;
    generated_number TEXT;
BEGIN
    FOR proposal_record IN 
        SELECT id FROM public.proposals WHERE project_number IS NULL OR project_number = '' ORDER BY created_at ASC
    LOOP
        generated_number := public.generate_project_number();
        UPDATE public.proposals 
        SET project_number = generated_number 
        WHERE id = proposal_record.id;
        RAISE NOTICE 'Updated proposal % with project number %', proposal_record.id, generated_number;
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error updating existing proposals: %', SQLERRM;
END $$;
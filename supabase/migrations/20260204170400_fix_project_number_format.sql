-- Fix project number format to use hyphens (MP26-9xxx) instead of underscores (MP_YY_9XXX)

-- Drop existing trigger and functions
DROP TRIGGER IF EXISTS trigger_set_project_number ON public.proposals;
DROP FUNCTION IF EXISTS public.set_project_number();
DROP FUNCTION IF EXISTS public.generate_project_number();

-- Recreate the function to generate project number in format MP26-9XXX (with hyphens)
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
    year_prefix := 'MP' || current_year || '-9';
    
    -- Find the highest XXX number for current year pattern
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
    
    -- Format as MP26-9XXX (pad XXX to 3 digits)
    new_project_number := year_prefix || LPAD(next_number::TEXT, 3, '0');
    
    RETURN new_project_number;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error generating project number: %', SQLERRM;
        RETURN 'MP' || TO_CHAR(CURRENT_DATE, 'YY') || '-9001';
END;
$$;

-- Recreate trigger function
CREATE OR REPLACE FUNCTION public.set_project_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.project_number IS NULL OR NEW.project_number = '' THEN
        NEW.project_number := public.generate_project_number();
    END IF;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in set_project_number trigger: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER trigger_set_project_number
    BEFORE INSERT ON public.proposals
    FOR EACH ROW
    EXECUTE FUNCTION public.set_project_number();

-- Update existing project numbers from underscore format to hyphen format
UPDATE public.proposals
SET project_number = REPLACE(REPLACE(project_number, 'MP_', 'MP'), '_9', '-9')
WHERE project_number LIKE 'MP_%_%';
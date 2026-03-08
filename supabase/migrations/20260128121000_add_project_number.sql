-- Add project_number column to proposals table
ALTER TABLE public.proposals
ADD COLUMN IF NOT EXISTS project_number TEXT UNIQUE;

-- Create index for project_number
CREATE INDEX IF NOT EXISTS idx_proposals_project_number ON public.proposals(project_number);

-- Function to generate next project number in format MP_YY_9XXX
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
    WHERE project_number LIKE year_prefix || '%';
    
    -- Increment to get next number
    next_number := max_number + 1;
    
    -- Format as MP_YY_9XXX (pad XXX to 3 digits)
    new_project_number := year_prefix || LPAD(next_number::TEXT, 3, '0');
    
    RETURN new_project_number;
END;
$$;

-- Trigger function to auto-generate project_number on insert
CREATE OR REPLACE FUNCTION public.set_project_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only generate if project_number is not provided
    IF NEW.project_number IS NULL THEN
        NEW.project_number := public.generate_project_number();
    END IF;
    RETURN NEW;
END;
$$;

-- Create trigger to auto-generate project_number before insert
DROP TRIGGER IF EXISTS trigger_set_project_number ON public.proposals;
CREATE TRIGGER trigger_set_project_number
    BEFORE INSERT ON public.proposals
    FOR EACH ROW
    EXECUTE FUNCTION public.set_project_number();

-- Update existing proposals with project numbers (if any exist without them)
DO $$
DECLARE
    proposal_record RECORD;
    generated_number TEXT;
BEGIN
    FOR proposal_record IN 
        SELECT id FROM public.proposals WHERE project_number IS NULL ORDER BY created_at ASC
    LOOP
        generated_number := public.generate_project_number();
        UPDATE public.proposals 
        SET project_number = generated_number 
        WHERE id = proposal_record.id;
    END LOOP;
END $$;
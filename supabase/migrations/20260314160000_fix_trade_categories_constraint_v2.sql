-- Fix trade_categories unique constraint: ensure only (value, user_id) composite constraint exists
-- Drop ALL unique constraints on the table first, then add the correct one

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop every unique constraint on trade_categories
    FOR r IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.trade_categories'::regclass
          AND contype = 'u'
    LOOP
        EXECUTE 'ALTER TABLE public.trade_categories DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- Add the correct composite unique constraint
ALTER TABLE public.trade_categories
    ADD CONSTRAINT trade_categories_value_user_id_key UNIQUE (value, user_id);

-- Fix trade_categories unique constraint to be per-user (value + user_id)
-- Drop the existing unique constraint on value alone
DO $$
BEGIN
    -- Drop old unique constraint on value if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.trade_categories'::regclass 
        AND contype = 'u' 
        AND conname LIKE '%value%'
    ) THEN
        ALTER TABLE public.trade_categories DROP CONSTRAINT IF EXISTS trade_categories_value_key;
    END IF;
END $$;

-- Add composite unique constraint on (value, user_id) so each user can have their own categories
ALTER TABLE public.trade_categories 
    DROP CONSTRAINT IF EXISTS trade_categories_value_user_id_key;

ALTER TABLE public.trade_categories 
    ADD CONSTRAINT trade_categories_value_user_id_key UNIQUE (value, user_id);

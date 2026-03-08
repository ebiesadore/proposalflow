-- Add missing status column to clients table
-- This column was defined in the initial schema but is missing from the actual database

-- Ensure the client_status enum exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_status') THEN
        CREATE TYPE public.client_status AS ENUM ('Active', 'Inactive', 'Pending');
    END IF;
END $$;

-- Add status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clients' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.clients 
        ADD COLUMN status public.client_status DEFAULT 'Active'::public.client_status;
        
        -- Update existing rows to have 'Active' status
        UPDATE public.clients 
        SET status = 'Active'::public.client_status 
        WHERE status IS NULL;
    END IF;
END $$;

-- Create index for status column for better query performance
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
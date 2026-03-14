-- Create trade_categories table
CREATE TABLE IF NOT EXISTS public.trade_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    value TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.trade_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own trade categories" ON public.trade_categories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trade categories" ON public.trade_categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trade categories" ON public.trade_categories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trade categories" ON public.trade_categories
    FOR DELETE USING (auth.uid() = user_id);

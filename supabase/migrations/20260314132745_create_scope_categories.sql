-- Create scope_categories table and seed with 20 existing categories

CREATE TABLE IF NOT EXISTS public.scope_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    value TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scope_categories_value ON public.scope_categories(value);

ALTER TABLE public.scope_categories ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read categories
DROP POLICY IF EXISTS "authenticated_read_scope_categories" ON public.scope_categories;
CREATE POLICY "authenticated_read_scope_categories"
ON public.scope_categories
FOR SELECT
TO authenticated
USING (true);

-- Only admins can manage categories (insert/update/delete)
DROP POLICY IF EXISTS "admin_manage_scope_categories" ON public.scope_categories;
CREATE POLICY "admin_manage_scope_categories"
ON public.scope_categories
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.id = auth.uid() AND up.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.id = auth.uid() AND up.role = 'admin'
    )
);

-- Seed the 20 existing hardcoded categories
INSERT INTO public.scope_categories (value, label) VALUES
    ('site_preparation', 'Site Preparation'),
    ('landscaping', 'Landscaping'),
    ('security_systems', 'Security Systems'),
    ('signage', 'Signage'),
    ('furniture', 'Furniture'),
    ('equipment', 'Equipment'),
    ('technology', 'Technology'),
    ('permits', 'Permits & Fees'),
    ('consulting', 'Consulting Services'),
    ('testing', 'Testing & Inspection'),
    ('warranty', 'Warranty & Maintenance'),
    ('vertical_mobility', 'Vertical Mobility'),
    ('facade', 'Facade'),
    ('footing', 'Footing'),
    ('mep', 'MEP'),
    ('shaft', 'Shaft'),
    ('balustrade', 'Balustrade'),
    ('wellness', 'Wellness'),
    ('fit_out', 'Fit Out'),
    ('other', 'Other')
ON CONFLICT (value) DO NOTHING;

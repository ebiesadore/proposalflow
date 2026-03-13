-- Template System: Stage 1 - Backend Data Foundation
-- Creates material_labour_templates, template_material_items, template_labour_items, export_templates

-- ============================================================
-- 1. TYPES
-- ============================================================

DROP TYPE IF EXISTS public.template_type_enum CASCADE;
CREATE TYPE public.template_type_enum AS ENUM ('material', 'labour', 'combined');

DROP TYPE IF EXISTS public.export_template_type_enum CASCADE;
CREATE TYPE public.export_template_type_enum AS ENUM ('pdf', 'word');

-- ============================================================
-- 2. TABLES
-- ============================================================

-- Master template records
CREATE TABLE IF NOT EXISTS public.material_labour_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    template_type public.template_type_enum NOT NULL DEFAULT 'combined',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Template material line items
CREATE TABLE IF NOT EXISTS public.template_material_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.material_labour_templates(id) ON DELETE CASCADE,
    -- Material fields matching the proposal MaterialsLabourTab structure
    item_name TEXT NOT NULL DEFAULT '',
    library_item_id UUID,
    no INTEGER NOT NULL DEFAULT 1,
    supplier TEXT,
    unit TEXT,
    quantity NUMERIC NOT NULL DEFAULT 0,
    unit_cost NUMERIC NOT NULL DEFAULT 0,
    waste_percent NUMERIC NOT NULL DEFAULT 5,
    cost_psqf NUMERIC NOT NULL DEFAULT 0,
    cost_waste_psqf NUMERIC NOT NULL DEFAULT 0,
    cost_waste_psqm NUMERIC NOT NULL DEFAULT 0,
    per_module_price NUMERIC NOT NULL DEFAULT 0,
    notes TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Template labour line items
CREATE TABLE IF NOT EXISTS public.template_labour_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.material_labour_templates(id) ON DELETE CASCADE,
    -- Labour fields matching the proposal MaterialsLabourTab structure
    role TEXT NOT NULL DEFAULT '',
    hours NUMERIC NOT NULL DEFAULT 0,
    rate NUMERIC NOT NULL DEFAULT 0,
    total NUMERIC NOT NULL DEFAULT 0,
    labour_cost_psqf NUMERIC NOT NULL DEFAULT 0,
    notes TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Export template configurations (structure only - no UI yet)
CREATE TABLE IF NOT EXISTS public.export_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    template_type public.export_template_type_enum NOT NULL DEFAULT 'pdf',
    layout_config JSONB NOT NULL DEFAULT '{}',
    cover_page_settings JSONB NOT NULL DEFAULT '{}',
    header_settings JSONB NOT NULL DEFAULT '{}',
    footer_settings JSONB NOT NULL DEFAULT '{}',
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_material_labour_templates_created_by
    ON public.material_labour_templates(created_by);

CREATE INDEX IF NOT EXISTS idx_material_labour_templates_is_active
    ON public.material_labour_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_material_labour_templates_template_type
    ON public.material_labour_templates(template_type);

CREATE INDEX IF NOT EXISTS idx_template_material_items_template_id
    ON public.template_material_items(template_id);

CREATE INDEX IF NOT EXISTS idx_template_labour_items_template_id
    ON public.template_labour_items(template_id);

CREATE INDEX IF NOT EXISTS idx_export_templates_created_by
    ON public.export_templates(created_by);

CREATE INDEX IF NOT EXISTS idx_export_templates_is_default
    ON public.export_templates(is_default);

-- ============================================================
-- 4. FUNCTIONS (before RLS policies)
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_template_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- ============================================================
-- 5. ENABLE RLS
-- ============================================================

ALTER TABLE public.material_labour_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_material_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_labour_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_templates ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. RLS POLICIES
-- ============================================================

-- material_labour_templates: owner-scoped
DROP POLICY IF EXISTS "users_manage_own_material_labour_templates" ON public.material_labour_templates;
CREATE POLICY "users_manage_own_material_labour_templates"
ON public.material_labour_templates
FOR ALL
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- template_material_items: scoped via template ownership
DROP POLICY IF EXISTS "users_manage_own_template_material_items" ON public.template_material_items;
CREATE POLICY "users_manage_own_template_material_items"
ON public.template_material_items
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.material_labour_templates t
        WHERE t.id = template_material_items.template_id
        AND t.created_by = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.material_labour_templates t
        WHERE t.id = template_material_items.template_id
        AND t.created_by = auth.uid()
    )
);

-- template_labour_items: scoped via template ownership
DROP POLICY IF EXISTS "users_manage_own_template_labour_items" ON public.template_labour_items;
CREATE POLICY "users_manage_own_template_labour_items"
ON public.template_labour_items
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.material_labour_templates t
        WHERE t.id = template_labour_items.template_id
        AND t.created_by = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.material_labour_templates t
        WHERE t.id = template_labour_items.template_id
        AND t.created_by = auth.uid()
    )
);

-- export_templates: owner-scoped
DROP POLICY IF EXISTS "users_manage_own_export_templates" ON public.export_templates;
CREATE POLICY "users_manage_own_export_templates"
ON public.export_templates
FOR ALL
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- ============================================================
-- 7. TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS update_material_labour_templates_updated_at ON public.material_labour_templates;
CREATE TRIGGER update_material_labour_templates_updated_at
    BEFORE UPDATE ON public.material_labour_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_template_updated_at();

DROP TRIGGER IF EXISTS update_export_templates_updated_at ON public.export_templates;
CREATE TRIGGER update_export_templates_updated_at
    BEFORE UPDATE ON public.export_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_template_updated_at();

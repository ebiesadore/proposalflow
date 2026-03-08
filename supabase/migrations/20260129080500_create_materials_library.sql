-- Materials Library Migration
-- Creates materials library table for configurable material list

-- =====================================================
-- 1. TYPES (ENUMs)
-- =====================================================

DROP TYPE IF EXISTS public.material_category CASCADE;
CREATE TYPE public.material_category AS ENUM (
  'Structural',
  'Electrical',
  'Plumbing',
  'HVAC',
  'Finishing',
  'Flooring',
  'Roofing',
  'Insulation',
  'Hardware',
  'Other'
);

DROP TYPE IF EXISTS public.material_unit CASCADE;
CREATE TYPE public.material_unit AS ENUM (
  'm',
  'ft',
  'sqm',
  'sqft',
  'cum',
  'cuft',
  'kg',
  'lb',
  'L',
  'gal',
  'piece',
  'box',
  'roll',
  'sheet'
);

-- =====================================================
-- 2. CORE TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.materials_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
    unit public.material_unit NOT NULL DEFAULT 'piece'::public.material_unit,
    category public.material_category NOT NULL DEFAULT 'Other'::public.material_category,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_materials_library_user_id ON public.materials_library(user_id);
CREATE INDEX IF NOT EXISTS idx_materials_library_category ON public.materials_library(category);
CREATE INDEX IF NOT EXISTS idx_materials_library_name ON public.materials_library(name);

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.materials_library ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "users_manage_own_materials_library" ON public.materials_library;
CREATE POLICY "users_manage_own_materials_library"
ON public.materials_library
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 6. MOCK DATA
-- =====================================================

DO $$
DECLARE
    existing_user_id UUID;
BEGIN
    -- Verify user_profiles table exists and get existing user
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_profiles'
    ) THEN
        SELECT id INTO existing_user_id FROM public.user_profiles LIMIT 1;
        
        IF existing_user_id IS NOT NULL THEN
            -- Create sample materials library items
            INSERT INTO public.materials_library (user_id, name, description, unit_cost, unit, category, is_active)
            VALUES 
                (existing_user_id, 'Steel Beam - 10m', 'Structural steel I-beam, 10 meter length', 450.00, 'piece'::public.material_unit, 'Structural'::public.material_category, true),
                (existing_user_id, 'Concrete Mix - Standard', 'Ready-mix concrete, standard grade', 120.00, 'cum'::public.material_unit, 'Structural'::public.material_category, true),
                (existing_user_id, 'Electrical Wiring - Copper', 'Copper electrical wiring, 2.5mm', 85.00, 'm'::public.material_unit, 'Electrical'::public.material_category, true),
                (existing_user_id, 'Plywood Sheet - 4x8', 'Marine grade plywood sheet, 4ft x 8ft', 35.00, 'sheet'::public.material_unit, 'Finishing'::public.material_category, true),
                (existing_user_id, 'Interior Paint - Premium', 'Premium interior wall paint, 5 liter can', 45.00, 'L'::public.material_unit, 'Finishing'::public.material_category, true),
                (existing_user_id, 'PVC Pipe - 4 inch', 'PVC drainage pipe, 4 inch diameter', 12.50, 'm'::public.material_unit, 'Plumbing'::public.material_category, true),
                (existing_user_id, 'Ceramic Floor Tiles', 'Porcelain ceramic floor tiles, 600x600mm', 25.00, 'sqm'::public.material_unit, 'Flooring'::public.material_category, true),
                (existing_user_id, 'Insulation Batts - R3.5', 'Glasswool insulation batts, R3.5 rating', 8.50, 'sqm'::public.material_unit, 'Insulation'::public.material_category, true),
                (existing_user_id, 'Roofing Shingles - Asphalt', 'Asphalt roofing shingles, architectural grade', 32.00, 'sqm'::public.material_unit, 'Roofing'::public.material_category, true),
                (existing_user_id, 'Door Hardware Set', 'Complete door hardware set with handle and lock', 75.00, 'piece'::public.material_unit, 'Hardware'::public.material_category, true)
            ON CONFLICT (id) DO NOTHING;
            
            RAISE NOTICE 'Materials library mock data created successfully';
        ELSE
            RAISE NOTICE 'No existing users found. Run auth migration first.';
        END IF;
    ELSE
        RAISE NOTICE 'Table user_profiles does not exist. Run auth migration first.';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Mock data insertion failed: %', SQLERRM;
END $$;
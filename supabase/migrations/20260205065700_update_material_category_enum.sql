-- Update Material Category Enum to CSI Format
-- Replaces old categories with CSI Division format (XX_Name)

-- =====================================================
-- 1. DROP COLUMN AND OLD ENUM
-- =====================================================

-- Drop the category column first (this removes the dependency)
ALTER TABLE public.materials_library DROP COLUMN IF EXISTS category;

-- Now safely drop the old enum
DROP TYPE IF EXISTS public.material_category CASCADE;

-- =====================================================
-- 2. CREATE NEW ENUM WITH CSI VALUES
-- =====================================================

CREATE TYPE public.material_category AS ENUM (
  '00_Procurement and Contracting Requirements',
  '01_General Requirements',
  '02_Existing Conditions',
  '03_Concrete',
  '04_Masonry',
  '05_Metals',
  '06_Wood, Plastics, and Composites',
  '07_Thermal and Moisture Protection',
  '08_Openings',
  '09_Finishes',
  '10_Specialties',
  '11_Equipment',
  '12_Furnishings',
  '13_Special Construction',
  '14_Conveying Equipment',
  '21_Fire Suppression',
  '22_Plumbing',
  '23_HVAC',
  '25_Integrated Automation',
  '26_Electrical',
  '27_Communications',
  '28_Electronic Safety and Security',
  '31_Earthwork',
  '32_Exterior Improvements',
  '33_Utilities',
  '34_Transportation',
  '35_Waterway and Marine Construction',
  '40_Process Integration',
  '41_Material Processing and Handling Equipment',
  '42_Process Heating, Cooling, and Drying Equipment',
  '43_Process Gas and Liquid Handling',
  '44_Pollution and Waste Control Equipment',
  '45_Industry-Specific Manufacturing Equipment',
  '46_Water and Wastewater Equipment',
  '48_Electrical Power Generation'
);

-- =====================================================
-- 3. ADD COLUMN BACK WITH NEW ENUM
-- =====================================================

-- Add the category column back with the new enum type
ALTER TABLE public.materials_library 
ADD COLUMN category public.material_category NOT NULL DEFAULT '01_General Requirements'::public.material_category;

-- Recreate the index
CREATE INDEX IF NOT EXISTS idx_materials_library_category ON public.materials_library(category);

-- =====================================================
-- 4. CLEAR OLD MOCK DATA
-- =====================================================

DO $$
BEGIN
    -- Delete all existing materials (they were using old categories)
    DELETE FROM public.materials_library;
    
    RAISE NOTICE 'Old material data cleared. Ready for new CSI-formatted entries.';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Data cleanup failed: %', SQLERRM;
END $$;
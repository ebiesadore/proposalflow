-- Add CSI Code column to materials_library table
-- CSI Code format: XX.xx.xx (e.g., 05.12.23)

ALTER TABLE public.materials_library
ADD COLUMN IF NOT EXISTS csi_code TEXT;

-- Add index for CSI code searches
CREATE INDEX IF NOT EXISTS idx_materials_library_csi_code ON public.materials_library(csi_code);

-- Add comment for documentation
COMMENT ON COLUMN public.materials_library.csi_code IS 'CSI MasterFormat code in XX.xx.xx format';
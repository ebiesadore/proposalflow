-- Backfill CSI codes for existing materials
-- This migration adds default CSI codes to materials that don't have them
-- Format: XX.00.00 where XX is the category prefix from the enum value

UPDATE public.materials_library
SET csi_code = CONCAT(SUBSTRING(category::text, 1, 2), '.00.00')
WHERE csi_code IS NULL OR csi_code = '';

-- Add comment
COMMENT ON COLUMN public.materials_library.csi_code IS 'CSI MasterFormat code in XX.xx.xx format (auto-generated from category if not specified)';
-- Fix revenue_centers structure: Change from array to object with revenueType field
-- This ensures the revenueType selection persists correctly

-- Update default value for revenue_centers column to be an object instead of array
ALTER TABLE public.proposals 
  ALTER COLUMN revenue_centers SET DEFAULT '{"revenueType": "chargeable"}'::jsonb;

-- Update existing records that have empty array to proper object structure
UPDATE public.proposals 
SET revenue_centers = '{"revenueType": "chargeable"}'::jsonb 
WHERE revenue_centers = '[]'::jsonb OR revenue_centers IS NULL;

-- Update existing records that have array structure to object structure
-- This handles cases where revenue_centers might have data but in wrong format
UPDATE public.proposals 
SET revenue_centers = jsonb_build_object(
  'revenueType', COALESCE(revenue_centers->>'revenueType', 'chargeable'),
  'chargeableData', COALESCE(revenue_centers->'chargeableData', '{}'::jsonb),
  'marginPercentages', COALESCE(revenue_centers->'marginPercentages', '{}'::jsonb),
  'totalMarginPercent', COALESCE(revenue_centers->'totalMarginPercent', '0'::jsonb)
)
WHERE jsonb_typeof(revenue_centers) = 'array';
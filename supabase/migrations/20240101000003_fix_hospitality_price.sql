-- Migration 003: Fix Hospitality Price Column
-- BUG-006: hospitality_packages.price VARCHAR → NUMERIC(10,2)
-- Strip € prefix from existing data, store clean numeric values

DO $$
BEGIN
  -- Only run if the column is still VARCHAR (idempotency check)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'hospitality_packages' 
      AND column_name = 'price' 
      AND data_type IN ('character varying', 'text')
  ) THEN
    ALTER TABLE public.hospitality_packages 
      ALTER COLUMN price TYPE NUMERIC(10, 2) 
      USING regexp_replace(price, '[^0-9.]', '', 'g')::NUMERIC(10, 2);
  END IF;
END $$;

COMMENT ON COLUMN public.hospitality_packages.price IS 'Unit price in EUR (numeric). Format € symbol on display layer only.';

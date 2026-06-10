-- Migration 002: Fix Transport Schema
-- BUG-003: Add dedicated assigned_driver column (stop corrupting time field)
-- BUG-004: WONTFIX — transport_shifts.time is intentionally VARCHAR for human-readable ranges "08:00 - 16:00"
-- BUG-005: transport_transfers.time VARCHAR → TIMESTAMPTZ for proper time-based queries

-- 1. BUG-003: Add assigned_driver column (stores driver name without corrupting time data)
ALTER TABLE public.transport_transfers 
    ADD COLUMN IF NOT EXISTS assigned_driver VARCHAR(255);

COMMENT ON COLUMN public.transport_transfers.assigned_driver IS 'Driver assigned to this transfer (replaces time-field corruption pattern)';

-- 2. BUG-005: Convert transport_transfers.time from VARCHAR to TIMESTAMPTZ
-- Strategy: Add new column, migrate existing data, drop old column, rename
ALTER TABLE public.transport_transfers 
    ADD COLUMN IF NOT EXISTS time_new TIMESTAMP WITH TIME ZONE;

-- Migrate existing VARCHAR time values to proper timestamps
-- Format "14:30" → today at 14:30; unparseable values ("Immediate", NULL) → NULL
UPDATE public.transport_transfers 
SET time_new = 
  CASE 
    WHEN time IS NOT NULL AND time ~ '^\d{2}:\d{2}$' THEN 
      (CURRENT_DATE + time::TIME)::TIMESTAMP WITH TIME ZONE
    ELSE NULL 
  END;

-- Drop old VARCHAR column and rename new one (with idempotency guard)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'transport_transfers' AND column_name = 'time_new'
  ) THEN
    ALTER TABLE public.transport_transfers DROP COLUMN IF EXISTS time;
    ALTER TABLE public.transport_transfers RENAME COLUMN time_new TO time;
  END IF;
END $$;

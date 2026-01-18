-- Migration: 20240104_import_columns.sql
-- Description: Add columns required for the CSV import pipeline (Phase 8).

-- 1. Add missing columns to tariffs_public
ALTER TABLE tariffs_public
ADD COLUMN IF NOT EXISTS duration_months integer;

-- 2. Add missing columns to tariffs_commercial
ALTER TABLE tariffs_commercial
ADD COLUMN IF NOT EXISTS promo_id text;

ALTER TABLE tariffs_commercial
ADD COLUMN IF NOT EXISTS sub_level text;

-- 3. Add unique constraint for upsert (if not exists)
-- Note: 'id' is already primary key on tariffs_public
-- Ensure tariff_id is unique on tariffs_commercial
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tariffs_commercial_tariff_id_unique'
  ) THEN
    ALTER TABLE tariffs_commercial ADD CONSTRAINT tariffs_commercial_tariff_id_unique UNIQUE (tariff_id);
  END IF;
END $$;

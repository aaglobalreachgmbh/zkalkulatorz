-- ============================================
-- Phase B1: Customers-Erweiterung + customer_import_mappings
-- ============================================

-- B1.1: Neue Spalten für customers-Tabelle
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS external_id text,
ADD COLUMN IF NOT EXISTS mocca_customer_number text,
ADD COLUMN IF NOT EXISTS external_refs jsonb DEFAULT '{}'::jsonb;

-- Index für schnelle Duplikat-Suche nach Mocca-Kundennummer
CREATE INDEX IF NOT EXISTS idx_customers_mocca_number 
ON public.customers (mocca_customer_number) 
WHERE mocca_customer_number IS NOT NULL;

-- Unique Constraint für externe IDs pro User (optional, aber sinnvoll)
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_external_id_user 
ON public.customers (user_id, external_id) 
WHERE external_id IS NOT NULL;

-- B1.2: Tabelle für gespeicherte Spalten-Mappings
CREATE TABLE IF NOT EXISTS public.customer_import_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mapping_name text NOT NULL,
  source_type text NOT NULL DEFAULT 'mocca', -- mocca, mocare, custom
  column_mapping jsonb NOT NULL DEFAULT '{}',
  field_transformations jsonb DEFAULT '{}',
  is_default boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index für schnelles Laden der User-Mappings
CREATE INDEX IF NOT EXISTS idx_import_mappings_user 
ON public.customer_import_mappings (user_id);

-- Unique Constraint: Nur ein Default-Mapping pro User und Source-Type
CREATE UNIQUE INDEX IF NOT EXISTS idx_import_mappings_default 
ON public.customer_import_mappings (user_id, source_type) 
WHERE is_default = true;

-- RLS aktivieren
ALTER TABLE public.customer_import_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies für customer_import_mappings
CREATE POLICY "Users can view own import mappings"
ON public.customer_import_mappings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own import mappings"
ON public.customer_import_mappings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own import mappings"
ON public.customer_import_mappings
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own import mappings"
ON public.customer_import_mappings
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger für updated_at
CREATE TRIGGER update_customer_import_mappings_updated_at
BEFORE UPDATE ON public.customer_import_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
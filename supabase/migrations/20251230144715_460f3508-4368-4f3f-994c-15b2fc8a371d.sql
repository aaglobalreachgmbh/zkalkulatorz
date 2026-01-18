-- Create hardware_imports table for import history
CREATE TABLE public.hardware_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'csv',
  status TEXT NOT NULL DEFAULT 'completed',
  total_rows INTEGER NOT NULL DEFAULT 0,
  added_count INTEGER NOT NULL DEFAULT 0,
  changed_count INTEGER NOT NULL DEFAULT 0,
  removed_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  warnings JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hardware_imports ENABLE ROW LEVEL SECURITY;

-- Users can view their own tenant's import history
CREATE POLICY "Users can view own tenant import history"
  ON public.hardware_imports FOR SELECT
  USING (is_same_tenant(tenant_id));

-- Users can create import logs for their tenant
CREATE POLICY "Users can create own tenant import logs"
  ON public.hardware_imports FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_same_tenant(tenant_id));

-- Admins can manage all import logs
CREATE POLICY "Admins can manage all import logs"
  ON public.hardware_imports FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Index for fast queries
CREATE INDEX idx_hardware_imports_tenant_created ON public.hardware_imports(tenant_id, created_at DESC);

-- Add comment
COMMENT ON TABLE public.hardware_imports IS 'Logs all hardware catalog imports with diff statistics';
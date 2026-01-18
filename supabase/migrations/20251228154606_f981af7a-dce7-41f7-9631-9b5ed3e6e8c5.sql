-- Create dataset_versions table for storing provision list history
CREATE TABLE public.dataset_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  version_name TEXT NOT NULL,
  valid_from DATE NOT NULL,
  valid_until DATE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  source_file TEXT,
  provisions JSONB NOT NULL DEFAULT '[]'::jsonb,
  omo_matrix JSONB NOT NULL DEFAULT '[]'::jsonb,
  hardware_catalog JSONB NOT NULL DEFAULT '[]'::jsonb,
  mobile_tariffs JSONB NOT NULL DEFAULT '[]'::jsonb,
  sub_variants JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create index for faster lookups
CREATE INDEX idx_dataset_versions_tenant ON public.dataset_versions(tenant_id);
CREATE INDEX idx_dataset_versions_active ON public.dataset_versions(tenant_id, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.dataset_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Same-tenant users can view, admins can manage
CREATE POLICY "Authenticated users can view tenant dataset versions"
  ON public.dataset_versions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can create dataset versions"
  ON public.dataset_versions
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update dataset versions"
  ON public.dataset_versions
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete dataset versions"
  ON public.dataset_versions
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_dataset_versions_updated_at
  BEFORE UPDATE ON public.dataset_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to ensure only one active version per tenant
CREATE OR REPLACE FUNCTION public.ensure_single_active_dataset_version()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.dataset_versions
    SET is_active = false
    WHERE tenant_id = NEW.tenant_id
      AND id != NEW.id
      AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to deactivate other versions when one is activated
CREATE TRIGGER ensure_single_active_dataset_version_trigger
  BEFORE INSERT OR UPDATE OF is_active ON public.dataset_versions
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION public.ensure_single_active_dataset_version();
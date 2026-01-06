-- Add status and source metadata fields to dataset_versions
ALTER TABLE public.dataset_versions
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS source_date date,
ADD COLUMN IF NOT EXISTS published_at timestamptz,
ADD COLUMN IF NOT EXISTS published_by uuid;

-- Add check constraint for status values
ALTER TABLE public.dataset_versions
ADD CONSTRAINT dataset_versions_status_check 
CHECK (status IN ('draft', 'review', 'published', 'archived'));

-- Add check constraint for source_type values  
ALTER TABLE public.dataset_versions
ADD CONSTRAINT dataset_versions_source_type_check
CHECK (source_type IN ('xlsx', 'csv', 'pdf', 'manual', 'seed'));

-- Update existing records to have 'published' status if they are active
UPDATE public.dataset_versions 
SET status = 'published', published_at = updated_at 
WHERE is_active = true;

-- Create index for faster status queries
CREATE INDEX IF NOT EXISTS idx_dataset_versions_status ON public.dataset_versions(status);
CREATE INDEX IF NOT EXISTS idx_dataset_versions_tenant_status ON public.dataset_versions(tenant_id, status);
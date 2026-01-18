-- Add dataset_version_id to saved_offers table
ALTER TABLE public.saved_offers 
ADD COLUMN IF NOT EXISTS dataset_version_id UUID REFERENCES public.dataset_versions(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_saved_offers_dataset_version 
ON public.saved_offers(dataset_version_id);

-- Add comment for documentation
COMMENT ON COLUMN public.saved_offers.dataset_version_id IS 'References the dataset version used for this offer calculation';
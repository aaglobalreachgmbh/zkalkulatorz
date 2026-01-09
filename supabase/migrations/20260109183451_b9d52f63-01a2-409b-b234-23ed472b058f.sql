-- ============================================
-- Phase 7b: Shared Offers + GDPR Email Extensions
-- ============================================

-- 1. Create shared_offers table for QR-Code online viewing
CREATE TABLE public.shared_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT get_my_tenant_id(),
  offer_id TEXT NOT NULL UNIQUE,  -- z.B. "AN-20260109-X7KP"
  access_token TEXT NOT NULL,      -- Secure token for access
  
  -- Customer-facing data only (NO dealer info!)
  customer_name TEXT,
  customer_email TEXT,
  offer_data JSONB NOT NULL,       -- Configuration + result (customer view only)
  
  -- Validity & Status
  valid_days INTEGER NOT NULL DEFAULT 14,
  expires_at TIMESTAMPTZ NOT NULL,
  is_revoked BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- GDPR compliance
  gdpr_notice_accepted BOOLEAN DEFAULT TRUE
);

-- Indexes for fast lookups
CREATE INDEX idx_shared_offers_token ON shared_offers(access_token);
CREATE INDEX idx_shared_offers_tenant ON shared_offers(tenant_id);
CREATE INDEX idx_shared_offers_expires ON shared_offers(expires_at) WHERE NOT is_revoked;
CREATE INDEX idx_shared_offers_created_by ON shared_offers(created_by);

-- Enable RLS
ALTER TABLE public.shared_offers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shared_offers
-- 1. Owner can read/update their own shared offers
CREATE POLICY "Users can view own shared offers"
ON public.shared_offers
FOR SELECT
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Users can create shared offers"
ON public.shared_offers
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid() AND tenant_id = get_my_tenant_id());

CREATE POLICY "Users can update own shared offers"
ON public.shared_offers
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- 2. Public access with valid token (for QR code access)
CREATE POLICY "Public can view with valid token"
ON public.shared_offers
FOR SELECT
TO anon
USING (
  NOT is_revoked 
  AND expires_at > NOW()
);

-- 2. Extend offer_emails table with GDPR fields
ALTER TABLE public.offer_emails 
ADD COLUMN IF NOT EXISTS gdpr_consent_given BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS gdpr_consent_timestamp TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sender_employee_name TEXT,
ADD COLUMN IF NOT EXISTS sender_employee_email TEXT,
ADD COLUMN IF NOT EXISTS sender_employee_phone TEXT,
ADD COLUMN IF NOT EXISTS shared_offer_id UUID REFERENCES public.shared_offers(id),
ADD COLUMN IF NOT EXISTS ip_hash TEXT;

-- Index for GDPR auditing
CREATE INDEX IF NOT EXISTS idx_offer_emails_gdpr ON offer_emails(gdpr_consent_given, gdpr_consent_timestamp);
CREATE INDEX IF NOT EXISTS idx_offer_emails_shared_offer ON offer_emails(shared_offer_id);

-- 3. Function to increment view count on shared offers
CREATE OR REPLACE FUNCTION public.increment_shared_offer_views(p_offer_id TEXT, p_access_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE shared_offers
  SET 
    view_count = view_count + 1,
    last_viewed_at = NOW()
  WHERE 
    offer_id = p_offer_id 
    AND access_token = p_access_token
    AND NOT is_revoked
    AND expires_at > NOW();
  
  RETURN FOUND;
END;
$$;

-- 4. Function to validate and get shared offer (for public access)
CREATE OR REPLACE FUNCTION public.get_shared_offer_public(p_offer_id TEXT, p_access_token TEXT)
RETURNS TABLE (
  id UUID,
  offer_id TEXT,
  customer_name TEXT,
  offer_data JSONB,
  expires_at TIMESTAMPTZ,
  valid_days INTEGER,
  view_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- First increment view count
  PERFORM increment_shared_offer_views(p_offer_id, p_access_token);
  
  -- Return offer data
  RETURN QUERY
  SELECT 
    so.id,
    so.offer_id,
    so.customer_name,
    so.offer_data,
    so.expires_at,
    so.valid_days,
    so.view_count
  FROM shared_offers so
  WHERE 
    so.offer_id = p_offer_id 
    AND so.access_token = p_access_token
    AND NOT so.is_revoked
    AND so.expires_at > NOW();
END;
$$;

-- 5. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_shared_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_shared_offers_timestamp
BEFORE UPDATE ON public.shared_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_shared_offers_updated_at();

-- 6. GDPR cleanup function for expired shared offers (run via cron)
CREATE OR REPLACE FUNCTION public.cleanup_expired_shared_offers(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM shared_offers
  WHERE expires_at < NOW() - (retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
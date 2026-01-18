-- ============================================
-- E-Mail History Table for Offer Emails
-- ============================================

-- Table to track sent offer emails
CREATE TABLE public.offer_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT (auth.jwt() ->> 'aud'::text),
  user_id UUID NOT NULL,
  
  -- Recipient info
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  
  -- Email content
  subject TEXT NOT NULL,
  message TEXT,
  
  -- Related data
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  offer_data JSONB,  -- Snapshot of offer items
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'sent',  -- sent, delivered, opened, failed
  resend_message_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.offer_emails ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see emails from their tenant
CREATE POLICY "Users can view their tenant's offer emails"
  ON public.offer_emails FOR SELECT
  USING (tenant_id = (SELECT get_my_tenant_id()));

CREATE POLICY "Users can insert offer emails for their tenant"
  ON public.offer_emails FOR INSERT
  WITH CHECK (
    tenant_id = (SELECT get_my_tenant_id())
    AND auth.uid() = user_id
  );

-- Index for faster queries
CREATE INDEX idx_offer_emails_tenant_created ON public.offer_emails(tenant_id, created_at DESC);
CREATE INDEX idx_offer_emails_user ON public.offer_emails(user_id, created_at DESC);
CREATE INDEX idx_offer_emails_recipient ON public.offer_emails(recipient_email);

-- Enable realtime for offer_emails
ALTER PUBLICATION supabase_realtime ADD TABLE public.offer_emails;
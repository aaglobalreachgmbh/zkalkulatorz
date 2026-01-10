
-- Create news_items table for SalesWorld News
CREATE TABLE public.news_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('alert', 'info', 'training', 'promo', 'stock', 'urgent')),
  is_pinned BOOLEAN DEFAULT false,
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.news_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for news_items
CREATE POLICY "Tenant members can view news"
  ON public.news_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage news"
  ON public.news_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'tenant_admin')
    )
  );

-- Add promo columns to corporate_bundles
ALTER TABLE public.corporate_bundles 
  ADD COLUMN IF NOT EXISTS is_promo BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS promo_valid_from DATE,
  ADD COLUMN IF NOT EXISTS promo_valid_until DATE,
  ADD COLUMN IF NOT EXISTS promo_badge_text TEXT;

-- Create index for efficient queries
CREATE INDEX idx_news_items_tenant_valid ON public.news_items(tenant_id, valid_from, valid_until);
CREATE INDEX idx_corporate_bundles_promo ON public.corporate_bundles(is_promo, promo_valid_from, promo_valid_until);

-- Trigger for updated_at
CREATE TRIGGER update_news_items_updated_at
  BEFORE UPDATE ON public.news_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

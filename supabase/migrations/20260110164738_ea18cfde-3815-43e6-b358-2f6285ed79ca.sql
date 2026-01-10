-- ============================================
-- Visit Reports Feature
-- Phase 1: Database Tables (Korrigiert)
-- ============================================

-- 1. Visit Checklists (Templates für Beratung)
CREATE TABLE public.visit_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT,  -- NULL = globale Vorlage (Superadmin)
  user_id UUID,    -- NULL = Admin-Template, sonst User-eigene
  name TEXT NOT NULL,
  description TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_template BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS für visit_checklists
ALTER TABLE public.visit_checklists ENABLE ROW LEVEL SECURITY;

-- User sehen: eigene + Admin-Templates des Tenants + globale Templates
CREATE POLICY "Users can view accessible checklists"
ON public.visit_checklists
FOR SELECT
USING (
  -- Globale Templates (tenant_id = NULL, is_template = true)
  (tenant_id IS NULL AND is_template = true)
  OR
  -- Tenant-weite Templates (gleicher Tenant, is_template = true)
  (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()) AND is_template = true)
  OR
  -- Eigene Checklisten
  (user_id = auth.uid())
);

-- User können eigene Checklisten erstellen
CREATE POLICY "Users can create own checklists"
ON public.visit_checklists
FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);

-- User können eigene Checklisten bearbeiten
CREATE POLICY "Users can update own checklists"
ON public.visit_checklists
FOR UPDATE
USING (user_id = auth.uid());

-- User können eigene Checklisten löschen
CREATE POLICY "Users can delete own checklists"
ON public.visit_checklists
FOR DELETE
USING (user_id = auth.uid());

-- 2. Visit Reports (Besuchsberichte)
CREATE TABLE public.visit_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  visit_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  location_lat NUMERIC(10, 7),
  location_lng NUMERIC(10, 7),
  location_address TEXT,
  notes TEXT,
  checklist_id UUID REFERENCES public.visit_checklists(id) ON DELETE SET NULL,
  checklist_responses JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  offline_id TEXT,  -- Für Offline-Sync
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS für visit_reports
ALTER TABLE public.visit_reports ENABLE ROW LEVEL SECURITY;

-- User sehen eigene Berichte
CREATE POLICY "Users can view own visit reports"
ON public.visit_reports
FOR SELECT
USING (user_id = auth.uid());

-- Admins sehen alle Berichte im Tenant
CREATE POLICY "Admins can view all tenant visit reports"
ON public.visit_reports
FOR SELECT
USING (
  tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'tenant_admin')
  )
);

-- User können eigene Berichte erstellen
CREATE POLICY "Users can create own visit reports"
ON public.visit_reports
FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);

-- User können eigene Draft-Berichte bearbeiten
CREATE POLICY "Users can update own draft reports"
ON public.visit_reports
FOR UPDATE
USING (user_id = auth.uid() AND status = 'draft');

-- Admins können Berichte reviewen
CREATE POLICY "Admins can update tenant reports for review"
ON public.visit_reports
FOR UPDATE
USING (
  tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'tenant_admin')
  )
);

-- User können eigene Draft-Berichte löschen
CREATE POLICY "Users can delete own draft reports"
ON public.visit_reports
FOR DELETE
USING (user_id = auth.uid() AND status = 'draft');

-- 3. Visit Photos (Besuchsfotos)
CREATE TABLE public.visit_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_report_id UUID NOT NULL REFERENCES public.visit_reports(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS für visit_photos
ALTER TABLE public.visit_photos ENABLE ROW LEVEL SECURITY;

-- Fotos über visit_report_id zugänglich
CREATE POLICY "Users can view photos of accessible reports"
ON public.visit_photos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.visit_reports vr
    WHERE vr.id = visit_report_id
    AND (
      vr.user_id = auth.uid()
      OR (
        vr.tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
        AND EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid()
          AND role IN ('admin', 'tenant_admin')
        )
      )
    )
  )
);

-- User können Fotos zu eigenen Berichten hinzufügen
CREATE POLICY "Users can add photos to own reports"
ON public.visit_photos
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.visit_reports vr
    WHERE vr.id = visit_report_id
    AND vr.user_id = auth.uid()
  )
);

-- User können Fotos ihrer Berichte löschen
CREATE POLICY "Users can delete photos from own reports"
ON public.visit_photos
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.visit_reports vr
    WHERE vr.id = visit_report_id
    AND vr.user_id = auth.uid()
  )
);

-- 4. Storage Bucket für Besuchsfotos
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('visit-photos', 'visit-photos', false, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Users can upload visit photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'visit-photos'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view own visit photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'visit-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own visit photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'visit-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Indexes für Performance
CREATE INDEX idx_visit_reports_user_id ON public.visit_reports(user_id);
CREATE INDEX idx_visit_reports_tenant_id ON public.visit_reports(tenant_id);
CREATE INDEX idx_visit_reports_customer_id ON public.visit_reports(customer_id);
CREATE INDEX idx_visit_reports_visit_date ON public.visit_reports(visit_date DESC);
CREATE INDEX idx_visit_reports_status ON public.visit_reports(status);
CREATE INDEX idx_visit_checklists_tenant_id ON public.visit_checklists(tenant_id);
CREATE INDEX idx_visit_photos_report_id ON public.visit_photos(visit_report_id);

-- 6. Trigger für updated_at
CREATE TRIGGER update_visit_reports_updated_at
BEFORE UPDATE ON public.visit_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_visit_checklists_updated_at
BEFORE UPDATE ON public.visit_checklists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
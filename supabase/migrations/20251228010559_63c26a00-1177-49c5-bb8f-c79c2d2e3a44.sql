-- ============================================
-- Storage Bucket für Hardware-Produktbilder
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('hardware-images', 'hardware-images', true);

-- RLS Policies für hardware-images bucket
CREATE POLICY "Public can view hardware images"
ON storage.objects FOR SELECT
USING (bucket_id = 'hardware-images');

CREATE POLICY "Admins can upload hardware images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'hardware-images' AND 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update hardware images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'hardware-images' AND 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete hardware images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'hardware-images' AND 
  public.has_role(auth.uid(), 'admin')
);

-- ============================================
-- Hardware Images Mapping Tabelle
-- ============================================
CREATE TABLE public.hardware_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hardware_id TEXT NOT NULL UNIQUE,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  tenant_id TEXT NOT NULL DEFAULT 'tenant_default',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS aktivieren
ALTER TABLE public.hardware_images ENABLE ROW LEVEL SECURITY;

-- Alle können Hardware-Bilder sehen
CREATE POLICY "Anyone can view hardware images"
ON public.hardware_images FOR SELECT
USING (true);

-- Admins können Hardware-Bilder verwalten
CREATE POLICY "Admins can manage hardware images"
ON public.hardware_images FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Updated_at Trigger
CREATE TRIGGER update_hardware_images_updated_at
BEFORE UPDATE ON public.hardware_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Corporate Bundles Tabelle
-- ============================================
CREATE TABLE public.corporate_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector TEXT NOT NULL CHECK (sector IN ('private', 'business', 'enterprise')),
  name TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  featured BOOLEAN DEFAULT false,
  config JSONB NOT NULL,
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  tenant_id TEXT NOT NULL DEFAULT 'tenant_default',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS aktivieren
ALTER TABLE public.corporate_bundles ENABLE ROW LEVEL SECURITY;

-- Alle authentifizierten Benutzer können Bundles sehen
CREATE POLICY "Authenticated users can view active bundles"
ON public.corporate_bundles FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

-- Admins können alle Bundles sehen (auch inaktive)
CREATE POLICY "Admins can view all bundles"
ON public.corporate_bundles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins können Bundles erstellen
CREATE POLICY "Admins can create bundles"
ON public.corporate_bundles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins können Bundles aktualisieren
CREATE POLICY "Admins can update bundles"
ON public.corporate_bundles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Admins können Bundles löschen
CREATE POLICY "Admins can delete bundles"
ON public.corporate_bundles FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at Trigger
CREATE TRIGGER update_corporate_bundles_updated_at
BEFORE UPDATE ON public.corporate_bundles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index für Performance
CREATE INDEX idx_corporate_bundles_sector ON public.corporate_bundles(sector);
CREATE INDEX idx_corporate_bundles_active ON public.corporate_bundles(is_active);
CREATE INDEX idx_hardware_images_hardware_id ON public.hardware_images(hardware_id);
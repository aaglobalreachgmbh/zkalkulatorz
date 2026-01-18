-- ============================================
-- Mitarbeiter-Steuerungssystem Schema
-- ============================================

-- 1. Tenant-Einstellungen (für Defaults)
CREATE TABLE public.tenant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT UNIQUE NOT NULL,
  
  -- Standard-Abzug für neue Mitarbeiter
  default_provision_deduction DECIMAL DEFAULT 0,
  default_provision_deduction_type TEXT DEFAULT 'fixed' CHECK (default_provision_deduction_type IN ('fixed', 'percent')),
  default_blocked_tariffs TEXT[] DEFAULT '{}',
  
  -- Metadaten
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

-- 2. Mitarbeiter-Einstellungen (Kern)
CREATE TABLE public.employee_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tenant_id TEXT NOT NULL,
  
  -- Provisions-Steuerung
  provision_deduction DECIMAL DEFAULT 0,
  provision_deduction_type TEXT DEFAULT 'fixed' CHECK (provision_deduction_type IN ('fixed', 'percent')),
  
  -- Tarif-Blacklist (Array von Tarif-IDs)
  blocked_tariffs TEXT[] DEFAULT '{}',
  
  -- Feature-Overrides (null = Lizenz-Standard)
  feature_overrides JSONB DEFAULT '{}',
  
  -- Anzeige-Name für Admin-UI
  display_name TEXT,
  department TEXT,
  
  -- Metadaten
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  
  UNIQUE(user_id, tenant_id)
);

-- 3. Push-Provisionen (Bonus pro Tarif)
CREATE TABLE public.push_provisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  
  -- Scope: Für wen gilt der Bonus?
  scope_type TEXT NOT NULL DEFAULT 'all' CHECK (scope_type IN ('all', 'user', 'team')),
  scope_id UUID,
  
  -- Tarif-Bezug
  tariff_id TEXT NOT NULL,
  tariff_family TEXT,
  contract_type TEXT CHECK (contract_type IN ('new', 'renewal', 'both')),
  
  -- Bonus-Betrag
  bonus_amount DECIMAL NOT NULL,
  bonus_type TEXT DEFAULT 'fixed' CHECK (bonus_type IN ('fixed', 'percent')),
  
  -- Gültigkeit
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  
  -- Metadaten
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_provisions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies für tenant_settings
-- ============================================

-- Admins können Tenant-Einstellungen verwalten
CREATE POLICY "Admins can manage tenant settings"
ON public.tenant_settings
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Alle authentifizierten Benutzer können Tenant-Einstellungen lesen
CREATE POLICY "Authenticated users can view tenant settings"
ON public.tenant_settings
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ============================================
-- RLS Policies für employee_settings
-- ============================================

-- Admins können alle Mitarbeiter-Einstellungen verwalten
CREATE POLICY "Admins can manage all employee settings"
ON public.employee_settings
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Benutzer können ihre eigenen Einstellungen lesen
CREATE POLICY "Users can view own employee settings"
ON public.employee_settings
FOR SELECT
USING (auth.uid() = user_id);

-- ============================================
-- RLS Policies für push_provisions
-- ============================================

-- Admins können Push-Provisionen verwalten
CREATE POLICY "Admins can manage push provisions"
ON public.push_provisions
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Alle authentifizierten Benutzer können aktive Push-Provisionen lesen
CREATE POLICY "Users can view active push provisions"
ON public.push_provisions
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

-- ============================================
-- Trigger für updated_at
-- ============================================

CREATE TRIGGER update_tenant_settings_updated_at
BEFORE UPDATE ON public.tenant_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_settings_updated_at
BEFORE UPDATE ON public.employee_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_push_provisions_updated_at
BEFORE UPDATE ON public.push_provisions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Index für Performance
-- ============================================

CREATE INDEX idx_employee_settings_tenant ON public.employee_settings(tenant_id);
CREATE INDEX idx_employee_settings_user ON public.employee_settings(user_id);
CREATE INDEX idx_push_provisions_tenant ON public.push_provisions(tenant_id);
CREATE INDEX idx_push_provisions_active ON public.push_provisions(is_active, valid_from, valid_until);
-- ============================================
-- Phase 1: Cloud Storage Migration Schema
-- ============================================

-- 1. Template Folders (muss vor offer_drafts existieren wegen FK)
CREATE TABLE IF NOT EXISTS public.template_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.template_folders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Offer Drafts (ersetzt localStorage drafts + history + templates)
CREATE TABLE IF NOT EXISTS public.offer_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tenant_id TEXT NOT NULL,
  department_id TEXT,
  name TEXT NOT NULL,
  config JSONB NOT NULL,
  preview JSONB,
  draft_type TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'template', 'history'
  folder_id UUID REFERENCES public.template_folders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Custom Datasets (ersetzt localStorage custom datasets)
CREATE TABLE IF NOT EXISTS public.custom_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL UNIQUE,
  dataset_version TEXT NOT NULL,
  valid_from DATE NOT NULL,
  verified_at DATE NOT NULL,
  hardware_catalog JSONB NOT NULL DEFAULT '[]',
  mobile_tariffs JSONB NOT NULL DEFAULT '[]',
  mobile_features JSONB NOT NULL DEFAULT '[]',
  mobile_dependencies JSONB NOT NULL DEFAULT '[]',
  fixed_net_products JSONB NOT NULL DEFAULT '[]',
  promos JSONB NOT NULL DEFAULT '[]',
  sub_variants JSONB NOT NULL DEFAULT '[]',
  provisions JSONB NOT NULL DEFAULT '[]',
  omo_matrix JSONB NOT NULL DEFAULT '[]',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Licenses (ersetzt localStorage license)
CREATE TABLE IF NOT EXISTS public.licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'internal',
  seat_limit INTEGER NOT NULL DEFAULT 999,
  seats_used INTEGER NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '{"aiConsultant": true, "pdfExport": true, "cloudSync": true, "teamManagement": true, "dataImport": true, "pushProvisions": true, "employeeManagement": true}',
  valid_until TIMESTAMPTZ,
  activated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Seat Assignments (ersetzt localStorage seats)
CREATE TABLE IF NOT EXISTS public.seat_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID NOT NULL,
  UNIQUE(tenant_id, user_id)
);

-- 6. Departments (ersetzt localStorage organisation)
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  department_id TEXT NOT NULL,
  name TEXT NOT NULL,
  parent_id TEXT,
  policy JSONB NOT NULL DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, department_id)
);

-- 7. User Department Assignments
CREATE TABLE IF NOT EXISTS public.user_department_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  department_id TEXT NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID,
  UNIQUE(tenant_id, user_id)
);

-- 8. Calculation History (separate Tabelle für schnellen Zugriff)
CREATE TABLE IF NOT EXISTS public.calculation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tenant_id TEXT NOT NULL,
  department_id TEXT,
  config JSONB NOT NULL,
  summary TEXT,
  hardware_name TEXT,
  tariff_name TEXT,
  avg_monthly NUMERIC,
  margin NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Enable RLS on all tables
-- ============================================
ALTER TABLE public.template_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seat_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_department_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculation_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies: template_folders
-- ============================================
CREATE POLICY "Users can view own template folders"
  ON public.template_folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own template folders"
  ON public.template_folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own template folders"
  ON public.template_folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own template folders"
  ON public.template_folders FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- RLS Policies: offer_drafts
-- ============================================
CREATE POLICY "Users can view own offer drafts"
  ON public.offer_drafts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own offer drafts"
  ON public.offer_drafts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own offer drafts"
  ON public.offer_drafts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own offer drafts"
  ON public.offer_drafts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- RLS Policies: custom_datasets (Tenant-basiert, nur Admins können schreiben)
-- ============================================
CREATE POLICY "Authenticated users can view tenant datasets"
  ON public.custom_datasets FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can create datasets"
  ON public.custom_datasets FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update datasets"
  ON public.custom_datasets FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete datasets"
  ON public.custom_datasets FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS Policies: licenses (Tenant-basiert)
-- ============================================
CREATE POLICY "Authenticated users can view licenses"
  ON public.licenses FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage licenses"
  ON public.licenses FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS Policies: seat_assignments
-- ============================================
CREATE POLICY "Authenticated users can view seat assignments"
  ON public.seat_assignments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage seat assignments"
  ON public.seat_assignments FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS Policies: departments
-- ============================================
CREATE POLICY "Authenticated users can view departments"
  ON public.departments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage departments"
  ON public.departments FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS Policies: user_department_assignments
-- ============================================
CREATE POLICY "Users can view own department assignment"
  ON public.user_department_assignments FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage department assignments"
  ON public.user_department_assignments FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS Policies: calculation_history
-- ============================================
CREATE POLICY "Users can view own calculation history"
  ON public.calculation_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own calculation history"
  ON public.calculation_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own calculation history"
  ON public.calculation_history FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_offer_drafts_user_id ON public.offer_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_offer_drafts_tenant_id ON public.offer_drafts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_offer_drafts_draft_type ON public.offer_drafts(draft_type);
CREATE INDEX IF NOT EXISTS idx_template_folders_user_id ON public.template_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_calculation_history_user_id ON public.calculation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_calculation_history_created_at ON public.calculation_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seat_assignments_tenant_id ON public.seat_assignments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_departments_tenant_id ON public.departments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_dept_assignments_user_id ON public.user_department_assignments(user_id);

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE TRIGGER update_template_folders_updated_at
  BEFORE UPDATE ON public.template_folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offer_drafts_updated_at
  BEFORE UPDATE ON public.offer_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_datasets_updated_at
  BEFORE UPDATE ON public.custom_datasets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_licenses_updated_at
  BEFORE UPDATE ON public.licenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
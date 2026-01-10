-- =====================================================
-- PHASE 1: Zeiterfassung Tabellen
-- =====================================================

-- Tabelle für Zeiteinträge
CREATE TABLE public.time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT '',
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  clock_in TIMESTAMPTZ NOT NULL DEFAULT now(),
  clock_out TIMESTAMPTZ,
  break_minutes INTEGER DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'edited', 'approved')),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Berechnete Arbeitsminuten als separate Spalte (wird per Trigger aktualisiert)
ALTER TABLE public.time_entries ADD COLUMN work_minutes INTEGER DEFAULT 0;

-- Tabelle für Korrekturanträge
CREATE TABLE public.time_entry_corrections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT '',
  time_entry_id UUID NOT NULL REFERENCES public.time_entries(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL,
  original_clock_in TIMESTAMPTZ,
  original_clock_out TIMESTAMPTZ,
  new_clock_in TIMESTAMPTZ,
  new_clock_out TIMESTAMPTZ,
  new_break_minutes INTEGER,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PHASE 2: Provisions-Berechnungen Tabelle
-- =====================================================

CREATE TABLE public.provision_calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT '',
  user_id UUID NOT NULL,
  month DATE NOT NULL, -- Erster Tag des Monats
  base_provision NUMERIC(10,2) DEFAULT 0,
  bonus_amount NUMERIC(10,2) DEFAULT 0,
  deductions NUMERIC(10,2) DEFAULT 0,
  net_provision NUMERIC(10,2) DEFAULT 0,
  contract_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'calculated', 'approved', 'paid')),
  calculation_details JSONB DEFAULT '[]'::jsonb,
  calculated_at TIMESTAMPTZ,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, user_id, month)
);

-- =====================================================
-- PHASE 3: Absences erweitern für Urlaubstage
-- =====================================================

ALTER TABLE public.absences 
ADD COLUMN IF NOT EXISTS vacation_days NUMERIC(4,1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_vacation_before NUMERIC(4,1),
ADD COLUMN IF NOT EXISTS auto_forward_events BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS half_day_start BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS half_day_end BOOLEAN DEFAULT false;

-- =====================================================
-- PHASE 4: RLS Policies
-- =====================================================

-- Time Entries RLS
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own time entries"
ON public.time_entries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tenant time entries"
ON public.time_entries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'tenant_admin')
  )
  AND tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can insert own time entries"
ON public.time_entries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own active entries"
ON public.time_entries FOR UPDATE
USING (auth.uid() = user_id AND status = 'active');

CREATE POLICY "Admins can update all tenant entries"
ON public.time_entries FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'tenant_admin')
  )
  AND tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);

-- Time Entry Corrections RLS
ALTER TABLE public.time_entry_corrections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own corrections"
ON public.time_entry_corrections FOR SELECT
USING (auth.uid() = requested_by);

CREATE POLICY "Admins can view all tenant corrections"
ON public.time_entry_corrections FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'tenant_admin')
  )
  AND tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can insert own corrections"
ON public.time_entry_corrections FOR INSERT
WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Admins can update corrections"
ON public.time_entry_corrections FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'tenant_admin')
  )
);

-- Provision Calculations RLS
ALTER TABLE public.provision_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own provisions"
ON public.provision_calculations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tenant provisions"
ON public.provision_calculations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'tenant_admin')
  )
  AND tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Admins can insert provisions"
ON public.provision_calculations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'tenant_admin')
  )
);

CREATE POLICY "Admins can update provisions"
ON public.provision_calculations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'tenant_admin')
  )
);

-- =====================================================
-- PHASE 5: Triggers
-- =====================================================

-- Trigger für work_minutes Berechnung
CREATE OR REPLACE FUNCTION public.calculate_work_minutes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.clock_out IS NOT NULL THEN
    NEW.work_minutes := GREATEST(0, 
      EXTRACT(EPOCH FROM (NEW.clock_out - NEW.clock_in)) / 60 - COALESCE(NEW.break_minutes, 0)
    )::INTEGER;
  ELSE
    NEW.work_minutes := 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER calculate_work_minutes_trigger
BEFORE INSERT OR UPDATE ON public.time_entries
FOR EACH ROW
EXECUTE FUNCTION public.calculate_work_minutes();

-- Updated_at Triggers
CREATE TRIGGER update_time_entries_updated_at
BEFORE UPDATE ON public.time_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_time_entry_corrections_updated_at
BEFORE UPDATE ON public.time_entry_corrections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_provision_calculations_updated_at
BEFORE UPDATE ON public.provision_calculations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- PHASE 6: Realtime aktivieren
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.time_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.provision_calculations;

-- =====================================================
-- PHASE 7: Indexes für Performance
-- =====================================================

CREATE INDEX idx_time_entries_user_date ON public.time_entries(user_id, date);
CREATE INDEX idx_time_entries_tenant_date ON public.time_entries(tenant_id, date);
CREATE INDEX idx_time_entries_status ON public.time_entries(status);
CREATE INDEX idx_time_entry_corrections_status ON public.time_entry_corrections(status);
CREATE INDEX idx_provision_calculations_user_month ON public.provision_calculations(user_id, month);
CREATE INDEX idx_provision_calculations_tenant_month ON public.provision_calculations(tenant_id, month);
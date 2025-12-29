-- Performance indexes for RLS queries on tenant_id
CREATE INDEX IF NOT EXISTS idx_employee_settings_tenant_id 
ON public.employee_settings(tenant_id);

CREATE INDEX IF NOT EXISTS idx_offer_drafts_tenant_id 
ON public.offer_drafts(tenant_id);

CREATE INDEX IF NOT EXISTS idx_calculation_history_tenant_user 
ON public.calculation_history(tenant_id, user_id);

CREATE INDEX IF NOT EXISTS idx_saved_offers_tenant_user 
ON public.saved_offers(tenant_id, user_id);

CREATE INDEX IF NOT EXISTS idx_customers_tenant_user 
ON public.customers(tenant_id, user_id);

-- License for default tenant with all features enabled
INSERT INTO public.licenses (
  tenant_id,
  plan,
  seat_limit,
  seats_used,
  features,
  valid_until,
  activated_at
) VALUES (
  'tenant_default',
  'internal',
  10,
  0,
  '{
    "dataGovernance": true,
    "exportPdf": true,
    "dataImport": true,
    "cloudSync": true,
    "pdfExport": true,
    "aiConsultant": true,
    "pushProvisions": true,
    "teamManagement": true,
    "employeeManagement": true,
    "auditLog": true,
    "adminSecurityAccess": true,
    "offlineSync": true
  }'::jsonb,
  (NOW() + INTERVAL '1 year'),
  NOW()
) ON CONFLICT (tenant_id) DO UPDATE SET
  plan = EXCLUDED.plan,
  seat_limit = EXCLUDED.seat_limit,
  features = EXCLUDED.features,
  valid_until = EXCLUDED.valid_until,
  updated_at = NOW();
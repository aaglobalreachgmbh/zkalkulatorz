-- Zuerst alte Funktion droppen, dann neue mit company_name erstellen
DROP FUNCTION IF EXISTS public.validate_invite_token(text);

CREATE OR REPLACE FUNCTION public.validate_invite_token(p_token text)
RETURNS TABLE(valid boolean, email text, tenant_id text, role text, company_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    true,
    tae.email,
    tae.tenant_id,
    tae.role,
    t.company_name
  FROM public.tenant_allowed_emails tae
  JOIN public.tenants t ON t.id = tae.tenant_id
  WHERE tae.invite_token = p_token
  AND tae.registered_at IS NULL
  AND t.status = 'active';
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::text, NULL::text, NULL::text, NULL::text;
  END IF;
END;
$$;
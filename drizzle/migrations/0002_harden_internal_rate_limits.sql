CREATE OR REPLACE FUNCTION public.check_rate_limit(_key_hash text, _category text, _max_requests integer DEFAULT 100, _window_seconds integer DEFAULT 60)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_window_start timestamptz;
  v_current_count integer;
BEGIN
  IF _key_hash IS NULL OR length(_key_hash) < 16 OR length(_key_hash) > 128 THEN
    RAISE EXCEPTION 'invalid rate-limit key';
  END IF;
  IF _category IS NULL OR _category !~ '^[a-z0-9_-]{1,40}$' THEN
    RAISE EXCEPTION 'invalid rate-limit category';
  END IF;
  IF _max_requests < 1 OR _max_requests > 10000 OR _window_seconds < 1 OR _window_seconds > 86400 THEN
    RAISE EXCEPTION 'invalid rate-limit bounds';
  END IF;

  v_window_start := date_trunc('second', now()) -
    (EXTRACT(EPOCH FROM now())::integer % _window_seconds) * interval '1 second';

  INSERT INTO public.rate_limit_entries (key_hash, category, window_start, request_count)
  VALUES (_key_hash, _category, v_window_start, 1)
  ON CONFLICT (key_hash, category, window_start)
  DO UPDATE SET request_count = public.rate_limit_entries.request_count + 1
  RETURNING request_count INTO v_current_count;

  RETURN _max_requests - v_current_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM public.rate_limit_entries
  WHERE window_start < now() - interval '24 hours';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$function$;

REVOKE ALL ON FUNCTION public.check_rate_limit(text, text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_rate_limit_status(text, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_rate_limits() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_rate_limit_status(text, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_rate_limits() TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rate_limit_entries TO service_role;
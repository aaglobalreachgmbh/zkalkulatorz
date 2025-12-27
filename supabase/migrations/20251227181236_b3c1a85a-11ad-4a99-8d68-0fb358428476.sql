-- ============================================
-- Phase C2: JWT Claims + Tenant Isolation
-- Creates helper functions for RLS policies
-- ============================================

-- Function to get tenant_id from JWT claims or user metadata
CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    -- First: Try JWT claims (set by login trigger)
    current_setting('request.jwt.claims', true)::json->>'tenant_id',
    -- Fallback: Use default tenant
    'tenant_default'
  )
$$;

-- Function to get department_id from JWT claims or user metadata
CREATE OR REPLACE FUNCTION public.get_my_department_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    -- First: Try JWT claims
    current_setting('request.jwt.claims', true)::json->>'department_id',
    -- Fallback: Use default department
    'dept_default'
  )
$$;

-- Function to check if user belongs to a specific tenant
CREATE OR REPLACE FUNCTION public.is_same_tenant(_tenant_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_my_tenant_id() = _tenant_id
$$;

-- ============================================
-- Phase C1: Rate Limiting Table
-- Supabase-based rate limiting without external dependencies
-- ============================================

-- Create rate limit entries table
CREATE TABLE IF NOT EXISTS public.rate_limit_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash text NOT NULL,
  category text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(key_hash, category, window_start)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_entries_lookup 
ON public.rate_limit_entries(key_hash, category, window_start);

-- Create index for cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limit_entries_cleanup 
ON public.rate_limit_entries(window_start);

-- Enable RLS
ALTER TABLE public.rate_limit_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rate_limit_entries
-- Only service role can access (used by edge function)
CREATE POLICY "Service role can manage rate limits"
ON public.rate_limit_entries
FOR ALL
USING (true)
WITH CHECK (true);

-- Function to check and increment rate limit
-- Returns: remaining requests (negative = blocked)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _key_hash text,
  _category text,
  _max_requests integer DEFAULT 100,
  _window_seconds integer DEFAULT 60
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start timestamptz;
  v_current_count integer;
  v_remaining integer;
BEGIN
  -- Calculate window start (truncate to window boundary)
  v_window_start := date_trunc('second', now()) - 
    (EXTRACT(EPOCH FROM now())::integer % _window_seconds) * interval '1 second';
  
  -- Upsert: increment counter or create new entry
  INSERT INTO public.rate_limit_entries (key_hash, category, window_start, request_count)
  VALUES (_key_hash, _category, v_window_start, 1)
  ON CONFLICT (key_hash, category, window_start) 
  DO UPDATE SET request_count = rate_limit_entries.request_count + 1
  RETURNING request_count INTO v_current_count;
  
  -- Calculate remaining
  v_remaining := _max_requests - v_current_count;
  
  RETURN v_remaining;
END;
$$;

-- Function to cleanup old rate limit entries
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted integer;
BEGIN
  -- Delete entries older than 1 hour
  DELETE FROM public.rate_limit_entries
  WHERE window_start < now() - interval '1 hour';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  
  RETURN v_deleted;
END;
$$;

-- Function to get current rate limit status
CREATE OR REPLACE FUNCTION public.get_rate_limit_status(
  _key_hash text,
  _category text,
  _window_seconds integer DEFAULT 60
)
RETURNS TABLE(
  current_count integer,
  window_start timestamptz,
  window_end timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH window_calc AS (
    SELECT 
      date_trunc('second', now()) - 
        (EXTRACT(EPOCH FROM now())::integer % _window_seconds) * interval '1 second' 
      AS ws
  )
  SELECT 
    COALESCE(rle.request_count, 0) AS current_count,
    wc.ws AS window_start,
    wc.ws + (_window_seconds * interval '1 second') AS window_end
  FROM window_calc wc
  LEFT JOIN public.rate_limit_entries rle 
    ON rle.key_hash = _key_hash 
    AND rle.category = _category 
    AND rle.window_start = wc.ws
$$;
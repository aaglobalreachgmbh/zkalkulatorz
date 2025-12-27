-- ============================================
-- Phase A2: User Meta Tabelle für sensitive Daten
-- SECURITY: Trennung sensitiver Daten von profiles
-- ============================================

-- 1. Neue Tabelle für sensitive User-Daten (getrennt von profiles)
CREATE TABLE IF NOT EXISTS public.user_meta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  subscription_status text DEFAULT 'active' CHECK (subscription_status IN ('active', 'suspended', 'cancelled', 'trial')),
  discount_tier text DEFAULT 'standard' CHECK (discount_tier IN ('standard', 'bronze', 'silver', 'gold', 'platinum')),
  feature_flags jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. RLS aktivieren
ALTER TABLE public.user_meta ENABLE ROW LEVEL SECURITY;

-- 3. Nur Lese-Zugriff für User auf eigene Daten
CREATE POLICY "Users can read own meta" ON public.user_meta
  FOR SELECT 
  USING (auth.uid() = user_id);

-- 4. Schreibzugriff NUR für Admins (mit has_role Security Definer)
CREATE POLICY "Admins can manage all meta" ON public.user_meta
  FOR ALL 
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_user_meta_user_id ON public.user_meta(user_id);
CREATE INDEX IF NOT EXISTS idx_user_meta_subscription ON public.user_meta(subscription_status);

-- 6. Trigger für updated_at (nutzt existierende Funktion)
CREATE TRIGGER update_user_meta_updated_at
  BEFORE UPDATE ON public.user_meta
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Security Definer Function für kontrollierte Updates
-- Nur Admins können diese Funktion aufrufen
CREATE OR REPLACE FUNCTION public.update_user_meta(
  _user_id uuid,
  _subscription_status text DEFAULT NULL,
  _discount_tier text DEFAULT NULL,
  _feature_flags jsonb DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Nur Admins dürfen diese Funktion aufrufen
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;
  
  -- Validierung der Werte
  IF _subscription_status IS NOT NULL AND 
     _subscription_status NOT IN ('active', 'suspended', 'cancelled', 'trial') THEN
    RAISE EXCEPTION 'Invalid subscription_status value';
  END IF;
  
  IF _discount_tier IS NOT NULL AND 
     _discount_tier NOT IN ('standard', 'bronze', 'silver', 'gold', 'platinum') THEN
    RAISE EXCEPTION 'Invalid discount_tier value';
  END IF;
  
  -- Upsert mit nur erlaubten Feldern
  INSERT INTO public.user_meta (user_id, subscription_status, discount_tier, feature_flags)
  VALUES (
    _user_id,
    COALESCE(_subscription_status, 'active'),
    COALESCE(_discount_tier, 'standard'),
    COALESCE(_feature_flags, '{}')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    subscription_status = COALESCE(_subscription_status, user_meta.subscription_status),
    discount_tier = COALESCE(_discount_tier, user_meta.discount_tier),
    feature_flags = COALESCE(_feature_flags, user_meta.feature_flags),
    updated_at = now();
  
  RETURN true;
END;
$$;

-- 8. Automatische user_meta Erstellung bei neuem User
CREATE OR REPLACE FUNCTION public.create_user_meta_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_meta (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger an auth.users (wird nach handle_new_user ausgeführt)
DROP TRIGGER IF EXISTS on_auth_user_created_meta ON auth.users;
CREATE TRIGGER on_auth_user_created_meta
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_meta_on_signup();
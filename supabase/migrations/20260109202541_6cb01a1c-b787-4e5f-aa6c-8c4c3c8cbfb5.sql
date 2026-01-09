-- Alle neuen Benutzer werden automatisch freigeschaltet
-- Kein Admin-Approval mehr notwendig
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- Create profile - alle Benutzer werden automatisch freigeschaltet
    INSERT INTO public.profiles (id, email, display_name, is_approved, approved_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
        true,  -- Automatische Freischaltung für alle
        now()  -- Sofortige Freischaltung
    );
    
    -- Assign default 'user' role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    -- can.akar@gmx.de bekommt zusätzlich admin und tenant_admin Rollen
    IF NEW.email = 'can.akar@gmx.de' THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'tenant_admin')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Bestehende nicht-freigeschaltete Benutzer freischalten
UPDATE public.profiles
SET is_approved = true, approved_at = now()
WHERE is_approved = false OR is_approved IS NULL;
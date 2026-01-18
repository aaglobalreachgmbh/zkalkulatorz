
-- Aktualisierte handle_new_user Funktion
-- can.akar@gmx.de wird automatisch als Admin + approved gesetzt
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- Create profile
    -- can.akar@gmx.de wird automatisch freigeschalten
    INSERT INTO public.profiles (id, email, display_name, is_approved, approved_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
        CASE WHEN NEW.email = 'can.akar@gmx.de' THEN true ELSE false END,
        CASE WHEN NEW.email = 'can.akar@gmx.de' THEN now() ELSE NULL END
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

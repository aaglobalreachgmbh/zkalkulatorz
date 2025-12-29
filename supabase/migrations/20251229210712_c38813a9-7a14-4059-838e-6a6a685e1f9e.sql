-- RLS-Policies für Admin-Zugriff auf Benutzerprofile

-- Admins können alle Profile sehen (für Benutzerverwaltung)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
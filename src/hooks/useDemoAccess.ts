// ============================================
// useDemoAccess – Im Demo-Modus wird die Oberfläche wie für einen
// Superadmin angezeigt (alle Menüs/Seiten sichtbar).
// NUR Anzeige: keine echten Rechte, keine Rollenänderung.
// Der Server (RLS) schützt echte Daten weiterhin unverändert.
// ============================================
import { useDemoMode } from "@/hooks/useDemoMode";

export function useDemoAccess(): boolean {
  try {
    return useDemoMode().enabled;
  } catch (err) {
    console.warn("[useDemoAccess] fallback", err);
    return false;
  }
}

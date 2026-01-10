// ============================================
// Customer Safe Mode Hook - Single Source of Truth
// CORRECTED: Only Customer Session triggers safe mode
// POS-Modus ist jetzt ein reiner UI-Modus (Arbeitsplatz)
// ============================================

import { useCustomerSession } from "@/contexts/CustomerSessionContext";

/**
 * Single source of truth for customer-safe mode.
 * Returns true ONLY when customer session is active (customer physically present).
 * 
 * WICHTIG: POS-Modus ist KEIN Sicherheits-Feature mehr!
 * POS-Modus = Arbeitsplatz im Shop (UI-Optimierung)
 * Customer-Session = Kunde physisch anwesend (Sicherheits-Lock)
 * 
 * When this returns true, NO dealer-sensitive data should be rendered.
 * This includes: EK prices, margins, provisions, OMO rates, etc.
 */
export function useCustomerSafeMode(): boolean {
  const { session } = useCustomerSession();
  
  // NUR Customer-Session aktiviert den Safe-Mode
  // POS-Modus ist davon unabhängig
  return session.isActive;
}
